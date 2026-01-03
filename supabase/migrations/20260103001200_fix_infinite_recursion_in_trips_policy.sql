-- Fix infinite recursion in trips SELECT policy
-- The previous policy caused recursion by checking trip_members directly in an EXISTS subquery
-- Solution: Use the existing is_trip_member() security definer function which bypasses RLS

-- Drop the problematic policy
DROP POLICY IF EXISTS "trips_select_policy" ON trips;

-- Recreate policy using the existing security definer function
-- This avoids infinite recursion because the function bypasses RLS
CREATE POLICY "trips_select_policy"
  ON trips FOR SELECT
  USING (
    -- Trip owner
    auth.uid() = owner_id
    -- OR trip member (checked via existing security definer function)
    OR is_trip_member(id)
  );

-- Verify the policy
DO $$
BEGIN
  RAISE NOTICE 'trips SELECT policy updated to use is_trip_member() function to prevent infinite recursion';
END $$;
