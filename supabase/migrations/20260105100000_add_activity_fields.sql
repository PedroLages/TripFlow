-- =============================================
-- Migration: Add Missing Activity Fields
-- Description: Add activity_type, start_time, end_time, cost, icon_name to match UI
-- =============================================

-- Add activity_type column (maps to ActivityType enum in types.ts)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS activity_type TEXT CHECK (
  activity_type IN (
    'Attraction',
    'Restaurant',
    'Transportation',
    'Accommodation',
    'Tour',
    'Free time',
    'Custom'
  )
) DEFAULT 'Custom';

-- Add start_time and end_time (replacing single activity_time)
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Migrate existing activity_time to start_time
UPDATE activities
SET start_time = activity_time
WHERE activity_time IS NOT NULL AND start_time IS NULL;

-- Add cost column
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0;

-- Add icon_name for custom activity icons
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS icon_name TEXT;

-- Create index on activity_type for filtering
CREATE INDEX IF NOT EXISTS activities_activity_type_idx ON activities(activity_type);

-- Comments for new columns
COMMENT ON COLUMN activities.activity_type IS 'Type of activity (Attraction, Restaurant, etc.)';
COMMENT ON COLUMN activities.start_time IS 'Activity start time';
COMMENT ON COLUMN activities.end_time IS 'Activity end time';
COMMENT ON COLUMN activities.cost IS 'Estimated cost for this activity';
COMMENT ON COLUMN activities.icon_name IS 'Custom icon identifier for the activity';

-- Note: We keep activity_time for backward compatibility
-- New records should use start_time/end_time instead
COMMENT ON COLUMN activities.activity_time IS 'DEPRECATED: Use start_time/end_time instead';
