-- Add session_id to messages table to track anonymous users
ALTER TABLE public.messages 
ADD COLUMN session_id TEXT;

-- Add user_subscriptions table to track user subscription status
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_subscriptions
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
ON public.user_subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add favorite_tools table to track user's favorite tools
CREATE TABLE public.favorite_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_name)
);

-- Enable RLS on favorite_tools
ALTER TABLE public.favorite_tools ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_tools
CREATE POLICY "Users can view their own favorite tools" 
ON public.favorite_tools 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorite tools" 
ON public.favorite_tools 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update messages RLS policies to allow anonymous users
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;

CREATE POLICY "Users can create messages in their chats or anonymous messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM chats 
    WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()
  )) OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

-- Update trigger for user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();