-- Enable UPDATE operations on messages for users in their own chats
CREATE POLICY "Users can update messages in their chats"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = auth.uid()
  )
);