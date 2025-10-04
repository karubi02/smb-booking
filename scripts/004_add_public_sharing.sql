-- Add public sharing functionality to schedules table
ALTER TABLE public.schedules 
ADD COLUMN is_public boolean DEFAULT false,
ADD COLUMN public_slug text UNIQUE;

-- Create index for public slug lookups
CREATE INDEX idx_schedules_public_slug ON public.schedules(public_slug) WHERE public_slug IS NOT NULL;

-- Create policy for public schedule viewing
CREATE POLICY "Anyone can view public schedules" ON public.schedules
  FOR SELECT USING (is_public = true);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_schedule_slug()
RETURNS text AS $$
DECLARE
  new_slug text;
  slug_exists boolean;
BEGIN
  LOOP
    -- Generate a random 8-character slug
    new_slug := lower(substring(md5(random()::text) from 1 for 8));
    
    -- Check if slug already exists
    SELECT EXISTS(SELECT 1 FROM public.schedules WHERE public_slug = new_slug) INTO slug_exists;
    
    -- If slug doesn't exist, return it
    IF NOT slug_exists THEN
      RETURN new_slug;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
