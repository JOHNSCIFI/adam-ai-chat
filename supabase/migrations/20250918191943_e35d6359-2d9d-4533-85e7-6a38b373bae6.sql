-- Create image_analyses table for storing OpenAI image analysis results
CREATE TABLE public.image_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  analysis TEXT NOT NULL,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.image_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for image_analyses
CREATE POLICY "Users can view their own image analyses" 
ON public.image_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image analyses" 
ON public.image_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image analyses" 
ON public.image_analyses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image analyses" 
ON public.image_analyses FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true);

-- Create storage policies for chat images
CREATE POLICY "Users can view their own chat images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own chat images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chat images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chat images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public access for chat images (for easier sharing)
CREATE POLICY "Chat images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-images');

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_image_analyses_updated_at
BEFORE UPDATE ON public.image_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();