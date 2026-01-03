-- Nuclear Option: Drop ALL Policies and Recreate From Scratch
-- This ensures no orphaned or incorrectly named policies remain

-- ========================================
-- STEP 1: Drop ALL policies on trips table
-- ========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'trips'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON trips';
    END LOOP;
END $$;

-- ========================================
-- STEP 2: Drop ALL policies on trip_members table
-- ========================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'trip_members'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON trip_members';
    END LOOP;
END $$;

-- ========================================
-- STEP 3: Recreate trips policies (NO RECURSION)
-- ========================================

-- SELECT: Only owners can view (members use get_member_trips RPC)
CREATE POLICY "trips_select_policy"
  ON trips FOR SELECT
  USING (auth.uid() = owner_id);

-- INSERT: Only authenticated users can create trips they own
CREATE POLICY "trips_insert_policy"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owners can update
CREATE POLICY "trips_update_policy"
  ON trips FOR UPDATE
  USING (auth.uid() = owner_id);

-- DELETE: Only owners can delete
CREATE POLICY "trips_delete_policy"
  ON trips FOR DELETE
  USING (auth.uid() = owner_id);

-- ========================================
-- STEP 4: Recreate trip_members policies (NO RECURSION)
-- ========================================

-- SELECT: Users can view members if they own the trip OR view their own membership
CREATE POLICY "trip_members_select_policy"
  ON trip_members FOR SELECT
  USING (
    -- Can view if you own the trip
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
    -- OR if you're viewing your own membership
    OR trip_members.user_id = auth.uid()
  );

-- INSERT: Only trip owners can add members
CREATE POLICY "trip_members_insert_policy"
  ON trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- UPDATE: Only trip owners can update member roles
CREATE POLICY "trip_members_update_policy"
  ON trip_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- DELETE: Owners can remove members OR users can remove themselves
CREATE POLICY "trip_members_delete_policy"
  ON trip_members FOR DELETE
  USING (
    trip_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- ========================================
-- STEP 5: Verify RPC function exists
-- ========================================
-- Recreate get_member_trips function to ensure it exists
CREATE OR REPLACE FUNCTION get_member_trips()
RETURNS SETOF trips
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT t.*
  FROM trips t
  INNER JOIN trip_members tm ON tm.trip_id = t.id
  WHERE tm.user_id = auth.uid();
$$;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION get_member_trips() TO authenticated;

-- ========================================
-- VERIFICATION
-- ========================================
-- Run this query manually to verify policies are correct:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('trips', 'trip_members') ORDER BY tablename, policyname;
