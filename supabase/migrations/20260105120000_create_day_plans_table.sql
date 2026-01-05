-- Create day_plans table for itinerary phase organization
-- Each day_plan represents a single day in a trip's itinerary

CREATE TABLE IF NOT EXISTS day_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one day_plan per date per trip
  UNIQUE(trip_id, date)
);

-- Index for faster queries by trip
CREATE INDEX IF NOT EXISTS day_plans_trip_id_idx ON day_plans(trip_id);

-- Index for date sorting
CREATE INDEX IF NOT EXISTS day_plans_date_idx ON day_plans(date);

-- RLS Policies
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;

-- Users can view day_plans for trips they're members of
CREATE POLICY "Users can view day_plans for their trips"
  ON day_plans
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM trips
      WHERE owner_id = auth.uid()

      UNION

      SELECT trip_id FROM trip_members
      WHERE user_id = auth.uid()
        AND accepted_at IS NOT NULL
    )
  );

-- Trip owners and editors can insert day_plans
CREATE POLICY "Trip owners and editors can insert day_plans"
  ON day_plans
  FOR INSERT
  WITH CHECK (
    trip_id IN (
      SELECT id FROM trips
      WHERE owner_id = auth.uid()

      UNION

      SELECT trip_id FROM trip_members
      WHERE user_id = auth.uid()
        AND role = 'Editor'
        AND accepted_at IS NOT NULL
    )
  );

-- Trip owners and editors can update day_plans
CREATE POLICY "Trip owners and editors can update day_plans"
  ON day_plans
  FOR UPDATE
  USING (
    trip_id IN (
      SELECT id FROM trips
      WHERE owner_id = auth.uid()

      UNION

      SELECT trip_id FROM trip_members
      WHERE user_id = auth.uid()
        AND role = 'Editor'
        AND accepted_at IS NOT NULL
    )
  );

-- Trip owners and editors can delete day_plans
CREATE POLICY "Trip owners and editors can delete day_plans"
  ON day_plans
  FOR DELETE
  USING (
    trip_id IN (
      SELECT id FROM trips
      WHERE owner_id = auth.uid()

      UNION

      SELECT trip_id FROM trip_members
      WHERE user_id = auth.uid()
        AND role = 'Editor'
        AND accepted_at IS NOT NULL
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_day_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER day_plans_updated_at_trigger
  BEFORE UPDATE ON day_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_day_plans_updated_at();

-- Comments
COMMENT ON TABLE day_plans IS 'Daily itinerary phases for trips';
COMMENT ON COLUMN day_plans.id IS 'Unique identifier for the day plan';
COMMENT ON COLUMN day_plans.trip_id IS 'Foreign key to trips table';
COMMENT ON COLUMN day_plans.date IS 'The date for this day plan';
COMMENT ON COLUMN day_plans.created_at IS 'Timestamp when day plan was created';
COMMENT ON COLUMN day_plans.updated_at IS 'Timestamp when day plan was last updated';
