-- Migration: Add sidebar_collapsed to profiles table
-- Date: 2026-01-01
-- Description: Adds sidebar collapse state to user profiles for cross-device sync

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS sidebar_collapsed boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.sidebar_collapsed IS 'User preference for sidebar collapse state (synced across devices)';
