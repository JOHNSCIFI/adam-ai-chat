import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token pricing per 1M tokens (in USD)
// Removed token pricing and cost calculation - no longer needed

serve(async (req) => {
  console.log('[SAVE-TOKEN-USAGE] New request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let rawBody = await req.json();
    console.log('[SAVE-TOKEN-USAGE] Raw body:', JSON.stringify(rawBody));

    // Handle array format from N8n: [{ totalTokens: 87, userId: "...", model: "..." }]
    let body = rawBody;
    if (Array.isArray(rawBody) && rawBody.length > 0) {
      console.log('[SAVE-TOKEN-USAGE] Array format detected, extracting first element');
      body = rawBody[0];
    }

    const userId = body.userId || body.user_id;
    const model = body.model;
    const totalTokens = body.totalTokens || body.total_tokens;

    console.log('[SAVE-TOKEN-USAGE] Extracted values:', {
      userId,
      model,
      totalTokens
    });

    if (!userId || !model || !totalTokens) {
      console.error('[SAVE-TOKEN-USAGE] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, model, totalTokens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save to database
    const { data, error } = await supabaseClient
      .from('token_usage')
      .insert({
        user_id: userId,
        model: model,
        total_tokens: totalTokens
      })
      .select()
      .single();

    if (error) {
      console.error('[SAVE-TOKEN-USAGE] Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save token usage', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[SAVE-TOKEN-USAGE] Successfully saved token usage:', data.id);

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[SAVE-TOKEN-USAGE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
