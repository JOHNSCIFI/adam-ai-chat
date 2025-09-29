-- Add columns to store message content for better feedback analysis
ALTER TABLE message_ratings 
ADD COLUMN user_message TEXT,
ADD COLUMN ai_message TEXT;