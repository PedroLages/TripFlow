-- Function to get invitation details by token (public access for preview)
-- This allows unauthenticated users to see what trip they're being invited to

CREATE OR REPLACE FUNCTION get_invitation_details(
  p_invitation_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation trip_invitations%ROWTYPE;
  v_trip trips%ROWTYPE;
  v_inviter_profile profiles%ROWTYPE;
BEGIN
  -- Fetch the invitation
  SELECT * INTO v_invitation
  FROM trip_invitations
  WHERE invitation_token = p_invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  -- Check if invitation exists and is valid
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired invitation'
    );
  END IF;

  -- Fetch trip details
  SELECT * INTO v_trip
  FROM trips
  WHERE id = v_invitation.trip_id;

  -- Fetch inviter profile
  SELECT * INTO v_inviter_profile
  FROM profiles
  WHERE id = v_invitation.invited_by;

  -- Return invitation details
  RETURN json_build_object(
    'success', true,
    'invitation', json_build_object(
      'id', v_invitation.id,
      'role', v_invitation.role,
      'invitee_email', v_invitation.invitee_email,
      'created_at', v_invitation.created_at,
      'expires_at', v_invitation.expires_at
    ),
    'trip', json_build_object(
      'id', v_trip.id,
      'name', v_trip.name,
      'destinations', v_trip.destinations,
      'start_date', v_trip.start_date,
      'end_date', v_trip.end_date,
      'trip_type', v_trip.trip_type,
      'cover_image', v_trip.cover_image
    ),
    'inviter', json_build_object(
      'email', v_inviter_profile.email,
      'full_name', v_inviter_profile.full_name,
      'avatar_url', v_inviter_profile.avatar_url
    )
  );
END;
$$;

-- Grant execute permission to anonymous users (for invitation preview)
GRANT EXECUTE ON FUNCTION get_invitation_details(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_details(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_invitation_details IS 'Fetches invitation details by token for preview page (accessible to anonymous users)';
