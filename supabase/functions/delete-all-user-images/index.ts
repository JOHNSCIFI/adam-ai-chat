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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Deleting all images for user:', userId);

    // List all files in the user's folder
    const { data: files, error: listError } = await supabase.storage
      .from('chat-images')
      .list(userId, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      throw new Error(`Failed to list user files: ${listError.message}`);
    }

    let deletedCount = 0;
    if (files && files.length > 0) {
      // Build list of all files to delete
      const filePaths: string[] = [];
      
      for (const file of files) {
        if (file.name) {
          filePaths.push(`${userId}/${file.name}`);
        }
      }

      // Also check for subdirectories (chat folders)
      const { data: subFolders, error: subFolderError } = await supabase.storage
        .from('chat-images')
        .list(userId, {
          limit: 1000,
          offset: 0
        });

      if (!subFolderError && subFolders) {
        for (const folder of subFolders) {
          if (folder.name && folder.id) {
            // List files in each subfolder
            const { data: subFiles, error: subFileError } = await supabase.storage
              .from('chat-images')
              .list(`${userId}/${folder.name}`, {
                limit: 1000
              });

            if (!subFileError && subFiles) {
              for (const subFile of subFiles) {
                if (subFile.name) {
                  filePaths.push(`${userId}/${folder.name}/${subFile.name}`);
                }
              }
            }
          }
        }
      }

      // Delete all files in batches
      const batchSize = 50; // Supabase storage delete limit
      for (let i = 0; i < filePaths.length; i += batchSize) {
        const batch = filePaths.slice(i, i + batchSize);
        
        const { data: deleteData, error: deleteError } = await supabase.storage
          .from('chat-images')
          .remove(batch);

        if (deleteError) {
          console.error('Error deleting batch:', deleteError);
        } else {
          deletedCount += batch.length;
          console.log(`Deleted batch of ${batch.length} files`);
        }
      }
    }

    console.log(`Successfully deleted ${deletedCount} total images for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} images`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-all-user-images function:', error);
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