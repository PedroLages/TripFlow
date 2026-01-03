-- Fix invitation unique constraint to allow multiple accepted/declined invitations
-- while still preventing duplicate pending invitations

-- Drop the old constraint that applies to all statuses
ALTER TABLE trip_invitations
DROP CONSTRAINT IF EXISTS trip_invitations_trip_id_invitee_email_status_key;

-- Add a partial unique index that only applies to pending invitations
-- This allows multiple accepted/declined/expired invitations for the same email/trip
-- but prevents duplicate pending invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_trip_invitations_unique_pending
ON trip_invitations (trip_id, invitee_email)
WHERE status = 'pending';

-- Add comment explaining the constraint
COMMENT ON INDEX idx_trip_invitations_unique_pending IS
'Ensures only one pending invitation per email per trip. Multiple accepted/declined/expired invitations are allowed.';
