-- First, create the missing profile for the Apple user
INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
VALUES (
  'b84e6a07-b420-44e1-9c87-7ee789de1039',
  'Umidjon Tursunov',
  'dxqdnthtbz@privaterelay.appleid.com',
  'apple',
  NULL
)
ON CONFLICT (user_id) DO NOTHING;

-- Now fix the trigger to be more robust and handle Apple sign-ins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_display_name TEXT;
  v_signup_method TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Try to get display name from various metadata fields
  v_display_name := COALESCE(
    NEW.raw_user_meta_data ->> 'display_name',
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  
  -- Detect signup method from provider or metadata
  v_signup_method := CASE
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'apple' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'provider' = 'google' THEN 'google'
    WHEN NEW.raw_user_meta_data ->> 'iss' = 'https://appleid.apple.com' THEN 'apple'
    WHEN NEW.raw_user_meta_data ->> 'signup_method' IS NOT NULL THEN NEW.raw_user_meta_data ->> 'signup_method'
    ELSE 'email'
  END;
  
  -- Get avatar URL
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.raw_user_meta_data ->> 'picture'
  );
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (user_id, display_name, email, signup_method, avatar_url)
    VALUES (
      NEW.id,
      v_display_name,
      NEW.email,
      v_signup_method,
      v_avatar_url
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;