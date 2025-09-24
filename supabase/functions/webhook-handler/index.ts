import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[WEBHOOK-HANDLER] Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('[WEBHOOK-HANDLER] Request body:', JSON.stringify(body));

    const { chat_id, response_data } = body;

    if (!chat_id || !response_data) {
      console.error('[WEBHOOK-HANDLER] Missing required fields:', { chat_id, response_data });
      return new Response(
        JSON.stringify({ error: 'Missing chat_id or response_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response data to extract the text content
    let responseContent = '';
    
    if (Array.isArray(response_data) && response_data.length > 0) {
      const analysisTexts = response_data.map(item => item.text || item.content || '').filter(text => text);
      if (analysisTexts.length > 0) {
        responseContent = analysisTexts.join('\n\n');
      }
    } else if (response_data.text) {
      responseContent = response_data.text;
    } else if (response_data.analysis || response_data.content) {
      responseContent = response_data.analysis || response_data.content;
    } else if (typeof response_data === 'string') {
      responseContent = response_data;
    }

    if (!responseContent) {
      console.error('[WEBHOOK-HANDLER] No valid content found in response_data:', response_data);
      return new Response(
        JSON.stringify({ error: 'No valid content found in response_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] Processed content:', responseContent);

    // Save the assistant message to the database
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chat_id,
        content: responseContent,
        role: 'assistant',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[WEBHOOK-HANDLER] Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save message', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] Message saved successfully:', data);

    return new Response(
      JSON.stringify({ success: true, message_id: data.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[WEBHOOK-HANDLER] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});