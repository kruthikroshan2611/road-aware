-- Create storage bucket for report images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images', 
  'report-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Allow anyone to upload images (for citizen reporting without auth)
CREATE POLICY "Anyone can upload report images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'report-images');

-- Allow public read access to report images
CREATE POLICY "Report images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-images');

-- Allow admins to delete report images
CREATE POLICY "Admins can delete report images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'report-images' 
  AND public.has_role(auth.uid(), 'admin')
);