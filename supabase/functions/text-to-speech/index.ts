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

    console.log('🔊 Generating speech for text:', text.substring(0, 50) + '...');

    // Generate speech from text using OpenAI's TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice || 'alloy',
        response_format: 'wav',
      }),
    });

    console.log('🎵 OpenAI TTS response status:', response.status);
    console.log('🎵 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI TTS error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    // Get the audio buffer
    const arrayBuffer = await response.arrayBuffer();
    console.log('📊 Audio buffer size:', arrayBuffer.byteLength, 'bytes');
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('Received empty audio buffer from OpenAI');
    }

    // Convert to base64 using proper encoding
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64Audio = btoa(binary);
    console.log('✅ Speech generated successfully, base64 length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'wav',
        size: arrayBuffer.byteLength 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('❌ TTS function error:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorName
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});