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

    console.log('🚀 Webhook handler called - Method:', req.method);
    
    const body = await req.json();
    console.log('📦 Webhook received data:', JSON.stringify(body, null, 2));
    console.log('🔍 Body keys:', Object.keys(body));

    // Extract the response data
    const { chat_id, response_data } = body;
    
    console.log('🔑 Extracted values:', { 
      chat_id, 
      response_data_type: typeof response_data,
      response_data_length: Array.isArray(response_data) ? response_data.length : 'not_array',
      response_data: response_data 
    });
    
    if (!chat_id || !response_data) {
      console.error('❌ Missing required fields:', { chat_id, response_data });
      return new Response(JSON.stringify({ error: 'Missing chat_id or response_data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the AI response
    let aiResponseText = '';
    console.log('🔄 Processing response_data:', response_data);
    
    if (Array.isArray(response_data) && response_data.length > 0) {
      console.log('📋 Array detected, extracting text from first element');
      aiResponseText = response_data[0].text || '';
    } else if (typeof response_data === 'string') {
      console.log('📝 String detected');
      aiResponseText = response_data;
    } else if (response_data.text) {
      console.log('🎯 Object with text property detected');
      aiResponseText = response_data.text;
    }

    console.log('✨ Final AI response text:', aiResponseText);

    if (!aiResponseText) {
      console.error('❌ No AI response text found in:', response_data);
      return new Response(JSON.stringify({ error: 'No AI response text found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('💾 Attempting to save AI message to database...');
    console.log('💾 Insert payload:', {
      chat_id: chat_id,
      content: aiResponseText,
      role: 'assistant',
      file_attachments: []
    });

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
      console.error('❌ Error saving AI message:', messageError);
      console.error('❌ Error details:', JSON.stringify(messageError, null, 2));
      return new Response(JSON.stringify({ error: 'Failed to save AI message', details: messageError }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ AI message saved successfully!');
    console.log('✅ Saved message:', JSON.stringify(message, null, 2));

    // Update the chat's updated_at timestamp
    console.log('🕐 Updating chat timestamp for chat_id:', chat_id);
    const { error: chatUpdateError } = await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chat_id);

    if (chatUpdateError) {
      console.error('❌ Error updating chat timestamp:', chatUpdateError);
    } else {
      console.log('✅ Chat timestamp updated successfully');
    }

    console.log('🎉 Webhook processing complete!');
    return new Response(JSON.stringify({ 
      success: true, 
      message_id: message.id,
      content: aiResponseText,
      chat_id: chat_id
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