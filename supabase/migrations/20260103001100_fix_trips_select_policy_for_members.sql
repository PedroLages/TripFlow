-- Fix trips SELECT policy to allow trip members to read trips
-- This fixes the 401 error in Edge Functions where members couldn't access trip details

-- Drop the restrictive policy
DROP POLICY IF EXISTS "trips_select_policy" ON trips;

-- Recreate with member access
-- Users can SELECT trips if:
-- 1. They own the trip, OR
-- 2. They are a member of the trip
CREATE POLICY "trips_select_policy"
  ON trips FOR SELECT
  USING (
    -- Trip owner
    auth.uid() = owner_id
    -- OR trip member
    OR EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );

-- Verify the policy
DO $$
BEGIN
  RAISE NOTICE 'trips SELECT policy updated to allow member access';
END $$;
