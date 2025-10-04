-- Add business_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.profiles.business_name IS 'The name of the business that will be shown on public schedules';
