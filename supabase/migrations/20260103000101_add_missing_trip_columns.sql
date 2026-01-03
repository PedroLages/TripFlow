-- Add Missing Columns to Trips Table
-- Fixes the schema to match what the Edge Function expects

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'status'
  ) THEN
    ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'upcoming', 'active', 'completed', 'cancelled'));
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE trips ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user ON trip_members(user_id);

-- Add RLS policies if they don't exist

-- Enable RLS (safe to run multiple times)
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them (idempotent)
DROP POLICY IF EXISTS "Users can view their trips" ON trips;
DROP POLICY IF EXISTS "Users can create trips" ON trips;
DROP POLICY IF EXISTS "Owners and editors can update trips" ON trips;
DROP POLICY IF EXISTS "Owners can delete trips" ON trips;

DROP POLICY IF EXISTS "Users can view trip members" ON trip_members;
DROP POLICY IF EXISTS "Owners and editors can add members" ON trip_members;
DROP POLICY IF EXISTS "Owners and editors can update members" ON trip_members;
DROP POLICY IF EXISTS "Owners, editors, and self can remove members" ON trip_members;

-- Recreate policies
CREATE POLICY "Users can view their trips"
  ON trips FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners and editors can update trips"
  ON trips FOR UPDATE
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'Editor'
    )
  );

CREATE POLICY "Owners can delete trips"
  ON trips FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view trip members"
  ON trip_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND (
        trips.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners and editors can add members"
  ON trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND (
        trips.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'Editor'
        )
      )
    )
  );

CREATE POLICY "Owners and editors can update members"
  ON trip_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND (
        trips.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'Editor'
        )
      )
    )
  );

CREATE POLICY "Owners, editors, and self can remove members"
  ON trip_members FOR DELETE
  USING (
    trip_members.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND (
        trips.owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM trip_members tm
          WHERE tm.trip_id = trips.id
          AND tm.user_id = auth.uid()
          AND tm.role = 'Editor'
        )
      )
    )
  );

-- Create functions if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO trip_members (trip_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.owner_id, 'Editor', NEW.owner_id)
  ON CONFLICT (trip_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers if they don't exist
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS add_owner_as_member_trigger ON trips;
CREATE TRIGGER add_owner_as_member_trigger
  AFTER INSERT ON trips
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();
