-- Create a function to help identify misplaced generated images
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

-- Add a comment for future reference
COMMENT ON FUNCTION public.get_misplaced_generated_images() IS 'Helper function to identify generated images that were stored in chat-images bucket instead of generated-images bucket. Run SELECT * FROM get_misplaced_generated_images() to see affected files.';