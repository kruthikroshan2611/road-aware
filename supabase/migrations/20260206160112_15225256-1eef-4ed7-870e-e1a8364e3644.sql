-- Add a default empty string for complaint_id to allow the trigger to generate it
ALTER TABLE public.reports ALTER COLUMN complaint_id SET DEFAULT '';