import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatId, userId } = await req.json();

    if (!chatId || !userId) {
      throw new Error('Chat ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Deleting images for chat:', chatId, 'user:', userId);

    // List all files in the user's chat folder
    const { data: files, error: listError } = await supabase.storage
      .from('chat-images')
      .list(`${userId}/${chatId}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      // Don't throw error, just log it and continue
    }

    let deletedCount = 0;
    if (files && files.length > 0) {
      // Delete each file
      const filePaths = files.map(file => `${userId}/${chatId}/${file.name}`);
      
      const { data: deleteData, error: deleteError } = await supabase.storage
        .from('chat-images')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
      } else {
        deletedCount = filePaths.length;
        console.log(`Successfully deleted ${deletedCount} images`);
      }
    }

    // Also check for generated images that might be associated with this chat
    const { data: generatedFiles, error: generatedListError } = await supabase.storage
      .from('chat-images')
      .list(`${userId}`, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (generatedFiles && !generatedListError) {
      // Filter files that might be from this chat (generated images with timestamps)
      const chatGeneratedFiles = generatedFiles.filter(file => 
        file.name.startsWith('generated_') && 
        file.name.includes('.png')
      );

      if (chatGeneratedFiles.length > 0) {
        const generatedFilePaths = chatGeneratedFiles.map(file => `${userId}/${file.name}`);
        
        const { error: deleteGeneratedError } = await supabase.storage
          .from('chat-images')
          .remove(generatedFilePaths);

        if (!deleteGeneratedError) {
          deletedCount += generatedFilePaths.length;
          console.log(`Also deleted ${generatedFilePaths.length} generated images`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} images`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-chat-images function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});