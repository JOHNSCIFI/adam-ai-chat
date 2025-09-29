-- Create message_ratings table for tracking user likes/dislikes
CREATE TABLE public.message_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.message_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies for message_ratings
CREATE POLICY "Users can view their own ratings" 
ON public.message_ratings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings" 
ON public.message_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" 
ON public.message_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" 
ON public.message_ratings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_message_ratings_updated_at
BEFORE UPDATE ON public.message_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();