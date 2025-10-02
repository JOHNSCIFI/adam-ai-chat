-- Add input_tokens and output_tokens columns to token_usage table
ALTER TABLE public.token_usage
ADD COLUMN input_tokens integer NOT NULL DEFAULT 0,
ADD COLUMN output_tokens integer NOT NULL DEFAULT 0;

-- Update existing records to split total_tokens (assuming 50/50 split for existing data)
UPDATE public.token_usage
SET input_tokens = total_tokens / 2,
    output_tokens = total_tokens / 2
WHERE input_tokens = 0 AND output_tokens = 0;

-- Drop the total_tokens column as it's no longer needed
ALTER TABLE public.token_usage
DROP COLUMN total_tokens;