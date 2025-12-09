// Supabase Edge Function for admin operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Admin operations function started");

Deno.serve(async (req: Request) => {
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

  try {
    let result;

    switch (action) {
      case 'create':
        result = await supabaseAdmin.from(table).insert(data);
        break;
      case 'update':
        {
          let query = supabaseAdmin.from(table).update(data);
          // Apply filters for update operations
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query;
        }
        break;
      case 'delete':
        {
          let query = supabaseAdmin.from(table).delete();
          // Apply filters for delete operations
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
          // Apply filters for select operations
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
          { headers: { 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error.message }),
        { headers: { 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ data: result.data }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
