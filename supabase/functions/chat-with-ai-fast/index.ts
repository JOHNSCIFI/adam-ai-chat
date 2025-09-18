import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Function to generate embeddings for text (run in background)
async function generateEmbeddingBackground(text: string, messageId: string): Promise<void> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) return;

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      // Update the message with the embedding
      await supabase
        .from('messages')
        .update({ embedding })
        .eq('id', messageId);
    }
  } catch (error) {
    console.error('Background embedding generation failed:', error);
  }
}

// Function to save image to storage (run in background)
async function saveImageToStorage(imageUrl: string, userId: string, prompt: string): Promise<string | null> {
  try {
    // Download the image from OpenAI
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to download image from OpenAI');
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload image to storage:', uploadError);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName);

    console.log('Image saved to storage:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chat_id, user_id } = await req.json();
    console.log('Fast AI request:', { message, chat_id, user_id });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch only recent chat history for faster performance (last 10 messages)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch chat history');
    }

    // Reverse to get chronological order and build conversation context
    const conversationHistory = messages?.reverse().map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add the current message
    conversationHistory.push({
      role: 'user',
      content: message
    });

    console.log('Sending to OpenAI (fast)');

    // Call OpenAI with optimized settings for speed
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using faster model
        messages: [
          {
            role: 'system',
            content: 'You are AdamGPT, a helpful AI assistant. If the user asks you to generate, create, make, or draw an image, use the generate_image function. Be concise and helpful.'
          },
          ...conversationHistory
        ],
        functions: [
          {
            name: 'generate_image',
            description: 'Generate an image based on a text description. Use this when the user asks to create, generate, make, or draw an image.',
            parameters: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'A detailed description of the image to generate'
                }
              },
              required: ['prompt']
            }
          }
        ],
        function_call: 'auto',
        max_tokens: 1000, // Reduced for faster response
        temperature: 0.7,
        stream: false // Keep false for now, can implement streaming later
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const assistantMessage = data.choices[0].message;
    let responseContent = assistantMessage.content || '';
    let imageUrl = null;

    // Check if OpenAI wants to call the image generation function
    if (assistantMessage.function_call && assistantMessage.function_call.name === 'generate_image') {
      console.log('Image generation requested');
      
      try {
        const functionArgs = JSON.parse(assistantMessage.function_call.arguments);
        const imagePrompt = functionArgs.prompt;
        
        console.log('Generating image with prompt:', imagePrompt);

        // Generate image using OpenAI DALL-E
        const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024',
            quality: 'standard'
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const temporaryImageUrl = imageData.data[0].url;
          
          console.log('Image generated successfully:', temporaryImageUrl);

          // Return immediately with temporary URL
          responseContent = `I've generated an image for you: "${imagePrompt}"`;
          imageUrl = temporaryImageUrl;

          // Save image permanently in background (don't wait)
          saveImageToStorage(temporaryImageUrl, user_id, imagePrompt)
            .then(permanentUrl => {
              if (permanentUrl) {
                console.log('Image saved permanently:', permanentUrl);
                // Optionally update the message with permanent URL later
              }
            })
            .catch(error => console.error('Background image save failed:', error));

        } else {
          console.error('Image generation failed');
          responseContent = 'I apologize, but I encountered an error while generating the image. Please try again with a different prompt.';
        }

      } catch (error) {
        console.error('Error in image generation:', error);
        responseContent = 'I apologize, but I encountered an error while generating the image. Please try again with a different prompt.';
      }
    }

    // Return response immediately
    const fastResponse = {
      type: imageUrl ? 'image_generated' : 'text',
      content: responseContent,
      image_url: imageUrl,
      prompt: assistantMessage.function_call ? JSON.parse(assistantMessage.function_call.arguments).prompt : null
    };

    // Store the message in database asynchronously (don't wait)
    const messageInsert = supabase
      .from('messages')
      .insert({
        chat_id: chat_id,
        content: responseContent,
        role: 'assistant',
        file_attachments: imageUrl ? [{
          id: Date.now().toString(),
          name: `generated_image_${Date.now()}.png`,
          size: 0,
          type: 'image/png',
          url: imageUrl
        }] : []
      })
      .select()
      .single()
      .then(({ data: insertedMessage, error }) => {
        if (error) {
          console.error('Background message insert failed:', error);
        } else if (insertedMessage) {
          console.log('Message stored successfully');
          // Generate embedding in background
          generateEmbeddingBackground(responseContent, insertedMessage.id);
        }
      });

    // Don't await the database insert - return response immediately
    console.log('Returning fast response');
    return new Response(JSON.stringify(fastResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fast chat function:', error);
    return new Response(JSON.stringify({
      type: 'error',
      content: 'I apologize, but I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});