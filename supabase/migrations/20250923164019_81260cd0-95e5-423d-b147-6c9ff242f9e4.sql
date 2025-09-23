-- Fix search path for the delete_user_account function
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
  
  -- Delete user's data (cascading will handle related records)
  DELETE FROM profiles WHERE user_id = current_user_id;
  DELETE FROM chats WHERE user_id = current_user_id;
  
  -- Note: The actual user deletion from auth.users should be handled
  -- by an edge function with service role permissions
END;
$function$;