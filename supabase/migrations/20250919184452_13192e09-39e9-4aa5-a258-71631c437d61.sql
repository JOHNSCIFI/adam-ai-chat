-- Make chat-files bucket public so images can be displayed properly
UPDATE storage.buckets 
SET public = true 
WHERE id = 'chat-files';