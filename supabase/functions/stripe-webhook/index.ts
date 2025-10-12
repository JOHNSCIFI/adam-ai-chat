import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    let event: Stripe.Event;

    // Verify webhook signature (if webhook secret is configured)
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err.message });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
      logStep("Processing unverified webhook (development mode)");
    }

    logStep("Event type", { type: event.type });

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription update", { 
          subscriptionId: subscription.id,
          status: subscription.status 
        });

        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) {
          logStep("No customer email found");
          break;
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) throw userError;

        const user = users.users.find(u => u.email === customer.email);
        if (!user) {
          logStep("User not found", { email: customer.email });
          break;
        }

        // Extract product ID and plan name
        const productId = subscription.items.data[0].price.product as string;
        const planName = productToPlanMap[productId] || 'Unknown';
        
        // Determine plan tier based on product and subscription status
        let planTier = 'free';
        
        // If subscription is not active, user should be on free plan
        if (subscription.status === 'active') {
          if (productId === 'prod_TDSeCiQ2JEFnWB') {
            planTier = 'pro';
          } else if (productId === 'prod_TDSfAtaWP5KbhM') {
            planTier = 'ultra_pro';
          } else if (productId) {
            // Any other product ID means they have a paid subscription
            planTier = 'pro'; // Default to pro for unmapped products
          }
        }
        // If status is canceled, expired, past_due, etc., planTier stays 'free'
        
        const subscriptionEnd = subscription.current_period_end 
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        logStep("Determined subscription tier", { productId, planName, planTier, status: subscription.status });

        // Upsert subscription data
        const { error: upsertError } = await supabaseClient
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            product_id: productId,
            plan_name: planName,
            plan: planTier,
            status: subscription.status,
            current_period_end: subscriptionEnd,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (upsertError) {
          logStep("Error upserting subscription", { error: upsertError.message });
        } else {
          logStep("Subscription updated successfully", { userId: user.id });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

        // Get customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        if (!customer.email) {
          logStep("No customer email found");
          break;
        }

        // Find user by email
        const { data: users, error: userError } = await supabaseClient.auth.admin.listUsers();
        if (userError) throw userError;

        const user = users.users.find(u => u.email === customer.email);
        if (!user) {
          logStep("User not found", { email: customer.email });
          break;
        }

        // Delete subscription record (user reverts to free plan)
        const { error: deleteError } = await supabaseClient
          .from('user_subscriptions')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          logStep("Error deleting subscription", { error: deleteError.message });
        } else {
          logStep("Subscription deleted successfully", { userId: user.id });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id });
        // Payment succeeded - subscription is already handled by subscription.updated event
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Get customer email
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        if (!customer.email) break;

        // Find user
        const { data: users } = await supabaseClient.auth.admin.listUsers();
        const user = users?.users.find(u => u.email === customer.email);
        if (!user) break;

        // Update subscription status to reflect payment failure
        await supabaseClient
          .from('user_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        logStep("Subscription marked as past_due", { userId: user.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR processing webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
