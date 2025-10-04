-- Test script to manually update profile with image URLs
-- This will help us verify if the database update works

-- First, let's see what images are available
SELECT 
  name,
  created_at
FROM storage.objects 
WHERE bucket_id = 'public-images' 
  AND name LIKE 'uploads/%'
ORDER BY created_at DESC
LIMIT 5;

-- Then manually update the profile with a test URL
UPDATE public.profiles 
SET 
  logo_url = 'https://rxrjvabqtnhxlivpdrbd.supabase.co/storage/v1/object/public/public-images/uploads/test-logo.jpg',
  banner_url = 'https://rxrjvabqtnhxlivpdrbd.supabase.co/storage/v1/object/public/public-images/uploads/test-banner.jpg'
WHERE id = auth.uid();

-- Check if the update worked
SELECT 
  id,
  display_name,
  logo_url,
  banner_url
FROM public.profiles 
WHERE id = auth.uid();
