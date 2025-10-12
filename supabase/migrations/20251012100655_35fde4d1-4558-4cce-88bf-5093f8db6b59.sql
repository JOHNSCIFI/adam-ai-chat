-- Create usage tracking table for subscription limits
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  image_generations_used INTEGER NOT NULL DEFAULT 0,
  image_generations_limit INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage limits"
  ON public.usage_limits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own usage (for incrementing counters)
CREATE POLICY "Users can update their own usage limits"
  ON public.usage_limits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert their own usage limits"
  ON public.usage_limits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage all usage limits"
  ON public.usage_limits
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to automatically create or reset usage limits based on subscription
CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id UUID)
RETURNS TABLE (
  can_generate BOOLEAN,
  remaining INTEGER,
  limit_value INTEGER,
  reset_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription RECORD;
  v_usage RECORD;
  v_image_limit INTEGER := 0;
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  -- Determine image generation limit based on plan
  IF v_subscription.plan = 'pro' THEN
    v_image_limit := 500;
  ELSIF v_subscription.plan = 'ultra_pro' THEN
    v_image_limit := 2000;
  ELSE
    v_image_limit := 0; -- Free plan has no image generation
  END IF;
  
  -- Get or create current usage period
  SELECT * INTO v_usage
  FROM usage_limits
  WHERE user_id = p_user_id
  AND period_end > v_now
  ORDER BY period_start DESC
  LIMIT 1;
  
  -- If no active period or subscription renewed, create new period
  IF v_usage IS NULL OR (v_subscription.current_period_end IS NOT NULL AND v_usage.period_end < v_subscription.current_period_end) THEN
    -- Delete old periods
    DELETE FROM usage_limits 
    WHERE user_id = p_user_id 
    AND period_end <= v_now;
    
    -- Create new period aligned with subscription
    INSERT INTO usage_limits (
      user_id,
      period_start,
      period_end,
      image_generations_used,
      image_generations_limit
    ) VALUES (
      p_user_id,
      v_now,
      COALESCE(v_subscription.current_period_end, v_now + interval '30 days'),
      0,
      v_image_limit
    )
    ON CONFLICT (user_id, period_start) 
    DO UPDATE SET
      period_end = EXCLUDED.period_end,
      image_generations_limit = EXCLUDED.image_generations_limit,
      updated_at = now()
    RETURNING * INTO v_usage;
  END IF;
  
  -- Return usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$$;

-- Create function to increment image generation count
CREATE OR REPLACE FUNCTION public.increment_image_generation(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  -- Check if user can generate
  IF NOT EXISTS (
    SELECT 1 FROM check_and_reset_usage_limits(p_user_id)
    WHERE can_generate = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE usage_limits
  SET 
    image_generations_used = image_generations_used + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  AND period_end > now();
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();