-- Fix ALL Recursive Policies on trip_members
-- Remove all policies that query trip_members while operating on trip_members

-- Drop all existing policies (including any variations)
DROP POLICY IF EXISTS "Users can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Trip owners can view members" ON trip_members;
DROP POLICY IF EXISTS "Users can view own membership" ON trip_members;
DROP POLICY IF EXISTS "Owners and editors can add members" ON trip_members;
DROP POLICY IF EXISTS "Owners can add members" ON trip_members;
DROP POLICY IF EXISTS "Owners and editors can update members" ON trip_members;
DROP POLICY IF EXISTS "Owners can update members" ON trip_members;
DROP POLICY IF EXISTS "Owners, editors, and self can remove members" ON trip_members;
DROP POLICY IF EXISTS "Owners can remove members or self removal" ON trip_members;

-- ========================================
-- NEW POLICIES WITHOUT RECURSION
-- ========================================

-- 1. SELECT Policy: Users can view members of trips they own
--    (Simplified to avoid recursion - only checks trips table)
CREATE POLICY "Trip owners can view members"
  ON trip_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- 2. SELECT Policy: Users can view their own membership
CREATE POLICY "Users can view own membership"
  ON trip_members FOR SELECT
  USING (trip_members.user_id = auth.uid());

-- 3. INSERT Policy: Only trip owners can add members
--    (The Edge Function handles authorization for editors)
CREATE POLICY "Owners can add members"
  ON trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- 4. UPDATE Policy: Only trip owners can update member roles
CREATE POLICY "Owners can update members"
  ON trip_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- 5. DELETE Policy: Owners can remove members OR users can remove themselves
CREATE POLICY "Owners can remove members or self removal"
  ON trip_members FOR DELETE
  USING (
    trip_members.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- ========================================
-- NOTES
-- ========================================
-- These simplified policies only check:
-- 1. If the user is the trip owner (via trips table)
-- 2. If the user is acting on their own membership
--
-- More complex authorization (e.g., "editors can invite members")
-- is handled by the Edge Function layer, not RLS.
-- This avoids infinite recursion while maintaining security.
