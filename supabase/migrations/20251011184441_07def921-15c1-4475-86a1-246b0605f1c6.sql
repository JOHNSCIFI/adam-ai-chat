
-- Enable realtime for user_subscriptions table
ALTER TABLE public.user_subscriptions REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;
