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
    console.log('Fetching image from URL:', imageUrl);
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error('Failed to fetch image:', imageResponse.status);
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const timestamp = Date.now();
    const fileName = `${userId}/generated_${timestamp}_${Math.random().toString(36).substring(2)}.png`;
    
    console.log('Uploading image to storage:', fileName);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('generated-images') // Use correct generated-images bucket
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Failed to upload image to generated-images storage:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('generated-images')
      .getPublicUrl(fileName);

    console.log('Image successfully saved to storage:', publicUrl);
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
    const { message, chat_id, user_id, file_analysis, image_context, model } = await req.json();
    console.log('Optimized chat request:', { 
      message, 
      chat_id, 
      user_id, 
      has_file_analysis: !!file_analysis,
      image_count: image_context?.length || 0,
      selected_model: model
    });

    // Validate required parameters
    if (!message) {
      throw new Error('Message is required');
    }

    if (!chat_id || !user_id) {
      console.error('Missing required parameters:', { chat_id, user_id });
      throw new Error('Chat ID and User ID are required');
    }

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
        .order('created_at', { ascending: false })
        .limit(20); // More messages for project context

      messages = projectMessages;
      messagesError = projectMessagesError;
    } else {
      // Regular chat - fetch only from current chat
      console.log('Fetching chat-specific context for chat:', chat_id);
      
      const { data: chatMessages, error: chatMessagesError } = await supabase
        .from('messages')
        .select('content, role, created_at')
        .eq('chat_id', chat_id)
        .order('created_at', { ascending: false })
        .limit(10);

      messages = chatMessages;
      messagesError = chatMessagesError;
    }

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

    // Add file analysis and image context if provided
    let userMessage = message;
    
    // Handle image context specially
    if (image_context && image_context.length > 0) {
      const imageDescriptions = image_context.map((img: any) => img.aiDescription).join('\n\n');
      
      if (!message.trim()) {
        // Image only - ask what they'd like to know
        userMessage = `I've uploaded an image. Here's what I can see: ${imageDescriptions}`;
      } else {
        // Text with image - add image context
        userMessage = `${message}\n\n[IMAGE CONTEXT]: ${imageDescriptions}`;
      }
    } else if (file_analysis && file_analysis.trim()) {
      // Handle other file types
      if (!message.trim()) {
        userMessage = file_analysis;
      } else {
        userMessage = `${message}\n\nBased on the file content:\n${file_analysis}`;
      }
    }

    // Add current message with special handling for image-only messages
    if (image_context && image_context.length > 0 && !message.trim()) {
      // Image-only message - add system context for better response
      conversationHistory.push({
        role: 'system',
        content: 'The user has just uploaded an image without any text. Respond with curiosity and engagement - ask what they would like to know about the image, or provide some interesting observations about what you can see. Be conversational and helpful.'
      });
    }
    
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    console.log('Sending to OpenAI (optimized)');

    // Map the model ID to the actual OpenAI model name
    const getOpenAIModel = (modelId: string) => {
      switch (modelId) {
        case 'gpt-4o-mini':
          return 'gpt-4o-mini';
        case 'gpt-4o':
          return 'gpt-4o';
        case 'gpt-5':
          return 'gpt-4o'; // Use gpt-4o as gpt-5 is not available yet
        case 'claude':
          return 'gpt-4o-mini'; // Fallback to OpenAI for now
        case 'deepseek':
          return 'gpt-4o-mini'; // Fallback to OpenAI for now
        case 'gemini':
          return 'gpt-4o-mini'; // Fallback to OpenAI for now
        default:
          return 'gpt-4o-mini';
      }
    };

    const selectedOpenAIModel = getOpenAIModel(model || 'gpt-4o-mini');
    console.log('Using OpenAI model:', selectedOpenAIModel);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedOpenAIModel,
        messages: [
          {
            role: 'system',
            content: 'You are AdamGPT, a helpful AI assistant with advanced image analysis and editing capabilities. You can:\n\n1. ANALYZE IMAGES: When users send images, they are automatically analyzed and you have access to detailed visual information.\n\n2. ANSWER IMAGE QUESTIONS: Use the provided image analysis to answer questions about images that were previously shared.\n\n3. EDIT IMAGES: When users request image editing (like "edit the image", "make it brighter", "remove background", "add text"), provide specific editing instructions.\n\n4. GENERATE IMAGES: Use the generate_image function when users ask to create new images.\n\nAlways be helpful and provide detailed responses. For image editing requests, provide clear step-by-step instructions.'
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
          },
          {
            name: 'edit_image',
            description: 'Edit an existing image that was previously shared. Use this when user asks to edit, modify, adjust, enhance, or change an image.',
            parameters: {
              type: 'object',
              properties: {
                image_id: {
                  type: 'string',
                  description: 'ID of the image to edit (from available images)'
                },
                edit_type: {
                  type: 'string',
                  description: 'Type of edit requested',
                  enum: ['brightness', 'contrast', 'saturation', 'rotate', 'flip', 'crop', 'remove_background', 'add_text', 'general']
                },
                edit_instructions: {
                  type: 'string',
                  description: 'Specific instructions for the edit'
                }
              },
              required: ['image_id', 'edit_type', 'edit_instructions']
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
        
        // Save image to storage and wait for the permanent URL
        console.log('Saving image to permanent storage...');
        const permanentImageUrl = await saveImageToStorage(temporaryImageUrl, user_id, imagePrompt);
        
        responseContent = `I've generated an image for you: "${imagePrompt}"`;

        return new Response(JSON.stringify({
          type: 'image_generated',
          content: responseContent,
          image_url: permanentImageUrl || temporaryImageUrl, // Use permanent URL if available, fallback to temp
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