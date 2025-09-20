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
          type: audioFile.type,
          hasContent: audioFile.size > 0
        });
        
        // Additional validation for corrupted files
        if (!audioFile.name || audioFile.name === 'undefined') {
          console.error('❌ Invalid audio file name:', audioFile.name);
          return new Response(
            JSON.stringify({ error: 'Invalid audio file name' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate file size (max 25MB for Whisper API)
        if (audioFile.size > 25 * 1024 * 1024) {
          console.error('❌ Audio file too large:', audioFile.size);
          return new Response(
            JSON.stringify({ error: 'Audio file too large (max 25MB)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (audioFile.size < 1000) { // Increased minimum to 1KB
          console.error('❌ Audio file too small:', audioFile.size);
          return new Response(
            JSON.stringify({ error: 'Audio file too small (min 1KB)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate audio file header to ensure it's not corrupted
        const arrayBuffer = await audioFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check for webm file signature (starts with 0x1A, 0x45, 0xDF, 0xA3)
        const isValidWebm = uint8Array.length > 4 && 
          uint8Array[0] === 0x1A && uint8Array[1] === 0x45 && 
          uint8Array[2] === 0xDF && uint8Array[3] === 0xA3;
        
        if (!isValidWebm) {
          console.error('❌ Invalid webm file format detected');
          return new Response(
            JSON.stringify({ error: 'Invalid audio format - corrupted webm file' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create a new blob with clean MIME type
        audioBlob = new Blob([uint8Array], { type: 'audio/webm' });
        filename = audioFile.name || 'audio.webm';
        
        // Ensure proper extension
        if (!filename.includes('.')) {
          filename = 'audio.webm';
        }
        
        console.log('✅ Audio processed for OpenAI:', {
          originalType: audioFile.type,
          processedType: 'audio/webm',
          filename: filename,
          size: audioBlob.size
        });
        
        console.log('✅ FormData processing complete');
        
      } catch (formDataError) {
        console.error('❌ FormData processing error:', formDataError);
        console.error('❌ FormData error details:', formDataError.stack);
        return new Response(
          JSON.stringify({ error: `FormData processing failed: ${formDataError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

        // Convert base64 to binary and create proper webm blob
        const binaryString = atob(audio);
        const audioData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          audioData[i] = binaryString.charCodeAt(i);
        }
        
        // Keep original webm format - OpenAI supports it
        audioBlob = new Blob([audioData], { type: 'audio/webm' });
        filename = 'audio.webm';
        
        console.log('✅ JSON processing complete');
        
      } catch (jsonError) {
        console.error('❌ JSON processing error:', jsonError);
        console.error('❌ JSON error details:', jsonError.stack);
        return new Response(
          JSON.stringify({ error: `JSON processing failed: ${jsonError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Final validation of audio blob
    if (!audioBlob || audioBlob.size === 0) {
      console.error('❌ Invalid audio blob');
      return new Response(
        JSON.stringify({ error: 'Invalid audio data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      
      // Return specific error messages based on status
      if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: 'Invalid audio format or content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Speech recognition service temporarily unavailable' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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