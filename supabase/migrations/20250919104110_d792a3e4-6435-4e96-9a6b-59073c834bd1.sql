-- Update empty chat titles to 'New Chat'
UPDATE chats 
SET title = 'New Chat' 
WHERE title IS NULL OR title = '';