-- Fix anonymous_messages RLS policies
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all operations on anonymous messages" ON anonymous_messages;

-- Create more restrictive policies for anonymous_messages
-- Allow users to view messages from their session
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anonymous_messages' 
    AND policyname = 'Users can view messages from their session'
  ) THEN
    CREATE POLICY "Users can view messages from their session"
    ON anonymous_messages
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- Allow users to insert messages with their session_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'anonymous_messages' 
    AND policyname = 'Users can insert messages with session_id'
  ) THEN
    CREATE POLICY "Users can insert messages with session_id"
    ON anonymous_messages
    FOR INSERT
    WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);
  END IF;
END $$;

-- Fix storage bucket security
-- Make buckets private (except assets)
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('generated-images', 'chat-images', 'chat-files');

-- Drop existing storage policies if they exist (so we can recreate them properly)
DROP POLICY IF EXISTS "Users can view their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own generated images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;

-- Create RLS policies for storage.objects

-- Policies for chat-images bucket
CREATE POLICY "Users can view their own chat images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-images' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "Users can upload their own chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for generated-images bucket
CREATE POLICY "Users can view their own generated images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'generated-images'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "Users can upload their own generated images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own generated images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies for chat-files bucket
CREATE POLICY "Users can view their own chat files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-files'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR auth.role() = 'service_role'
  )
);

CREATE POLICY "Users can upload their own chat files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add search_path to functions to fix mutable search_path warning
ALTER FUNCTION public.has_role SET search_path = public;
ALTER FUNCTION public.delete_user_account SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;