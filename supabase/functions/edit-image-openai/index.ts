import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { imageData, prompt, fileName, chatId, userId } = await req.json();

    if (!imageData || !prompt) {
      throw new Error('Image data and prompt are required');
    }

    console.log('Edit image request:', { 
      fileName, 
      prompt: prompt.substring(0, 100),
      chatId,
      userId 
    });

    // Convert base64 to buffer for OpenAI
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    // Create FormData for OpenAI image editing API
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), fileName);
    formData.append('prompt', prompt);
    formData.append('model', 'dall-e-2'); // OpenAI image editing uses DALL-E 2
    formData.append('n', '1');
    formData.append('size', '1024x1024');

    console.log('Calling OpenAI image editing API...');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received:', { imageCount: data.data?.length });

    if (!data.data || data.data.length === 0) {
      throw new Error('No edited image returned from OpenAI');
    }

    const editedImageUrl = data.data[0].url;
    
    // Save the response to the chat
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: saveError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content: `I've edited your image based on your request: "${prompt}"`,
        role: 'assistant',
        file_attachments: [{
          id: crypto.randomUUID(),
          name: `edited_${fileName}`,
          url: editedImageUrl,
          type: 'image/png',
          size: 0
        }]
      });

    if (saveError) {
      console.error('Error saving message:', saveError);
    } else {
      console.log('Response saved to database');
    }

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: editedImageUrl,
      message: `I've edited your image based on your request: "${prompt}"`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in edit-image-openai function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});