-- =====================================================
-- Trip Invitations System
-- =====================================================
-- This migration creates the trip_invitations table and RLS policies
-- for the email invitation system.

-- Create trip_invitations table
CREATE TABLE IF NOT EXISTS trip_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Editor', 'Viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(trip_id, invitee_email, status),  -- Prevent duplicate pending invitations
  CONSTRAINT valid_acceptance_time CHECK (accepted_at IS NULL OR accepted_at >= created_at),
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Add indexes for performance
CREATE INDEX idx_trip_invitations_trip_id ON trip_invitations(trip_id);
CREATE INDEX idx_trip_invitations_invitee_email ON trip_invitations(invitee_email);
CREATE INDEX idx_trip_invitations_token ON trip_invitations(invitation_token);
CREATE INDEX idx_trip_invitations_status ON trip_invitations(status);
CREATE INDEX idx_trip_invitations_expires_at ON trip_invitations(expires_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE trip_invitations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Trip Editors can view all invitations for their trips
CREATE POLICY "Trip Editors can view invitations"
  ON trip_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_invitations.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'Editor'
    )
    OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_invitations.trip_id
        AND trips.owner_id = auth.uid()
    )
  );

-- Policy 2: Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
  ON trip_invitations
  FOR SELECT
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 3: Public can view invitations by token (for acceptance page)
-- This is needed for unauthenticated users to view the invitation before accepting
CREATE POLICY "Public can view invitations by token"
  ON trip_invitations
  FOR SELECT
  USING (true);  -- We'll validate the token in the application logic

-- Policy 4: Trip Editors can create invitations
CREATE POLICY "Trip Editors can create invitations"
  ON trip_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_invitations.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'Editor'
    )
    OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_invitations.trip_id
        AND trips.owner_id = auth.uid()
    )
  );

-- Policy 5: Users can update their own invitations (accept/decline)
CREATE POLICY "Users can update their own invitations"
  ON trip_invitations
  FOR UPDATE
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 6: Trip Editors can delete invitations (revoke)
CREATE POLICY "Trip Editors can delete invitations"
  ON trip_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_invitations.trip_id
        AND trip_members.user_id = auth.uid()
        AND trip_members.role = 'Editor'
    )
    OR
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_invitations.trip_id
        AND trips.owner_id = auth.uid()
    )
  );

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE trip_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

-- Create a scheduled job to expire invitations daily
-- Note: This requires pg_cron extension which may need to be enabled
-- For now, we'll rely on checking expiration in application logic

-- =====================================================
-- Helper function to accept invitation
-- =====================================================

CREATE OR REPLACE FUNCTION accept_invitation(
  p_invitation_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation trip_invitations%ROWTYPE;
  v_user_id UUID;
  v_user_email TEXT;
  v_existing_member trip_members%ROWTYPE;
BEGIN
  -- Get the current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Fetch the invitation
  SELECT * INTO v_invitation
  FROM trip_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending';

  -- Validate invitation exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check if invitation has expired
  IF v_invitation.expires_at < NOW() THEN
    UPDATE trip_invitations
    SET status = 'expired'
    WHERE id = v_invitation.id;

    RETURN json_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Check if email matches
  IF v_invitation.invitee_email != v_user_email THEN
    RETURN json_build_object('success', false, 'error', 'This invitation was sent to a different email address');
  END IF;

  -- Check if user is already a member
  SELECT * INTO v_existing_member
  FROM trip_members
  WHERE trip_id = v_invitation.trip_id
    AND user_id = v_user_id;

  IF FOUND THEN
    -- Update existing membership role if different
    IF v_existing_member.role != v_invitation.role THEN
      UPDATE trip_members
      SET role = v_invitation.role
      WHERE trip_id = v_invitation.trip_id
        AND user_id = v_user_id;
    END IF;
  ELSE
    -- Add user as trip member
    INSERT INTO trip_members (trip_id, user_id, role)
    VALUES (v_invitation.trip_id, v_user_id, v_invitation.role);
  END IF;

  -- Mark invitation as accepted
  UPDATE trip_invitations
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invitation.id;

  -- Return success with trip details
  RETURN json_build_object(
    'success', true,
    'trip_id', v_invitation.trip_id,
    'role', v_invitation.role
  );
END;
$$;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE trip_invitations IS 'Stores email invitations for trip collaboration';
COMMENT ON COLUMN trip_invitations.invitation_token IS 'Unique token used in invitation link';
COMMENT ON COLUMN trip_invitations.status IS 'Invitation status: pending, accepted, declined, or expired';
COMMENT ON COLUMN trip_invitations.expires_at IS 'Invitation expiration timestamp (default: 7 days from creation)';

COMMENT ON FUNCTION accept_invitation IS 'Accepts a trip invitation and adds the user as a trip member';
COMMENT ON FUNCTION expire_old_invitations IS 'Marks expired pending invitations as expired';
