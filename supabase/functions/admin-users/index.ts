import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Admin operations function started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    // Get the request data
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('Failed to parse JSON body:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, table, data, filters } = body;
    console.log(`Admin action: ${action} on table: ${table}`, { data, filters });

    if (!action || !table) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action and table' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let result;

    switch (action) {
      case 'create':
        console.log('Processing create action for table:', table);
        // Check if this is for auth user creation
        if (table === 'auth_user') {
          console.log('Identified as auth user creation request');
          const { email, password, email_confirm, user_metadata } = data;
          
          const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || undefined, // Only include password if provided
            emailConfirm: email_confirm !== false, // Default to true if not specified
            userMetadata: user_metadata || {},
          });
          
          if (authError) {
            console.error('Auth user creation error:', authError);
            // Check if it's an email exists error
            if (authError.code === 'email_exists') {
              return new Response(
                JSON.stringify({ error: 'A user with this email already exists', code: 'email_exists' }),
                { 
                  status: 409, // Conflict status code for duplicate email
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            } else {
              return new Response(
                JSON.stringify({ error: authError.message, details: authError }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }
          }
          
          result = { data: [authResult.user] };
          console.log('Auth user created successfully, ID:', authResult.user.id);
        } else {
          console.log('Processing as regular database insert for table:', table);
          result = await supabaseAdmin.from(table).insert(data).select();
        }
        break;
      case 'update':
        {
          let query = supabaseAdmin.from(table).update(data);
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query.select();
        }
        break;
      case 'delete':
        // Check if this is for auth user deletion
        if (table === 'auth_user') {
          console.log('Deleting auth user with ID:', filters?.id);
          if (!filters?.id) {
            return new Response(
              JSON.stringify({ error: 'User ID is required for auth user deletion' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(filters.id);
          
          if (authError) {
            console.error('Auth user deletion error:', authError);
            return new Response(
              JSON.stringify({ error: authError.message, details: authError }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          result = { data: [] };
        } else {
          let query = supabaseAdmin.from(table).delete();
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query;
        }
        break;
      case 'select':
        {
          let query = supabaseAdmin.from(table).select(data?.select || '*');
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query;
        }
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use create, update, delete, or select' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return new Response(
        JSON.stringify({ error: result.error.message, details: result.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Admin action ${action} successful, returned ${result.data?.length || 0} records`);
    return new Response(
      JSON.stringify({ data: result.data }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
