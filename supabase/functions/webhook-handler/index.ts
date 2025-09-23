import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Webhook handler called');
    
    const body = await req.json();
    console.log('Webhook received data:', JSON.stringify(body, null, 2));

    // Extract the response data
    const { chat_id, response_data } = body;
    
    if (!chat_id || !response_data) {
      console.error('Missing required fields:', { chat_id, response_data });
      return new Response(JSON.stringify({ error: 'Missing chat_id or response_data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the AI response
    let aiResponseText = '';
    if (Array.isArray(response_data) && response_data.length > 0) {
      aiResponseText = response_data[0].text || '';
    } else if (typeof response_data === 'string') {
      aiResponseText = response_data;
    } else if (response_data.text) {
      aiResponseText = response_data.text;
    }

    if (!aiResponseText) {
      console.error('No AI response text found in:', response_data);
      return new Response(JSON.stringify({ error: 'No AI response text found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing AI response:', aiResponseText);

    // Save the AI response as an assistant message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chat_id,
        content: aiResponseText,
        role: 'assistant',
        file_attachments: []
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving AI message:', messageError);
      return new Response(JSON.stringify({ error: 'Failed to save AI message', details: messageError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('AI message saved successfully:', message);

    // Update the chat's updated_at timestamp
    const { error: chatUpdateError } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id);

    if (chatUpdateError) {
      console.error('Error updating chat timestamp:', chatUpdateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message_id: message.id,
      content: aiResponseText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in webhook-handler function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});