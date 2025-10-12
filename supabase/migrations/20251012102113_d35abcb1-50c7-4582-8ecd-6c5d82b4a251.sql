-- Enable Row Level Security on n8n_chat_histories table
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access (for webhook-handler edge function)
CREATE POLICY "Service role has full access to n8n chat histories"
ON public.n8n_chat_histories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy to allow users to view messages from sessions linked to their chats
CREATE POLICY "Users can view their own n8n session messages"
ON public.n8n_chat_histories
FOR SELECT
TO authenticated
USING (
  session_id IN (
    SELECT DISTINCT session_id 
    FROM public.messages 
    WHERE chat_id IN (
      SELECT id FROM public.chats WHERE user_id = auth.uid()
    )
    AND session_id IS NOT NULL
  )
);

-- Prevent regular authenticated users from inserting/updating/deleting
-- Only service role (webhook-handler) can modify this table
CREATE POLICY "Only service role can insert n8n chat histories"
ON public.n8n_chat_histories
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Only service role can update n8n chat histories"
ON public.n8n_chat_histories
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Only service role can delete n8n chat histories"
ON public.n8n_chat_histories
FOR DELETE
TO authenticated
USING (false);