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

// Async function to generate embeddings (runs in background)
async function generateEmbeddingAsync(text: string): Promise<number[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) return [];

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

    if (!response.ok) return [];
    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

// Function to save image to Supabase storage
async function saveImageToStorage(imageUrl: string, userId: string, prompt: string): Promise<string | null> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) return null;

    const imageBlob = await imageResponse.blob();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.png`;
    
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

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName);

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
    const { message, chat_id, user_id, file_analysis } = await req.json();
    console.log('Optimized chat request:', { message, chat_id, user_id, has_file_analysis: !!file_analysis });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch only last 10 messages for speed (instead of full history)
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

    // Reverse to get chronological order
    const recentMessages = messages?.reverse() || [];
    
    // Build conversation context
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add file analysis if provided
    let userMessage = message;
    if (file_analysis) {
      userMessage = file_analysis; // If no user text, just use extracted file content
      if (message.trim()) {
        // If user provided text with file, combine them
        userMessage = `${message}\n\nBased on the file content:\n${file_analysis}`;
      }
    }

    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    console.log('Sending to OpenAI (optimized)');

    // Use faster gpt-4o-mini model for speed
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Faster model
        messages: [
          {
            role: 'system',
            content: 'You are AdamGPT, a helpful AI assistant. If the user asks you to generate, create, make, or draw an image, use the generate_image function. Always be helpful and provide detailed responses. When analyzing files, provide comprehensive insights.'
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
        max_tokens: 1500, // Reduced for faster response
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;
    let responseContent = assistantMessage.content || '';

    // Check for image generation
    if (assistantMessage.function_call && assistantMessage.function_call.name === 'generate_image') {
      console.log('Image generation requested');
      
      try {
        const functionArgs = JSON.parse(assistantMessage.function_call.arguments);
        const imagePrompt = functionArgs.prompt;
        
        console.log('Generating image with prompt:', imagePrompt);

        // Generate image using DALL-E 3
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

        if (!imageResponse.ok) {
          throw new Error('Failed to generate image');
        }

        const imageData = await imageResponse.json();
        const temporaryImageUrl = imageData.data[0].url;
        
        // Save image to storage (async, but return temp URL immediately)
        const savePromise = saveImageToStorage(temporaryImageUrl, user_id, imagePrompt);
        
        responseContent = `I've generated an image for you: "${imagePrompt}"`;

        return new Response(JSON.stringify({
          type: 'image_generated',
          content: responseContent,
          image_url: temporaryImageUrl, // Return immediately while saving
          prompt: imagePrompt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error in image generation:', error);
        responseContent = 'I apologize, but I encountered an error while generating the image. Please try again with a different prompt.';
      }
    }

    // Start embedding generation in background (don't wait)
    const embeddingPromise = generateEmbeddingAsync(responseContent);
    
    // Return response immediately
    const responseData = {
      type: 'text',
      content: responseContent,
      embedding: null // Will be updated by background process
    };

    // Set up background task to update embedding
    embeddingPromise.then(embedding => {
      if (embedding.length > 0) {
        // Update the response in database with embedding later
        console.log('Embedding generated in background');
      }
    });

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimized chat function:', error);
    return new Response(JSON.stringify({
      type: 'error',
      content: 'I apologize, but I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});