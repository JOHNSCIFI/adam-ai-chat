-- Fix security warnings by moving vector extension to extensions schema
DROP EXTENSION IF EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Update the vector column to use the extension from extensions schema
ALTER TABLE public.messages 
DROP COLUMN IF EXISTS embedding;

ALTER TABLE public.messages 
ADD COLUMN embedding extensions.vector(1536);

-- Recreate index for vector similarity search with proper schema reference
DROP INDEX IF EXISTS messages_embedding_idx;
CREATE INDEX messages_embedding_idx ON public.messages 
USING ivfflat (embedding extensions.vector_cosine_ops)
WITH (lists = 100);