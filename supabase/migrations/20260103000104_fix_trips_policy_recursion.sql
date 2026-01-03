-- Fix Circular Recursion between trips and trip_members RLS Policies
--
-- Problem: trips SELECT checks trip_members, trip_members SELECT checks trips
-- Solution: Simplify trips SELECT to only check ownership

-- Drop existing trips SELECT policy
DROP POLICY IF EXISTS "Users can view their trips" ON trips;

-- Create simplified policy that only checks direct ownership
-- This breaks the circular dependency
CREATE POLICY "Users can view their owned trips"
  ON trips FOR SELECT
  USING (auth.uid() = owner_id);

-- Create a database function to get trips where user is a member
-- This uses SECURITY DEFINER to bypass RLS and safely query both tables
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_member_trips() TO authenticated;

-- ========================================
-- NOTES
-- ========================================
-- The frontend should now:
-- 1. Query trips table directly (will only return owned trips via RLS)
-- 2. Call get_member_trips() function (will return trips where user is a member)
-- 3. Merge both result sets
--
-- This avoids circular RLS policy dependencies while maintaining security.
