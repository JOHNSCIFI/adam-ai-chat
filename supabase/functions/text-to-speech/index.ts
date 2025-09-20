import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📥 TTS request received:', { textLength: requestBody.text?.length, voice: requestBody.voice });
    
    const { text, voice } = requestBody;

    if (!text) {
      throw new Error('Text is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('❌ OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    console.log('🔊 Generating speech for text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));

    // Generate speech from text using OpenAI's TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    });

    console.log('🎵 OpenAI TTS response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI TTS error response:', errorText);
      let errorMessage = 'Failed to generate speech';
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (parseError) {
        console.error('❌ Could not parse OpenAI error response');
      }
      
      throw new Error(errorMessage);
    }

    // Convert audio buffer to base64
    console.log('🔄 Converting audio to base64...');
    const arrayBuffer = await response.arrayBuffer();
    console.log('📊 Audio buffer size:', arrayBuffer.byteLength, 'bytes');
    
    // Use a more efficient base64 encoding method for large files
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64Audio = '';
    
    // Process in chunks to avoid memory issues
    const chunkSize = 32768; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      const chunkString = String.fromCharCode.apply(null, Array.from(chunk));
      base64Audio += btoa(chunkString);
    }

    console.log('✅ Speech generated successfully, base64 length:', base64Audio.length);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ TTS function error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.name || 'UnknownError'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});