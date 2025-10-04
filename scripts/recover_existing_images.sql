-- Script to help recover and connect existing uploaded images
-- This will show you what images are already uploaded and help you connect them

-- Step 1: List all uploaded images in the public-images bucket
SELECT 
  name,
  created_at,
  updated_at,
  size,
  metadata
FROM storage.objects 
WHERE bucket_id = 'public-images' 
  AND name LIKE 'uploads/%'
ORDER BY created_at DESC;

-- Step 2: Show current user's profile data
SELECT 
  id,
  display_name,
  business_name,
  logo_url,
  banner_url,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Step 3: Generate public URLs for uploaded images
-- Replace 'YOUR_PROJECT_REF' with your actual Supabase project reference
SELECT 
  name as file_path,
  'https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/public-images/' || name as public_url,
  created_at
FROM storage.objects 
WHERE bucket_id = 'public-images' 
  AND name LIKE 'uploads/%'
ORDER BY created_at DESC
LIMIT 10;
