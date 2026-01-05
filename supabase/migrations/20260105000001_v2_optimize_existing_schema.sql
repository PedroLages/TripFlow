-- =====================================================
-- V2 Schema Optimization (Existing Tables Only)
-- Created: 2026-01-05
-- Purpose: Optimize trips, trip_members, trip_invitations, profiles
-- =====================================================

-- =====================================================
-- PART 1: Performance Indexes (Existing Tables Only)
-- =====================================================

-- Trip queries (most common operations)
CREATE INDEX IF NOT EXISTS idx_trips_owner_id
  ON trips(owner_id);

CREATE INDEX IF NOT EXISTS idx_trips_created_at
  ON trips(created_at DESC);

-- Mobile dashboard: Sort trips by recent first
CREATE INDEX IF NOT EXISTS idx_trips_mobile_dashboard
  ON trips(owner_id, created_at DESC);

-- Collaboration queries
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id
  ON trip_members(user_id);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id
  ON trip_members(trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_members_role
  ON trip_members(trip_id, role);

-- Note: trip_invitations indexes already created in 20260103000000_trip_invitations.sql
-- - idx_trip_invitations_trip_id
-- - idx_trip_invitations_invitee_email
-- - idx_trip_invitations_token
-- - idx_trip_invitations_status
-- - idx_trip_invitations_expires_at

-- Profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email);

-- =====================================================
-- PART 2: Data Integrity Constraints (Existing Tables)
-- =====================================================

-- Ensure trips have valid date ranges (if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'start_date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_valid_dates;
    ALTER TABLE trips ADD CONSTRAINT trips_valid_dates
      CHECK (end_date >= start_date);
  END IF;
END $$;

-- Ensure budget is non-negative (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'budget'
  ) THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_positive_budget;
    ALTER TABLE trips ADD CONSTRAINT trips_positive_budget
      CHECK (budget >= 0);
  END IF;
END $$;

-- Ensure valid trip member roles
ALTER TABLE trip_members
  DROP CONSTRAINT IF EXISTS trip_members_valid_role;

ALTER TABLE trip_members
  ADD CONSTRAINT trip_members_valid_role
  CHECK (role IN ('Owner', 'Editor', 'Viewer'));

-- Ensure valid invitation status
ALTER TABLE trip_invitations
  DROP CONSTRAINT IF EXISTS trip_invitations_valid_status;

ALTER TABLE trip_invitations
  ADD CONSTRAINT trip_invitations_valid_status
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

-- =====================================================
-- PART 3: Simplified RLS Policies (V2 Clean Version)
-- =====================================================

-- Drop all existing trip policies
DROP POLICY IF EXISTS "Users can view their trips" ON trips;
DROP POLICY IF EXISTS "Users can view their own trips" ON trips;
DROP POLICY IF EXISTS "view_own_trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "create_trips" ON trips;
DROP POLICY IF EXISTS "Users can update their trips" ON trips;
DROP POLICY IF EXISTS "Owners and editors can update trips" ON trips;
DROP POLICY IF EXISTS "update_own_trips" ON trips;
DROP POLICY IF EXISTS "Users can delete their trips" ON trips;
DROP POLICY IF EXISTS "Owners can delete trips" ON trips;
DROP POLICY IF EXISTS "delete_own_trips" ON trips;

-- Create V2 simplified policies

-- 1. View trips (owner OR member)
CREATE POLICY "v2_view_trips" ON trips
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );

-- 2. Create trips (authenticated users only)
CREATE POLICY "v2_create_trips" ON trips
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
  );

-- 3. Update trips (owner OR editor)
CREATE POLICY "v2_update_trips" ON trips
  FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role IN ('Owner', 'Editor')
    )
  );

-- 4. Delete trips (owner only)
CREATE POLICY "v2_delete_trips" ON trips
  FOR DELETE
  USING (
    auth.uid() = owner_id
  );

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ V2 Schema Optimization Complete!';
  RAISE NOTICE '📊 Optimized existing tables: trips, trip_members, trip_invitations, profiles';
  RAISE NOTICE '🛡️ Simplified RLS policies (4 clean policies)';
END $$;
