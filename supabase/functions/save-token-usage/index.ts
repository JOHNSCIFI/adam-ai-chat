import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token pricing per 1M tokens (in USD)
const TOKEN_PRICING: Record<string, { prompt: number; completion: number }> = {
  'gpt-4o-mini': { prompt: 0.15, completion: 0.60 },
  'gpt-4o': { prompt: 2.50, completion: 10.00 },
  'gpt-5': { prompt: 10.00, completion: 30.00 },
  'gpt-5-mini': { prompt: 1.00, completion: 4.00 },
  'gpt-5-nano': { prompt: 0.20, completion: 0.80 },
  'gpt-4.1': { prompt: 3.00, completion: 12.00 },
  'gpt-4.1-mini': { prompt: 0.40, completion: 1.60 },
  'o3': { prompt: 20.00, completion: 80.00 },
  'o4-mini': { prompt: 2.00, completion: 8.00 },
  'claude-3-opus': { prompt: 15.00, completion: 75.00 },
  'claude-3-sonnet': { prompt: 3.00, completion: 15.00 },
  'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
  'gemini-pro': { prompt: 0.50, completion: 1.50 },
  'gemini-flash': { prompt: 0.10, completion: 0.30 },
};

function calculateCost(model: string, promptTokens: number = 0, completionTokens: number = 0): number {
  const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-4o-mini'];
  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;
  return promptCost + completionCost;
}

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
    const chatId = body.chatId || body.chat_id;
    const messageId = body.messageId || body.message_id;
    const model = body.model;
    const totalTokens = body.totalTokens || body.total_tokens;
    const promptTokens = body.promptTokens || body.prompt_tokens;
    const completionTokens = body.completionTokens || body.completion_tokens;

    console.log('[SAVE-TOKEN-USAGE] Extracted values:', {
      userId,
      chatId,
      messageId,
      model,
      totalTokens,
      promptTokens,
      completionTokens
    });

    if (!userId || !model || !totalTokens) {
      console.error('[SAVE-TOKEN-USAGE] Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, model, totalTokens' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate cost in USD
    const costUsd = calculateCost(model, promptTokens || 0, completionTokens || 0);
    console.log('[SAVE-TOKEN-USAGE] Calculated cost:', costUsd);

    // Save to database
    const { data, error } = await supabaseClient
      .from('token_usage')
      .insert({
        user_id: userId,
        chat_id: chatId,
        message_id: messageId,
        model: model,
        total_tokens: totalTokens,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        cost_usd: costUsd
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
