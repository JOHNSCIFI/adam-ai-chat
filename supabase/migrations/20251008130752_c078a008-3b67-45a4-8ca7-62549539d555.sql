-- Remove token usage records for deprecated models
DELETE FROM token_usage 
WHERE model IN ('gpt-4.1-mini', 'deepseekv3');