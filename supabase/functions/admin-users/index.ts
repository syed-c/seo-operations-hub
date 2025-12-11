// Supabase Edge Function for admin operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Admin operations function started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        db: { schema: 'public' },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Get the request data
    const { action, table, data, filters } = await req.json();
    console.log(`Admin action: ${action} on table: ${table}`);

    let result;

    switch (action) {
      case 'create':
        result = await supabaseAdmin.from(table).insert(data).select();
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
        {
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
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Admin action ${action} successful, returned ${result.data?.length || 0} records`);
    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
