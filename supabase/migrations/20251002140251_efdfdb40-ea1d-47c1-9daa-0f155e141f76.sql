-- Add foreign key constraint from token_usage to profiles
ALTER TABLE public.token_usage
ADD CONSTRAINT token_usage_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;