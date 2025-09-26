import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const { imageBase64, fileName, chatId, userId, imageType = 'edited' } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to blob
    const imageData = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    
    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${imageType}_${timestamp}_${fileName}`;
    const filePath = `${userId}/${chatId}/${uniqueFileName}`;

    // Determine which bucket to use based on image type
    const bucketName = imageType === 'generated' ? 'generated-images' : 'chat-images';

    console.log('Saving image to Supabase storage:', filePath, 'in bucket:', bucketName);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageData, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Image saved successfully:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        url: urlData.publicUrl,
        path: filePath,
        message: 'Image saved successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});