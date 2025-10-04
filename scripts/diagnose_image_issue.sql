-- Diagnostic script to check image upload issues

-- Step 1: Check if the columns exist in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('logo_url', 'banner_url');

-- Step 2: Check current user's profile data
SELECT 
  id,
  display_name,
  business_name,
  logo_url,
  banner_url,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Step 3: Check what images are currently uploaded
SELECT 
  name,
  created_at
FROM storage.objects 
WHERE bucket_id = 'public-images' 
  AND name LIKE 'uploads/%'
ORDER BY created_at DESC;

-- Step 4: Check if storage bucket exists and is public
SELECT id, name, public, created_at
FROM storage.buckets 
WHERE id = 'public-images';
