import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type');
    let audioData: Uint8Array;
    let filename = 'audio.webm';

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (File upload)
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File;
      
      if (!audioFile) {
        throw new Error('No audio file provided');
      }

      audioData = new Uint8Array(await audioFile.arrayBuffer());
      filename = audioFile.name || 'audio.webm';
    } else {
      // Handle JSON (base64 audio from voice mode)
      const { audio } = await req.json();
      
      if (!audio) {
        throw new Error('No audio data provided');
      }

      // Convert base64 to binary
      const binaryString = atob(audio);
      audioData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }
    }

    // Create a blob and form data for OpenAI
    const blob = new Blob([audioData], { type: 'audio/webm' });
    const openaiFormData = new FormData();
    openaiFormData.append('file', blob, filename);
    openaiFormData.append('model', 'whisper-1');

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});