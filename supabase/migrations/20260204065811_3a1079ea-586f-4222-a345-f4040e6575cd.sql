-- Add columns for before/after repair photos
ALTER TABLE public.reports 
ADD COLUMN before_image_url text,
ADD COLUMN after_image_url text;