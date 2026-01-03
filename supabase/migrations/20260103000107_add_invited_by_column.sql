-- Add missing invited_by column to trip_members table
-- This column tracks who invited each member to the trip

-- Add the invited_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_members' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE trip_members
    ADD COLUMN invited_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_trip_members_invited_by ON trip_members(invited_by);

-- Comment for documentation
COMMENT ON COLUMN trip_members.invited_by IS 'User who invited this member to the trip (NULL for trip owners who auto-joined)';
