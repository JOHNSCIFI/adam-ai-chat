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

// Function to generate embeddings for text
async function generateEmbedding(text: string): Promise<number[]> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.warn('OpenAI API key not available for embeddings');
    return [];
  }

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

    if (!response.ok) {
      console.error('Embedding generation failed:', response.status);
      return [];
    }

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
    console.log('[CHAT-WITH-AI] Received request:', { message, chat_id, user_id });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // First, get the current chat to check if it belongs to a project
    const { data: currentChat, error: chatError } = await supabase
      .from('chats')
      .select('project_id')
      .eq('id', chat_id)
      .single();

    if (chatError) {
      console.error('Error fetching chat:', chatError);
      throw new Error('Failed to fetch chat information');
    }

    let messages;
    let messagesError;

    if (currentChat?.project_id) {
      // If chat belongs to a project, fetch messages from all chats in that project for context
      console.log('Fetching project-wide context for project:', currentChat.project_id);
      
      // First get all chat IDs for this project
      const { data: projectChats, error: chatsError } = await supabase
        .from('chats')
        .select('id')
        .eq('project_id', currentChat.project_id);

      if (chatsError) {
        console.error('Error fetching project chats:', chatsError);
        throw new Error('Failed to fetch project chats');
      }

      const chatIds = projectChats?.map(chat => chat.id) || [];
      
      const { data: projectMessages, error: projectMessagesError } = await supabase
        .from('messages')
        .select('content, role, created_at, chat_id')
        .in('chat_id', chatIds)
        .order('created_at', { ascending: true });

      messages = projectMessages;
      messagesError = projectMessagesError;
    } else {
      // Regular chat - fetch only from current chat
      console.log('Fetching chat-specific context for chat:', chat_id);
      
      const { data: chatMessages, error: chatMessagesError } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: true });

      messages = chatMessages;
      messagesError = chatMessagesError;
    }

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
    let responseContent = assistantMessage.content || '';

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
        const temporaryImageUrl = imageData.data[0].url;
        
        console.log('Image generated successfully:', temporaryImageUrl);

        // Save image permanently to Supabase storage
        const permanentImageUrl = await saveImageToStorage(temporaryImageUrl, user_id, imagePrompt);
        const finalImageUrl = permanentImageUrl || temporaryImageUrl;
        
        // Increment usage counter for successful image generation
        console.log('Incrementing image generation usage for user:', user_id);
        const { data: incrementData, error: incrementError } = await supabase
          .rpc('increment_image_generation', { p_user_id: user_id });
        
        if (incrementError) {
          console.error('Failed to increment usage:', incrementError);
        } else {
          console.log('Usage incremented successfully:', incrementData);
        }

        responseContent = `I've generated an image for you: "${imagePrompt}"`;

        // Return response indicating image generation with the permanent image URL
        return new Response(JSON.stringify({
          type: 'image_generated',
          content: responseContent,
          image_url: finalImageUrl,
          prompt: imagePrompt
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Error in image generation:', error);
        // Fallback to text response if image generation fails
        responseContent = 'I apologize, but I encountered an error while generating the image. Please try again with a different prompt.';
      }
    }

    // Generate embedding for the response (for semantic search)
    const embedding = await generateEmbedding(responseContent);

    // Regular text response
    console.log('Text response');
    return new Response(JSON.stringify({
      type: 'text',
      content: responseContent,
      embedding: embedding.length > 0 ? embedding : null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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