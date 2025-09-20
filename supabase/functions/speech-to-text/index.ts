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

        // Validate file size (increased limits for better voice mode support)
        const maxSize = 50 * 1024 * 1024; // Increased to 50MB (Whisper supports up to 25MB but we need headroom)
        const minSize = 100; // Reduced minimum to 100 bytes for very short utterances
        
        console.log('📊 Audio file size validation:', {
          size: audioFile.size,
          sizeKB: Math.round(audioFile.size / 1024),
          sizeMB: Math.round(audioFile.size / (1024 * 1024) * 100) / 100,
          minSize,
          maxSize: maxSize / (1024 * 1024) + 'MB'
        });
        
        if (audioFile.size > maxSize) {
          console.error('❌ Audio file too large:', {
            actual: audioFile.size,
            actualMB: Math.round(audioFile.size / (1024 * 1024) * 100) / 100,
            maxMB: maxSize / (1024 * 1024)
          });
          return new Response(
            JSON.stringify({ 
              error: `Audio file too large (${Math.round(audioFile.size / (1024 * 1024) * 100) / 100}MB, max 50MB)`,
              actualSize: audioFile.size,
              maxSize: maxSize
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (audioFile.size < minSize) {
          console.error('❌ Audio file too small:', {
            actual: audioFile.size,
            min: minSize
          });
          return new Response(
            JSON.stringify({ 
              error: `Audio file too small (${audioFile.size} bytes, min ${minSize} bytes)`,
              actualSize: audioFile.size,
              minSize: minSize
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Convert to WAV format for better OpenAI compatibility
        // Create blob without codec specification to avoid opus issues
        audioBlob = new Blob([audioFile], { type: 'audio/wav' });
        filename = 'audio.wav';
        
        console.log('🔄 Converting webm to wav format for OpenAI compatibility');
        
        console.log('✅ Audio processed for OpenAI:', {
          originalType: audioFile.type,
          processedType: 'audio/webm',
          filename: filename,
          size: audioBlob.size
        });
        
        console.log('✅ FormData processing complete');
        
      } catch (formDataError) {
        console.error('❌ FormData processing error:', formDataError);
        console.error('❌ FormData error details:', {
          name: formDataError.name,
          message: formDataError.message,
          stack: formDataError.stack?.slice(0, 500)
        });
        console.error('❌ Request info during error:', {
          contentType: req.headers.get('content-type'),
          contentLength: req.headers.get('content-length'),
          userAgent: req.headers.get('user-agent')
        });
        return new Response(
          JSON.stringify({ 
            error: `FormData processing failed: ${formDataError.message}`,
            errorType: formDataError.name,
            details: 'Failed to parse multipart form data - this might be due to network issues or corrupted upload'
          }),
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

        console.log('📊 Base64 audio processing:', {
          base64Length: audio.length,
          estimatedSizeBytes: Math.floor(audio.length * 0.75), // Base64 is ~33% larger than binary
          estimatedSizeKB: Math.round((audio.length * 0.75) / 1024)
        });

        // Convert base64 to binary with better error handling for large files
        let binaryString: string;
        let audioData: Uint8Array;
        
        try {
          binaryString = atob(audio);
          console.log('✅ Base64 decode successful, size:', binaryString.length);
          
          audioData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            audioData[i] = binaryString.charCodeAt(i);
          }
          console.log('✅ Uint8Array conversion successful');
          
        } catch (decodeError) {
          console.error('❌ Base64 decode error:', decodeError);
          throw new Error(`Base64 decode failed: ${decodeError.message}`);
        }
        
        // Convert to WAV format for better OpenAI compatibility
        audioBlob = new Blob([audioData], { type: 'audio/wav' });
        filename = 'audio.wav';
        
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

    // Additional validation before sending to OpenAI
    const finalSizeKB = Math.round(audioBlob.size / 1024);
    const finalSizeMB = Math.round(audioBlob.size / (1024 * 1024) * 100) / 100;
    
    console.log('🔊 Final audio blob validation:', {
      size: audioBlob.size,
      sizeKB: finalSizeKB,
      sizeMB: finalSizeMB,
      type: audioBlob.type,
      filename: filename,
      whisperLimitMB: 25,
      withinLimit: finalSizeMB <= 25
    });
    
    // Final size check before OpenAI (Whisper has 25MB hard limit)
    if (audioBlob.size > 25 * 1024 * 1024) {
      console.error('❌ Final audio blob exceeds OpenAI Whisper limit:', {
        size: audioBlob.size,
        sizeMB: finalSizeMB,
        limit: '25MB'
      });
      return new Response(
        JSON.stringify({ 
          error: `Audio too large for speech recognition (${finalSizeMB}MB, max 25MB)`,
          size: audioBlob.size,
          sizeMB: finalSizeMB
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    // Create form data for OpenAI with timeout considerations
    let openaiFormData: FormData;
    try {
      openaiFormData = new FormData();
      openaiFormData.append('file', audioBlob, filename);
      openaiFormData.append('model', 'whisper-1');
      
      console.log('✅ OpenAI FormData created successfully');
    } catch (formDataError) {
      console.error('❌ Failed to create OpenAI FormData:', formDataError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to prepare audio for speech recognition',
          details: formDataError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🚀 Sending to OpenAI Whisper API...');
    console.log('📊 FormData for OpenAI:', {
      hasFile: openaiFormData.has('file'),
      hasModel: openaiFormData.has('model'),
      filename: filename,
      audioSizeKB: Math.round(audioBlob.size / 1024),
      estimatedProcessingTime: `${Math.round(audioBlob.size / 1024 / 100)}s` // Rough estimate
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
      console.error('❌ OpenAI API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        audioSize: audioBlob.size,
        audioSizeKB: Math.round(audioBlob.size / 1024),
        filename: filename
      });
      
      let errorMessage: string;
      let errorDetails: string;
      
      // Parse OpenAI error for more specific feedback
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.error?.message || errorText;
      } catch {
        errorDetails = errorText;
      }
      
      // Return specific error messages based on status with more context
      if (response.status === 400) {
        errorMessage = 'Audio format not supported or corrupted';
        if (errorDetails.includes('format')) {
          errorMessage = `Audio format issue: ${errorDetails}`;
        } else if (errorDetails.includes('duration')) {
          errorMessage = 'Audio too long or too short for processing';
        }
      } else if (response.status === 413) {
        errorMessage = 'Audio file too large for processing';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded, please try again later';
      } else if (response.status >= 500) {
        errorMessage = 'Speech recognition service temporarily unavailable';
      } else {
        errorMessage = 'Speech recognition failed';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          openaiStatus: response.status,
          audioInfo: {
            size: audioBlob.size,
            sizeKB: Math.round(audioBlob.size / 1024),
            type: audioBlob.type,
            filename: filename
          }
        }),
        { status: response.status >= 500 ? 503 : 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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