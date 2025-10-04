-- Add RLS policies for profiles table to allow public access to public_slug and display_name

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read access to profiles for public schedule viewing
-- This allows anonymous users to find a user by their public_slug
CREATE POLICY "Allow public read access for public schedules" ON profiles
    FOR SELECT
    TO anon
    USING (public_slug IS NOT NULL);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);
