-- Create anonymous_messages table for non-authenticated users
CREATE TABLE public.anonymous_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  file_attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_anonymous_messages_session_id ON public.anonymous_messages(session_id);
CREATE INDEX idx_anonymous_messages_created_at ON public.anonymous_messages(created_at);

-- Create tool_sessions table for tool-specific chats
CREATE TABLE public.tool_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- For anonymous users
  tool_name TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Session',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anonymous_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anonymous_messages (no restrictions needed for anonymous data)
CREATE POLICY "Allow all operations on anonymous messages" 
ON public.anonymous_messages 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for tool_sessions
CREATE POLICY "Users can view their own tool sessions" 
ON public.tool_sessions 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Users can create their own tool sessions" 
ON public.tool_sessions 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Users can update their own tool sessions" 
ON public.tool_sessions 
FOR UPDATE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

CREATE POLICY "Users can delete their own tool sessions" 
ON public.tool_sessions 
FOR DELETE 
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
  (auth.uid() IS NULL AND session_id IS NOT NULL)
);

-- Create trigger for updating tool_sessions updated_at
CREATE TRIGGER update_tool_sessions_updated_at
BEFORE UPDATE ON public.tool_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();