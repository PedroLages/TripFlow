-- =====================================================
-- Fix Circular RLS Dependency
-- =====================================================
-- This migration creates a SECURITY DEFINER function
-- to check trip membership without triggering RLS,
-- preventing infinite recursion.

-- Create helper function to check if user is a trip member
-- SECURITY DEFINER means it runs with the privileges of the function owner,
-- bypassing RLS policies and preventing circular dependencies
CREATE OR REPLACE FUNCTION is_trip_member_helper(
  p_trip_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id
      AND user_id = p_user_id
  );
END;
$$;

-- Create helper function to check if user is a trip editor
CREATE OR REPLACE FUNCTION is_trip_editor_helper(
  p_trip_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trip_members
    WHERE trip_id = p_trip_id
      AND user_id = p_user_id
      AND role = 'Editor'
  );
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

-- Create new policies using SECURITY DEFINER functions
-- These functions bypass RLS and prevent circular dependencies

-- Policy 1: View trips (owner OR member)
CREATE POLICY "trips_select_policy" ON trips
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    is_trip_member_helper(id, auth.uid())
  );

-- Policy 2: Create trips (authenticated users only)
CREATE POLICY "trips_insert_policy" ON trips
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
  );

-- Policy 3: Update trips (owner OR editor)
CREATE POLICY "trips_update_policy" ON trips
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR
    is_trip_editor_helper(id, auth.uid())
  );

-- Policy 4: Delete trips (owner only)
CREATE POLICY "trips_delete_policy" ON trips
  FOR DELETE
  USING (
    auth.uid() = owner_id
  );

-- Ensure RLS is enabled
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Comments
COMMENT ON FUNCTION is_trip_member_helper IS
  'Helper function to check trip membership without triggering RLS (SECURITY DEFINER)';
COMMENT ON FUNCTION is_trip_editor_helper IS
  'Helper function to check if user is a trip editor without triggering RLS (SECURITY DEFINER)';
