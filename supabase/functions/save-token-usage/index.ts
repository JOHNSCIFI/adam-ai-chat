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

    // Handle array format from N8n: [{ input: 58, output: 87, userId: "...", model: "..." }]
    let body = rawBody;
    if (Array.isArray(rawBody) && rawBody.length > 0) {
      console.log('[SAVE-TOKEN-USAGE] Array format detected, extracting first element');
      body = rawBody[0];
    }

    const userId = body.userId || body.user_id;
    const model = body.model;
    const inputTokens = body.input || body.input_tokens || 0;
    const outputTokens = body.output || body.output_tokens || 0;

    console.log('[SAVE-TOKEN-USAGE] Extracted values:', {
      userId,
      model,
      inputTokens,
      outputTokens
    });

    if (!userId || !model || (inputTokens === 0 && outputTokens === 0)) {
      console.error('[SAVE-TOKEN-USAGE] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, model, and at least one of input/output tokens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if record exists for this user and model
    const { data: existingRecord } = await supabaseClient
      .from('token_usage')
      .select('id, input_tokens, output_tokens')
      .eq('user_id', userId)
      .eq('model', model)
      .maybeSingle();

    let data, error;

    if (existingRecord) {
      // Update existing record by adding to the token counts
      console.log('[SAVE-TOKEN-USAGE] Updating existing record:', existingRecord.id);
      const result = await supabaseClient
        .from('token_usage')
        .update({
          input_tokens: existingRecord.input_tokens + inputTokens,
          output_tokens: existingRecord.output_tokens + outputTokens
        })
        .eq('id', existingRecord.id)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      console.log('[SAVE-TOKEN-USAGE] Creating new record');
      const result = await supabaseClient
        .from('token_usage')
        .insert({
          user_id: userId,
          model: model,
          input_tokens: inputTokens,
          output_tokens: outputTokens
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

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
