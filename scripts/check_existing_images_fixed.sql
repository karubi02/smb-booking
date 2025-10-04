-- Fixed script to check existing uploaded images
-- This script will show you what images are already uploaded

-- Step 1: List all uploaded images in the public-images bucket (without size column)
SELECT 
  name,
  created_at,
  updated_at
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

-- Step 3: Count how many images are uploaded
SELECT COUNT(*) as total_uploaded_images
FROM storage.objects 
WHERE bucket_id = 'public-images' 
  AND name LIKE 'uploads/%';
