-- Add DELETE policy for messages table to allow users to delete messages in their own chats
CREATE POLICY "Users can delete messages from their chats"
ON public.messages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chats
    WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
  )
);