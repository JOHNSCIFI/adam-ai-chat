-- Add unique constraint on user_id for the user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);