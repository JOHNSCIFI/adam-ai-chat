-- Add theme preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme text DEFAULT 'dark',
ADD COLUMN accent_color text DEFAULT 'green';

-- Add check constraints for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'system')),
ADD CONSTRAINT accent_color_check CHECK (accent_color IN ('blue', 'purple', 'green', 'orange', 'red'));