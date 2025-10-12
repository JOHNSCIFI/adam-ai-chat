-- Fix: Update check_and_reset_usage_limits to handle plan upgrades
-- This ensures that when a user upgrades from Pro to Ultra Pro,
-- their usage limits are updated immediately, not just at period reset

CREATE OR REPLACE FUNCTION public.check_and_reset_usage_limits(p_user_id uuid)
 RETURNS TABLE(can_generate boolean, remaining integer, limit_value integer, reset_date timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- If no active period OR subscription renewed OR plan changed, create/update period
  IF v_usage IS NULL OR 
     (v_subscription.current_period_end IS NOT NULL AND v_usage.period_end < v_subscription.current_period_end) OR
     (v_usage.image_generations_limit != v_image_limit) THEN
    
    -- Delete old periods
    DELETE FROM usage_limits 
    WHERE user_id = p_user_id 
    AND period_end <= v_now;
    
    -- If plan changed mid-period, update the existing record
    IF v_usage IS NOT NULL AND v_usage.image_generations_limit != v_image_limit THEN
      UPDATE usage_limits
      SET 
        image_generations_limit = v_image_limit,
        period_end = COALESCE(v_subscription.current_period_end, v_now + interval '30 days'),
        updated_at = now()
      WHERE user_id = p_user_id
      AND period_end > v_now
      RETURNING * INTO v_usage;
    ELSE
      -- Create new period
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
  END IF;
  
  -- Return usage status
  RETURN QUERY SELECT
    v_usage.image_generations_used < v_usage.image_generations_limit AS can_generate,
    (v_usage.image_generations_limit - v_usage.image_generations_used) AS remaining,
    v_usage.image_generations_limit AS limit_value,
    v_usage.period_end AS reset_date;
END;
$function$;