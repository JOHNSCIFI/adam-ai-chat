-- Add model_id column to chats table to store the selected AI model
ALTER TABLE public.chats 
ADD COLUMN model_id text DEFAULT 'gpt-4o-mini';

-- Update existing chats to have the default model
UPDATE public.chats 
SET model_id = 'gpt-4o-mini' 
WHERE model_id IS NULL;