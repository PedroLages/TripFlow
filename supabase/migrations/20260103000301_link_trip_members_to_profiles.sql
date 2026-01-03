-- Link trip_members to profiles table
-- This enables the frontend to join trip_members with profiles for crew member display

-- First, ensure all trip_members.user_id values exist in profiles
-- (This should already be true from the profiles backfill, but let's be safe)
INSERT INTO profiles (id, email, full_name)
SELECT DISTINCT
  tm.user_id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name
FROM trip_members tm
JOIN auth.users u ON u.id = tm.user_id
WHERE tm.user_id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Drop the existing foreign key to auth.users if it exists
ALTER TABLE trip_members
  DROP CONSTRAINT IF EXISTS trip_members_user_id_fkey;

-- Add foreign key to profiles instead
ALTER TABLE trip_members
  ADD CONSTRAINT trip_members_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Add comment explaining the relationship
COMMENT ON CONSTRAINT trip_members_user_id_fkey ON trip_members IS
  'Links trip members to user profiles for displaying crew member information';
