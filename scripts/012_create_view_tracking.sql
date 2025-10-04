-- Create view tracking table for public schedule views
CREATE TABLE IF NOT EXISTS public.schedule_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  public_slug text NOT NULL,
  ip_address text,
  user_agent text,
  referrer text,
  viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_schedule_views_user_id ON public.schedule_views(user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_views_viewed_at ON public.schedule_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_schedule_views_public_slug ON public.schedule_views(public_slug);

-- Enable RLS
ALTER TABLE public.schedule_views ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own view data
CREATE POLICY "Users can view their own schedule views" ON public.schedule_views
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert view records" ON public.schedule_views
  FOR INSERT WITH CHECK (true);

-- Create function to get view counts for a user
CREATE OR REPLACE FUNCTION public.get_user_view_counts(user_uuid uuid)
RETURNS TABLE (
  total_views bigint,
  last_month_views bigint,
  this_month_views bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_views,
    COUNT(*) FILTER (WHERE viewed_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month') 
                     AND viewed_at < date_trunc('month', CURRENT_DATE)) as last_month_views,
    COUNT(*) FILTER (WHERE viewed_at >= date_trunc('month', CURRENT_DATE)) as this_month_views
  FROM public.schedule_views
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
