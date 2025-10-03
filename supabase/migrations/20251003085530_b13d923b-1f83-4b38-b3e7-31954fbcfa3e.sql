-- Remove the CASCADE constraint from token_usage to preserve data on user deletion
ALTER TABLE public.token_usage
DROP CONSTRAINT IF EXISTS token_usage_user_id_fkey;

-- Add constraint without CASCADE - keep the reference but don't delete on user removal
-- This allows token_usage to remain even if profile is modified
ALTER TABLE public.token_usage
ADD CONSTRAINT token_usage_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE NO ACTION;

-- Update the delete_user_account function to anonymize instead of delete
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to delete account';
  END IF;
  
  -- Anonymize the profile instead of deleting
  -- Keep the user_id for token_usage reference but remove all personal data
  UPDATE profiles 
  SET 
    email = NULL,
    display_name = 'Deleted User',
    avatar_url = NULL,
    signup_method = NULL,
    updated_at = now()
  WHERE user_id = current_user_id;
  
  -- Delete user's chats and related data
  DELETE FROM chats WHERE user_id = current_user_id;
  
  -- Note: The actual user deletion from auth.users should be handled
  -- by an edge function with service role permissions
END;
$function$;