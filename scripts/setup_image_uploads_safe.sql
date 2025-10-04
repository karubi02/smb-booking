-- Safe setup script for image uploads functionality
-- This script handles existing policies and columns gracefully

-- Step 1: Add logo_url and banner_url columns to profiles table (safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.profiles.logo_url IS 'URL of the business logo image for display on public schedules';
COMMENT ON COLUMN public.profiles.banner_url IS 'URL of the banner image for public schedule customization';

-- Step 2: Create storage bucket for public images (safe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-images', 'public-images', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;

-- Step 4: Create storage policies for public-images bucket
-- Allow everyone to view images (for public display)
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-images' AND auth.role() = 'authenticated');

-- Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'public-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'public-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Step 5: Verify the setup
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('logo_url', 'banner_url');

-- Step 6: Check if storage bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'public-images';
