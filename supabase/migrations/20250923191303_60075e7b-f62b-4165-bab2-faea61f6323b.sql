-- Add tool information to chats table to track tool-based chats
ALTER TABLE chats ADD COLUMN tool_id TEXT;
ALTER TABLE chats ADD COLUMN tool_name TEXT;

-- Add index for better performance when querying tool chats
CREATE INDEX idx_chats_tool_id ON chats(tool_id) WHERE tool_id IS NOT NULL;