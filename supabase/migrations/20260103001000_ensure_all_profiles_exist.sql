-- Ensure all authenticated users have profiles
-- This fixes any missing profiles that might be causing 401 errors in Edge Functions

-- Insert profiles for any auth.users that don't have a profile yet
INSERT INTO profiles (id, email, full_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) as full_name
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Log the number of profiles created
DO $$
DECLARE
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO profile_count FROM profiles;
  RAISE NOTICE 'Total profiles in database: %', profile_count;
END $$;
