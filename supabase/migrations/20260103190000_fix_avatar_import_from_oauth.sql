-- Fix avatar import from Google OAuth
-- The handle_new_user trigger was only extracting full_name, not avatar_url
-- This migration updates the trigger and backfills existing users

-- Update the trigger function to extract avatar_url from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill avatar_url for existing users who signed in with Google OAuth
-- Only update if avatar_url is currently NULL and user has OAuth avatar data
UPDATE profiles p
SET avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') IS NOT NULL;

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM profiles
  WHERE avatar_url IS NOT NULL;

  RAISE NOTICE 'Profiles with avatars: %', updated_count;
END $$;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user IS 'Auto-create profile on user signup, extracting full_name and avatar_url from OAuth metadata';
