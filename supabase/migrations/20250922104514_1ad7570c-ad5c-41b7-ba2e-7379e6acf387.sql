-- Fix storage bucket for existing generated images
-- Move generated images from chat-images to generated-images bucket

-- First, let's check if there are any existing generated images in wrong bucket
-- and create a function to help with cleanup if needed

-- Create a function to help administrators identify misplaced generated images
CREATE OR REPLACE FUNCTION public.get_misplaced_generated_images()
RETURNS TABLE (
  file_path text,
  created_at timestamp with time zone,
  bucket_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
SELECT 
  name as file_path,
  created_at,
  bucket_id as bucket_name
FROM storage.objects
WHERE bucket_id = 'chat-images' 
  AND name LIKE '%generated_%'
ORDER BY created_at DESC;
$$;

-- Update storage bucket policies to ensure generated-images bucket works properly
-- Delete existing policies for generated-images if they exist
DELETE FROM storage.policies WHERE bucket_id = 'generated-images';

-- Create proper policies for generated-images bucket
INSERT INTO storage.policies (id, bucket_id, policy_name, policy, check_policy) VALUES 
('generated_images_select_all', 'generated-images', 'Anyone can view generated images', 
 'bucket_id = ''generated-images''', NULL),
('generated_images_insert_authenticated', 'generated-images', 'Authenticated users can upload generated images',
 'bucket_id = ''generated-images'' AND auth.role() = ''authenticated''', 
 'bucket_id = ''generated-images'' AND auth.role() = ''authenticated'''),
('generated_images_delete_own', 'generated-images', 'Users can delete their own generated images',
 'bucket_id = ''generated-images'' AND auth.uid()::text = (storage.foldername(name))[1]',
 NULL);

-- Add a comment for future reference
COMMENT ON FUNCTION public.get_misplaced_generated_images() IS 'Helper function to identify generated images that were stored in chat-images bucket instead of generated-images bucket';