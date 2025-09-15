-- Update existing profiles with avatar URLs from Google users
UPDATE public.profiles 
SET avatar_url = COALESCE(
  (auth.users.raw_user_meta_data ->> 'avatar_url'),
  (auth.users.raw_user_meta_data ->> 'picture')
)
FROM auth.users 
WHERE profiles.user_id = auth.users.id 
  AND profiles.avatar_url IS NULL 
  AND (auth.users.raw_user_meta_data ->> 'avatar_url' IS NOT NULL 
       OR auth.users.raw_user_meta_data ->> 'picture' IS NOT NULL);