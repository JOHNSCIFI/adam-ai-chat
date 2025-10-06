-- Ensure REPLICA IDENTITY FULL is set for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;