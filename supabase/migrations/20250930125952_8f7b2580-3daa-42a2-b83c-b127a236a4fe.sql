-- Add model column to messages table to store which AI model was used
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS model text;