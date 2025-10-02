-- Simplify token_usage table to only essential fields
ALTER TABLE public.token_usage
DROP COLUMN IF EXISTS chat_id,
DROP COLUMN IF EXISTS message_id,
DROP COLUMN IF EXISTS prompt_tokens,
DROP COLUMN IF EXISTS completion_tokens,
DROP COLUMN IF EXISTS cost_usd;