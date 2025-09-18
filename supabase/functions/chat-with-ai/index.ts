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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chat_id, user_id } = await req.json();
    console.log('Received request:', { message, chat_id, user_id });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch chat history to provide context
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('chat_id', chat_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch chat history');
    }

    console.log('Chat history:', messages);

    // Build conversation context for OpenAI
    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add the current message
    conversationHistory.push({
      role: 'user',
      content: message
    });

    console.log('Sending to OpenAI:', conversationHistory);

    // Call OpenAI with function calling for image generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are AdamGPT, a helpful AI assistant. If the user asks you to generate, create, make, or draw an image, use the generate_image function. Always be helpful and provide detailed responses.'
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
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const assistantMessage = data.choices[0].message;

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

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          console.error('Image generation error:', errorText);
          throw new Error('Failed to generate image');
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.data[0].url;
        
        console.log('Image generated successfully:', imageUrl);

        // Return response indicating image generation with the image URL
        return new Response(JSON.stringify({
          type: 'image_generated',
          content: `I've generated an image for you: "${imagePrompt}"`,
          image_url: imageUrl,
          prompt: imagePrompt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error in image generation:', error);
        // Fallback to text response if image generation fails
        return new Response(JSON.stringify({
          type: 'text',
          content: 'I apologize, but I encountered an error while generating the image. Please try again with a different prompt.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Regular text response
      console.log('Text response');
      return new Response(JSON.stringify({
        type: 'text',
        content: assistantMessage.content || 'I apologize, but I could not generate a response.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in chat-with-ai function:', error);
    return new Response(JSON.stringify({
      type: 'error',
      content: 'I apologize, but I encountered an error. Please try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});