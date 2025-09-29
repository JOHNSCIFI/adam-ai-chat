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

    // Handle N8n structure: { body: { chatId: "..." }, image_base64: "..." }
    const chat_id = body.body?.chatId || body.chat_id;
    const user_id = body.body?.userId || body.user_id;
    const image_base64 = body.image_base64;
    const response_data = body.response_data;

    if (!chat_id) {
      console.error('[WEBHOOK-HANDLER] Missing chat_id:', body);
      return new Response(
        JSON.stringify({ error: 'Missing chat_id in body.chatId or chat_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response data to extract the text content
    let responseContent = '';
    let imageUrl = null;
    
    if (response_data) {
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
    }

    // Handle image generation (from root level or response_data)
    const imageData = image_base64 || response_data?.image_base64;
    if (imageData) {
      console.log('[WEBHOOK-HANDLER] Processing generated image');
      
      try {
        // Convert base64 to blob
        const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        
        // Generate unique filename
        const timestamp = Date.now();
        const imageName = body.image_name || response_data?.image_name || 'image.png';
        const uniqueFileName = `generated_${timestamp}_${imageName}`;
        const filePath = user_id ? `${user_id}/${chat_id}/${uniqueFileName}` : `${chat_id}/${uniqueFileName}`;
        const bucketName = 'generated-images';

        console.log('[WEBHOOK-HANDLER] Uploading image to storage:', filePath);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from(bucketName)
          .upload(filePath, imageBytes, {
            contentType: body.image_type || response_data?.image_type || 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('[WEBHOOK-HANDLER] Upload error:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
          console.log('[WEBHOOK-HANDLER] Image uploaded successfully:', imageUrl);
        }
      } catch (imageError) {
        console.error('[WEBHOOK-HANDLER] Error processing image:', imageError);
      }
    }

    if (!responseContent && !imageUrl) {
      console.error('[WEBHOOK-HANDLER] No valid content or image found in response_data:', response_data);
      return new Response(
        JSON.stringify({ error: 'No valid content or image found in response_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] Processed content:', responseContent, 'Image URL:', imageUrl);

    // Prepare file attachments if image exists
    const fileAttachments = imageUrl ? [{
      id: crypto.randomUUID(),
      name: body.image_name || response_data?.image_name || `generated_image_${Date.now()}.png`,
      size: 0,
      type: body.image_type || response_data?.image_type || 'image/png',
      url: imageUrl
    }] : null;

    // Save the assistant message to the database
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chat_id,
        content: responseContent || 'Generated image',
        role: 'assistant',
        file_attachments: fileAttachments,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});