import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[WEBHOOK-HANDLER] ===== NEW REQUEST =====');
  console.log('[WEBHOOK-HANDLER] Request received:', req.method);
  console.log('[WEBHOOK-HANDLER] Request URL:', req.url);

  if (req.method === 'OPTIONS') {
    console.log('[WEBHOOK-HANDLER] OPTIONS request - returning CORS headers');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let rawBody = await req.json();
    console.log('[WEBHOOK-HANDLER] ===== RAW REQUEST BODY =====');
    console.log('[WEBHOOK-HANDLER] Raw body type:', Array.isArray(rawBody) ? 'Array' : typeof rawBody);
    console.log('[WEBHOOK-HANDLER] Full body structure:', JSON.stringify(rawBody, null, 2).substring(0, 500));
    
    // Handle N8n sending array format: [{ body: { chatId: "..." }, image_base64: "..." }]
    let body = rawBody;
    if (Array.isArray(rawBody) && rawBody.length > 0) {
      console.log('[WEBHOOK-HANDLER] Detected array format, extracting first element');
      body = rawBody[0];
    }
    
    console.log('[WEBHOOK-HANDLER] Body keys:', Object.keys(body));
    console.log('[WEBHOOK-HANDLER] Has body.body?', !!body.body);
    console.log('[WEBHOOK-HANDLER] Has body.image_base64?', !!body.image_base64);

    // Handle N8n structure: { body: { chatId: "..." }, image_base64: "..." }
    const chat_id = body.body?.chatId || body.chat_id;
    const user_id = body.body?.userId || body.user_id;
    const image_base64 = body.image_base64;
    const response_data = body.response_data;

    console.log('[WEBHOOK-HANDLER] ===== EXTRACTED VALUES =====');
    console.log('[WEBHOOK-HANDLER] chat_id:', chat_id);
    console.log('[WEBHOOK-HANDLER] user_id:', user_id);
    console.log('[WEBHOOK-HANDLER] Has image_base64?', !!image_base64);
    console.log('[WEBHOOK-HANDLER] Image base64 length:', image_base64?.length || 0);
    console.log('[WEBHOOK-HANDLER] Has response_data?', !!response_data);

    if (!chat_id) {
      console.error('[WEBHOOK-HANDLER] ERROR: Missing chat_id');
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
    console.log('[WEBHOOK-HANDLER] ===== IMAGE PROCESSING =====');
    console.log('[WEBHOOK-HANDLER] Final imageData exists?', !!imageData);
    console.log('[WEBHOOK-HANDLER] Image data length:', imageData?.length || 0);
    
    if (imageData) {
      console.log('[WEBHOOK-HANDLER] Processing generated image...');
      
      try {
        console.log('[WEBHOOK-HANDLER] Converting base64 to Uint8Array...');
        // Convert base64 to blob
        const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        console.log('[WEBHOOK-HANDLER] Converted image size:', imageBytes.length, 'bytes');
        
        // Generate unique filename
        const timestamp = Date.now();
        const imageName = body.image_name || response_data?.image_name || 'image.png';
        const uniqueFileName = `generated_${timestamp}_${imageName}`;
        const filePath = user_id ? `${user_id}/${chat_id}/${uniqueFileName}` : `${chat_id}/${uniqueFileName}`;
        const bucketName = 'generated-images';

        console.log('[WEBHOOK-HANDLER] ===== UPLOAD DETAILS =====');
        console.log('[WEBHOOK-HANDLER] Bucket:', bucketName);
        console.log('[WEBHOOK-HANDLER] File path:', filePath);
        console.log('[WEBHOOK-HANDLER] Image name:', imageName);


        console.log('[WEBHOOK-HANDLER] Starting upload to Supabase Storage...');

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from(bucketName)
          .upload(filePath, imageBytes, {
            contentType: body.image_type || response_data?.image_type || 'image/png',
            upsert: true
          });

        console.log('[WEBHOOK-HANDLER] ===== UPLOAD RESULT =====');
        if (uploadError) {
          console.error('[WEBHOOK-HANDLER] Upload error:', uploadError);
          console.error('[WEBHOOK-HANDLER] Error details:', JSON.stringify(uploadError));
        } else {
          console.log('[WEBHOOK-HANDLER] Upload successful!');
          console.log('[WEBHOOK-HANDLER] Upload data:', uploadData);
          
          // Get public URL
          const { data: urlData } = supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
          console.log('[WEBHOOK-HANDLER] ===== PUBLIC URL =====');
          console.log('[WEBHOOK-HANDLER] Image uploaded successfully!');
          console.log('[WEBHOOK-HANDLER] Public URL:', imageUrl);
        }
      } catch (imageError) {
        console.error('[WEBHOOK-HANDLER] ===== IMAGE PROCESSING ERROR =====');
        console.error('[WEBHOOK-HANDLER] Error:', imageError);
        console.error('[WEBHOOK-HANDLER] Error message:', imageError instanceof Error ? imageError.message : 'Unknown error');
        console.error('[WEBHOOK-HANDLER] Error stack:', imageError instanceof Error ? imageError.stack : 'No stack');
      }
    } else {
      console.log('[WEBHOOK-HANDLER] No image data found in request');
    }

    if (!responseContent && !imageUrl) {
      console.error('[WEBHOOK-HANDLER] ===== VALIDATION ERROR =====');
      console.error('[WEBHOOK-HANDLER] No valid content or image found');
      console.error('[WEBHOOK-HANDLER] responseContent:', responseContent);
      console.error('[WEBHOOK-HANDLER] imageUrl:', imageUrl);
      return new Response(
        JSON.stringify({ error: 'No valid content or image found in response_data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] ===== FINAL CONTENT =====');
    console.log('[WEBHOOK-HANDLER] Response content:', responseContent);
    console.log('[WEBHOOK-HANDLER] Image URL:', imageUrl);

    // Prepare file attachments if image exists
    const fileAttachments = imageUrl ? [{
      id: crypto.randomUUID(),
      name: body.image_name || response_data?.image_name || `generated_image_${Date.now()}.png`,
      size: 0,
      type: body.image_type || response_data?.image_type || 'image/png',
      url: imageUrl
    }] : null;

    console.log('[WEBHOOK-HANDLER] ===== FILE ATTACHMENTS =====');
    console.log('[WEBHOOK-HANDLER] fileAttachments:', JSON.stringify(fileAttachments, null, 2));

    console.log('[WEBHOOK-HANDLER] ===== SAVING TO DATABASE =====');
    console.log('[WEBHOOK-HANDLER] Chat ID:', chat_id);
    console.log('[WEBHOOK-HANDLER] Content:', responseContent || 'Generated image');
    console.log('[WEBHOOK-HANDLER] Has file attachments?', !!fileAttachments);

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

    console.log('[WEBHOOK-HANDLER] ===== DATABASE RESULT =====');
    if (error) {
      console.error('[WEBHOOK-HANDLER] Database error:', error);
      console.error('[WEBHOOK-HANDLER] Error details:', JSON.stringify(error));
      return new Response(
        JSON.stringify({ error: 'Failed to save message', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] ===== SUCCESS =====');
    console.log('[WEBHOOK-HANDLER] Message saved successfully!');
    console.log('[WEBHOOK-HANDLER] Message ID:', data.id);
    console.log('[WEBHOOK-HANDLER] Message data:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ success: true, message_id: data.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[WEBHOOK-HANDLER] ===== UNEXPECTED ERROR =====');
    console.error('[WEBHOOK-HANDLER] Error:', error);
    console.error('[WEBHOOK-HANDLER] Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('[WEBHOOK-HANDLER] Error stack:', error instanceof Error ? error.stack : 'No stack');
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