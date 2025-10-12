import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Input validation schema
const webhookSchema = z.object({
  chatId: z.string().uuid().optional(),
  chat_id: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  model: z.string().max(100).optional(),
  type: z.string().optional(),
  response_data: z.union([z.string(), z.object({}).passthrough()]).optional(),
  response: z.union([z.string(), z.object({}).passthrough()]).optional(),
  text: z.string().optional(),
  content: z.string().optional(),
  image_base64: z.string().optional(),
  image_name: z.string().optional(),
  image_type: z.string().optional(),
  body: z.object({
    chatId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    model: z.string().max(100).optional(),
  }).optional(),
});

// Sanitize content to prevent XSS
function sanitizeContent(content: string): string {
  if (typeof content !== 'string') return '';
  
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  
  // Verify API key
  const apiKey = req.headers.get('x-api-key');
  const expectedApiKey = Deno.env.get('WEBHOOK_API_KEY');
  
  if (!apiKey || !expectedApiKey || apiKey !== expectedApiKey) {
    console.error('[WEBHOOK-HANDLER] Unauthorized: Invalid or missing API key', { requestId });
    return new Response(
      JSON.stringify({ error: 'Unauthorized', requestId }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log('[WEBHOOK-HANDLER] API key verified successfully');
  
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let rawBody = await req.json();
    
    // Handle N8n sending array format: [{ body: { chatId: "..." }, image_base64: "..." }]
    let body = rawBody;
    if (Array.isArray(rawBody) && rawBody.length > 0) {
      body = rawBody[0];
    }
    
    // Validate input with zod
    const validationResult = webhookSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Webhook validation failed', { requestId });
      return new Response(
        JSON.stringify({ error: 'Invalid request data', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    body = validationResult.data;

    // Handle N8n structure: { body: { chatId: "..." }, image_base64: "..." }
    const chat_id = body.body?.chatId || body.chat_id || body.chatId;
    const user_id = body.body?.userId || body.user_id || body.userId;
    const image_base64 = body.image_base64;
    const response_data = body.response_data || body.response || body.text || body.content;
    const model = body.model || body.body?.model || body.type; // Extract model from request

    if (!chat_id) {
      console.error('[WEBHOOK-HANDLER] ERROR: Missing chat_id');
      return new Response(
        JSON.stringify({ error: 'Required field missing', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the response data to extract the text content
    let responseContent = '';
    let imageUrl = null;
    
    console.log('[WEBHOOK-HANDLER] ===== PARSING RESPONSE DATA =====');
    console.log('[WEBHOOK-HANDLER] response_data type:', typeof response_data);
    
    if (response_data) {
      if (Array.isArray(response_data) && response_data.length > 0) {
        const analysisTexts = response_data.map(item => item.text || item.content || '').filter(text => text);
        if (analysisTexts.length > 0) {
          responseContent = analysisTexts.join('\n\n');
        }
      } else if (typeof response_data === 'object' && response_data.text) {
        responseContent = response_data.text;
      } else if (typeof response_data === 'object' && (response_data.analysis || response_data.content)) {
        responseContent = response_data.analysis || response_data.content;
      } else if (typeof response_data === 'string') {
        responseContent = response_data;
      }
      
      // Sanitize content
      if (responseContent) {
        responseContent = sanitizeContent(responseContent);
      }
    }
    
    console.log('[WEBHOOK-HANDLER] Parsed responseContent:', responseContent?.substring(0, 100) || 'EMPTY');

    // Handle image generation (from root level or response_data)
    const imageData = image_base64 || response_data?.image_base64;
    console.log('[WEBHOOK-HANDLER] ===== IMAGE PROCESSING =====');
    console.log('[WEBHOOK-HANDLER] Final imageData exists?', !!imageData);
    
    if (imageData) {
      console.log('[WEBHOOK-HANDLER] Processing generated image...');
      
      try {
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
          console.log('[WEBHOOK-HANDLER] Upload successful!');
          
          // Get public URL
          const { data: urlData } = supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          
          imageUrl = urlData.publicUrl;
          console.log('[WEBHOOK-HANDLER] Public URL:', imageUrl);
        }
      } catch (imageError) {
        console.error('[WEBHOOK-HANDLER] IMAGE PROCESSING ERROR:', imageError);
      }
    }

    if (!responseContent && !imageUrl) {
      console.error('[WEBHOOK-HANDLER] No valid content or image found');
      return new Response(
        JSON.stringify({ error: 'Unable to process response', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare file attachments if image exists
    const fileAttachments = imageUrl ? [{
      id: crypto.randomUUID(),
      name: body.image_name || response_data?.image_name || `generated_image_${Date.now()}.png`,
      size: 0,
      type: body.image_type || response_data?.image_type || 'image/png',
      url: imageUrl
    }] : null;

    console.log('[WEBHOOK-HANDLER] ===== SAVING TO DATABASE =====');

    // Save the assistant message to the database
    const { data, error } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: chat_id,
        content: responseContent || '',
        role: 'assistant',
        file_attachments: fileAttachments,
        model: model,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[WEBHOOK-HANDLER] Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Unable to process request', requestId }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[WEBHOOK-HANDLER] ===== SUCCESS =====');
    console.log('[WEBHOOK-HANDLER] Message saved successfully!');
    console.log('[WEBHOOK-HANDLER] Message ID:', data.id);

    return new Response(
      JSON.stringify({ success: true, message_id: data.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[WEBHOOK-HANDLER] UNEXPECTED ERROR:', error);
    return new Response(
      JSON.stringify({ error: 'Unable to process request', requestId }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
