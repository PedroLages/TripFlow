-- Fix Infinite Recursion in trip_members INSERT Policy
-- The previous policy created circular dependency by checking trip_members while inserting into trip_members

-- Drop the problematic policies
DROP POLICY IF EXISTS "Owners and editors can add members" ON trip_members;
DROP POLICY IF EXISTS "Owners can add members" ON trip_members;

-- Create a simpler policy that only checks trip ownership
-- The Edge Function will handle the "editors can add members" logic
CREATE POLICY "Owners can add members"
  ON trip_members FOR INSERT
  WITH CHECK (
    -- Only check if user is the trip owner
    -- This avoids circular dependency when the trigger adds the owner as a member
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_members.trip_id
      AND trips.owner_id = auth.uid()
    )
  );

-- Note: Editors can also add members, but this is enforced by the Edge Function
-- (send-invitation) which checks the user's role before creating the invitation.
-- RLS only enforces that the owner can add members directly.
