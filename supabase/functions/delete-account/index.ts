import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create client with anon key to get current user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not found or not authenticated')
    }

    // First, delete all user images from storage
    try {
      const { error: storageError } = await supabaseAdmin.functions.invoke('delete-all-user-images', {
        body: {
          userId: user.id
        }
      });
      
      if (storageError) {
        console.error('Error deleting user images from storage:', storageError);
      } else {
        console.log('Successfully deleted all user images from storage');
      }
    } catch (storageError) {
      console.error('Error invoking delete-all-user-images:', storageError);
      // Continue with account deletion even if storage cleanup fails
    }

    // Delete user data first (profiles, chats, messages will be handled by cascading)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
    }

    // Delete user's chats (messages will be cascade deleted)
    const { error: chatsError } = await supabaseAdmin
      .from('chats')
      .delete()
      .eq('user_id', user.id)

    if (chatsError) {
      console.error('Error deleting chats:', chatsError)
    }

    // Finally, delete the user from auth
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      throw new Error('Account deletion failed')
    }

    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error deleting account:', error)
    const requestId = crypto.randomUUID();
    return new Response(
      JSON.stringify({ 
        error: 'Unable to process request',
        requestId 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})