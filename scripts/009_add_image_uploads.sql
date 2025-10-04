-- Add logo_url and banner_url columns to profiles table for image uploads
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN public.profiles.logo_url IS 'URL of the business logo image for display on public schedules';
COMMENT ON COLUMN public.profiles.banner_url IS 'URL of the banner image for public schedule customization';
