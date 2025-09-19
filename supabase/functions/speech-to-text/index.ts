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
    console.log('🎤 Speech-to-text request received');
    console.log('📊 Request method:', req.method);
    console.log('📊 Content-Type:', req.headers.get('content-type'));
    
    const contentType = req.headers.get('content-type');
    let audioBlob: Blob;
    let filename = 'audio.webm';

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData (File upload from voice mode)
      console.log('📥 Processing FormData request');
      
      try {
        const formData = await req.formData();
        console.log('📥 FormData keys:', Array.from(formData.keys()));
        
        const audioFile = formData.get('audio') as File;
        
        if (!audioFile) {
          console.error('❌ No audio file in FormData');
          throw new Error('No audio file provided in FormData');
        }

        console.log('📁 Audio file details:', {
          name: audioFile.name,
          size: audioFile.size,
          type: audioFile.type
        });

        // Validate file size (max 25MB for Whisper API)
        if (audioFile.size > 25 * 1024 * 1024) {
          throw new Error('Audio file too large (max 25MB)');
        }

        if (audioFile.size < 100) {
          throw new Error('Audio file too small (min 100 bytes)');
        }

        // Use the file directly as a blob
        audioBlob = audioFile;
        filename = audioFile.name || 'audio.webm';
        
        // Ensure we have a proper extension
        if (!filename.includes('.') && audioFile.type) {
          const extension = audioFile.type.split('/')[1]?.split(';')[0] || 'webm';
          filename = `audio.${extension}`;
        }
        
        console.log('✅ FormData processing complete');
        
      } catch (formDataError) {
        console.error('❌ FormData processing error:', formDataError);
        throw new Error(`FormData processing failed: ${formDataError.message}`);
      }
      
    } else {
      // Handle JSON (base64 audio)
      console.log('📥 Processing JSON request');
      
      try {
        const requestBody = await req.json();
        const audio = requestBody?.audio;
        
        if (!audio) {
          console.error('❌ No audio data in JSON');
          throw new Error('No audio data provided in JSON');
        }

        console.log('📊 Base64 audio length:', audio.length);

        // Convert base64 to binary
        const binaryString = atob(audio);
        const audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }
        
        audioBlob = new Blob([audioData], { type: 'audio/webm' });
        filename = 'audio.webm';
        
        console.log('✅ JSON processing complete');
        
      } catch (jsonError) {
        console.error('❌ JSON processing error:', jsonError);
        throw new Error(`JSON processing failed: ${jsonError.message}`);
      }
    }

    console.log('🔊 Final audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
      filename: filename
    });

    // Validate OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create form data for OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioBlob, filename);
    openaiFormData.append('model', 'whisper-1');

    console.log('🚀 Sending to OpenAI Whisper API...');
    console.log('📊 FormData for OpenAI:', {
      hasFile: openaiFormData.has('file'),
      hasModel: openaiFormData.has('model'),
      filename: filename
    });

    // Send to OpenAI Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: openaiFormData,
    });

    console.log('📡 OpenAI response status:', response.status);
    console.log('📡 OpenAI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ OpenAI transcription result:', result);

    if (!result.text) {
      console.warn('⚠️ Empty transcription result');
      return new Response(
        JSON.stringify({ text: '', warning: 'Empty transcription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Transcription successful:', result.text);

    return new Response(
      JSON.stringify({ text: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Speech-to-text error:', error);
    console.error('📍 Error name:', error.name);
    console.error('📍 Error message:', error.message);
    console.error('📍 Error stack (first 500 chars):', error.stack?.slice(0, 500));
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        errorType: error.name,
        details: `Speech-to-text processing failed: ${error.message}`
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});