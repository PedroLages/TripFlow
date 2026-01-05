-- =============================================
-- Migration: Recreate Activities Table for V2
-- Description: Drop old V1 activities table and create new V2 schema
-- =============================================

-- Drop old activities table (this will cascade delete all existing activities)
DROP TABLE IF EXISTS activities CASCADE;

-- Create activities table with V2 schema
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  activity_date DATE NOT NULL, -- Date of the activity
  activity_time TIME, -- Optional time
  location TEXT, -- Optional location
  notes TEXT, -- Optional notes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT activities_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Add indexes for performance
CREATE INDEX activities_trip_id_idx ON activities(trip_id);
CREATE INDEX activities_activity_date_idx ON activities(activity_date);
CREATE INDEX activities_trip_date_idx ON activities(trip_id, activity_date);

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
-- Users can view activities if they have access to the trip
CREATE POLICY "activities_select_policy" ON activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR is_trip_member_helper(trips.id, auth.uid())
        )
    )
  );

-- Users can insert activities if they have Editor or Owner access to the trip
CREATE POLICY "activities_insert_policy" ON activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR is_trip_editor_helper(trips.id, auth.uid())
        )
    )
  );

-- Users can update activities if they have Editor or Owner access to the trip
CREATE POLICY "activities_update_policy" ON activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR is_trip_editor_helper(trips.id, auth.uid())
        )
    )
  );

-- Users can delete activities if they have Editor or Owner access to the trip
CREATE POLICY "activities_delete_policy" ON activities
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = activities.trip_id
        AND (
          trips.owner_id = auth.uid()
          OR is_trip_editor_helper(trips.id, auth.uid())
        )
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activities_updated_at_trigger
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Comments
COMMENT ON TABLE activities IS 'Trip itinerary activities (V2)';
COMMENT ON COLUMN activities.trip_id IS 'Foreign key to trips table';
COMMENT ON COLUMN activities.name IS 'Activity name (e.g., "Visit Senso-ji Temple")';
COMMENT ON COLUMN activities.activity_date IS 'Date of the activity';
COMMENT ON COLUMN activities.activity_time IS 'Optional time of the activity';
COMMENT ON COLUMN activities.location IS 'Optional location (e.g., "Asakusa, Tokyo")';
COMMENT ON COLUMN activities.notes IS 'Optional notes or details';
