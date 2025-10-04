-- Add public_slug to profiles table for permanent user sharing links
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Generate unique slugs for existing users
UPDATE profiles 
SET public_slug = SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)
WHERE public_slug IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_public_slug ON profiles(public_slug);

-- Remove public_slug from schedules table since it's now per-user
ALTER TABLE schedules DROP COLUMN IF EXISTS public_slug;
