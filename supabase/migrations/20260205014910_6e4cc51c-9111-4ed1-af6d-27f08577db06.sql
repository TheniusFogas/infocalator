-- Create storage bucket for attraction images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attraction-images', 
  'attraction-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- RLS policy for public read access
CREATE POLICY "Public can view attraction images"
ON storage.objects FOR SELECT
USING (bucket_id = 'attraction-images');

-- Admins can upload/manage images
CREATE POLICY "Admins can upload attraction images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attraction-images' 
  AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can update attraction images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'attraction-images' 
  AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can delete attraction images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attraction-images' 
  AND EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Add new columns to cached_attractions for enhanced content
ALTER TABLE public.cached_attractions 
ADD COLUMN IF NOT EXISTS long_description TEXT,
ADD COLUMN IF NOT EXISTS history TEXT,
ADD COLUMN IF NOT EXISTS facts JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT,
ADD COLUMN IF NOT EXISTS facilities TEXT[],
ADD COLUMN IF NOT EXISTS accessibility TEXT,
ADD COLUMN IF NOT EXISTS nearby_attractions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create index for popular attractions
CREATE INDEX IF NOT EXISTS idx_cached_attractions_views ON public.cached_attractions(view_count DESC);

-- Function to increment view count (avoids RLS issues for public views)
CREATE OR REPLACE FUNCTION public.increment_attraction_views(attraction_slug TEXT, attraction_location TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE cached_attractions 
  SET view_count = view_count + 1 
  WHERE slug = attraction_slug AND location = attraction_location;
END;
$$;