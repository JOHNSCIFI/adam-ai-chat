-- Check if pgvector extension exists and create if needed
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column to messages table for semantic search
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS messages_embedding_idx ON public.messages 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create storage bucket for permanent image storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for generated images bucket
CREATE POLICY "Users can view all generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Users can upload generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own generated images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);