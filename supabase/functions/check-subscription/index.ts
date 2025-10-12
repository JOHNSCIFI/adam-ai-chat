import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product ID to plan name mapping - must match frontend
const productToPlanMap: { [key: string]: string } = {
  'prod_TDSeCiQ2JEFnWB': 'Pro',
  'prod_TDSfAtaWP5KbhM': 'Ultra Pro',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Delete any existing subscription record
      await supabaseClient
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let subscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      
      // Safely handle the date conversion
      try {
        if (subscription.current_period_end) {
          subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Active subscription found", { 
            subscriptionId: subscription.id, 
            endDate: subscriptionEnd,
            currentPeriodEnd: subscription.current_period_end 
          });
        } else {
          logStep("Warning: subscription has no current_period_end", { subscriptionId: subscription.id });
        }
      } catch (dateError) {
        logStep("ERROR converting date", { 
          error: dateError.message,
          currentPeriodEnd: subscription.current_period_end 
        });
        // Continue without the date if conversion fails
      }
      
      productId = subscription.items.data[0].price.product as string;
      const planName = productToPlanMap[productId] || 'Unknown';
      
      // Determine plan tier based on product
      let planTier = 'free';
      if (productId === 'prod_TDSeCiQ2JEFnWB') {
        planTier = 'pro';
      } else if (productId === 'prod_TDSfAtaWP5KbhM') {
        planTier = 'ultra_pro';
      } else if (productId) {
        // Any other product ID means they have a paid subscription
        planTier = 'pro'; // Default to pro for unmapped products
      }
      
      logStep("Determined subscription tier", { productId, planName, planTier });
      
      // Save/update subscription in database
      try {
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            product_id: productId,
            plan_name: planName,
            plan: planTier,
            status: 'active',
            current_period_end: subscriptionEnd
          }, {
            onConflict: 'user_id'
          });
        
        if (upsertError) {
          logStep("ERROR upserting subscription to DB", { error: upsertError.message });
        } else {
          logStep("Successfully saved subscription to DB");
        }
      } catch (dbError) {
        logStep("ERROR saving to DB", { error: dbError.message });
      }
    } else {
      logStep("No active subscription found");
      
      // Delete any existing subscription record
      await supabaseClient
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      product_id: null,
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
