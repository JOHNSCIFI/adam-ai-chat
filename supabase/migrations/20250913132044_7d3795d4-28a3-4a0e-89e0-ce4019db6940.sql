-- Remove theme and accent_color columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS theme;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS accent_color;