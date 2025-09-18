-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create image_sessions table (similar to chats but for image generation)
CREATE TABLE public.image_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'New Image Session',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for image_sessions
CREATE POLICY "Users can view their own image sessions" 
ON public.image_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image sessions" 
ON public.image_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image sessions" 
ON public.image_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image sessions" 
ON public.image_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add project_id to existing chats table
ALTER TABLE public.chats 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create image_generations table to store generated images
CREATE TABLE public.image_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_session_id UUID NOT NULL REFERENCES public.image_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'generating', -- generating, completed, failed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.image_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for image_generations
CREATE POLICY "Users can view their own image generations" 
ON public.image_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image generations" 
ON public.image_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image generations" 
ON public.image_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_image_sessions_updated_at
BEFORE UPDATE ON public.image_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();