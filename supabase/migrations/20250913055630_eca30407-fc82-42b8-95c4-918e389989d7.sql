-- Only add file_attachments column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='messages' 
        AND column_name='file_attachments'
    ) THEN
        ALTER TABLE messages ADD COLUMN file_attachments JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Only add signup_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='profiles' 
        AND column_name='signup_method'
    ) THEN
        ALTER TABLE profiles ADD COLUMN signup_method TEXT DEFAULT 'email';
    END IF;
END $$;

-- Create storage policies only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload their own files'
    ) THEN
        CREATE POLICY "Users can upload their own files" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can view their own files'
    ) THEN
        CREATE POLICY "Users can view their own files" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own files'
    ) THEN
        CREATE POLICY "Users can delete their own files" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;