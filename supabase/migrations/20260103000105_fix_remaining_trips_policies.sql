-- Fix Remaining Recursive Policies on trips Table
--
-- The UPDATE and DELETE policies still reference trip_members,
-- creating circular dependency with trip_members policies

-- Drop recursive UPDATE policy
DROP POLICY IF EXISTS "Owners and editors can update trips" ON trips;

-- Create simplified UPDATE policy (only owners can update via RLS)
-- Editors can update via Edge Functions with SECURITY DEFINER
CREATE POLICY "Owners can update trips"
  ON trips FOR UPDATE
  USING (auth.uid() = owner_id);

-- The DELETE policy is already non-recursive (only checks ownership)
-- but let's ensure it exists with the correct name
DROP POLICY IF EXISTS "Owners can delete trips" ON trips;

CREATE POLICY "Owners can delete trips"
  ON trips FOR DELETE
  USING (auth.uid() = owner_id);

-- The INSERT policy is already non-recursive (only checks ownership)
-- but let's ensure it exists with the correct name
DROP POLICY IF EXISTS "Users can create trips" ON trips;

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- ========================================
-- NOTES
-- ========================================
-- Now ALL trips policies avoid circular dependencies:
-- - SELECT: Only checks ownership (members get trips via get_member_trips RPC)
-- - INSERT: Only checks ownership
-- - UPDATE: Only checks ownership (editors update via Edge Functions)
-- - DELETE: Only checks ownership
--
-- This completely breaks the circular dependency between trips and trip_members.
