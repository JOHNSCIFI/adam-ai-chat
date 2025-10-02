-- Enable real-time for messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add messages table to realtime publication if not already added
DO $$
BEGIN
  -- Check if the publication exists and add the table if not already included
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Create an index on chat_id for faster real-time filtering
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at 
ON public.messages(chat_id, created_at DESC);