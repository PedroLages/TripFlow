-- =====================================================
-- Fix RLS Policy Infinite Recursion
-- =====================================================
-- This migration fixes the infinite recursion error by:
-- 1. Dropping all existing policies on trips table
-- 2. Creating simple, non-recursive policies

-- Drop ALL existing policies on trips table (V1 and V2)
DROP POLICY IF EXISTS "v2_view_trips" ON trips;
DROP POLICY IF EXISTS "v2_create_trips" ON trips;
DROP POLICY IF EXISTS "v2_update_trips" ON trips;
DROP POLICY IF EXISTS "v2_delete_trips" ON trips;

-- Drop any V1 policies that might still exist
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "Users can view trips they are members of" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Users can update their own trips" ON trips;
DROP POLICY IF EXISTS "Trip owners can update trips" ON trips;
DROP POLICY IF EXISTS "Trip editors can update trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their own trips" ON trips;
DROP POLICY IF EXISTS "Trip owners can delete trips" ON trips;

-- Drop any existing simple policies
DROP POLICY IF EXISTS "trips_select_policy" ON trips;
DROP POLICY IF EXISTS "trips_insert_policy" ON trips;
DROP POLICY IF EXISTS "trips_update_policy" ON trips;
DROP POLICY IF EXISTS "trips_delete_policy" ON trips;

-- =====================================================
-- Create Simple, Non-Recursive Policies
-- =====================================================

-- Policy 1: View trips (owner OR member)
-- This uses a simple subquery without recursion
CREATE POLICY "trips_select_policy" ON trips
  FOR SELECT
  USING (
    -- User is the owner
    auth.uid() = owner_id
    OR
    -- User is a member (simple EXISTS check, no recursion)
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
    )
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
    -- User is the owner
    auth.uid() = owner_id
    OR
    -- User is an editor
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'Editor'
    )
  );

-- Policy 4: Delete trips (owner only)
CREATE POLICY "trips_delete_policy" ON trips
  FOR DELETE
  USING (
    auth.uid() = owner_id
  );

-- =====================================================
-- Ensure RLS is enabled
-- =====================================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON POLICY "trips_select_policy" ON trips IS
  'Users can view trips they own or are members of';
COMMENT ON POLICY "trips_insert_policy" ON trips IS
  'Authenticated users can create trips';
COMMENT ON POLICY "trips_update_policy" ON trips IS
  'Owners and editors can update trips';
COMMENT ON POLICY "trips_delete_policy" ON trips IS
  'Only owners can delete trips';
