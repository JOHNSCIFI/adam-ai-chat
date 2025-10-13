import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DELETE-USER] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { userId } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    logStep("Deleting user", { userId });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Delete from all related tables
    const tables = [
      'message_ratings',
      'messages',
      'image_analyses',
      'chats',
      'projects',
      'usage_limits',
      'user_subscriptions',
      'user_roles',
      'token_usage',
      'profiles'
    ];

    for (const table of tables) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        logStep(`Error deleting from ${table}`, { error: error.message });
      } else {
        logStep(`Deleted from ${table}`);
      }
    }

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      logStep("Error deleting auth user", { error: authError.message });
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    logStep("User deleted successfully");

    return new Response(
      JSON.stringify({ success: true, message: "User and all data deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});