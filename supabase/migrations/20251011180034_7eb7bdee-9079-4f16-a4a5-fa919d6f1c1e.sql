-- Clear all subscription data from user_subscriptions table
-- This will reset all users to free tier
DELETE FROM user_subscriptions;

-- Alternatively, you can update all subscriptions to free tier instead of deleting:
-- UPDATE user_subscriptions 
-- SET 
--   plan = 'free',
--   plan_name = NULL,
--   product_id = NULL,
--   status = 'active',
--   stripe_customer_id = NULL,
--   stripe_subscription_id = NULL,
--   current_period_end = NULL,
--   updated_at = now();
