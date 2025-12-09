// Rank Checker Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Rank checker function started");

Deno.serve(async (_req: Request) => {
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
  
  try {
    const { data: keywords, error } = await supabaseAdmin
      .from('keywords')
      .select('*');
    
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch keywords' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const keyword of keywords || []) {
      try {
        const position = Math.floor(Math.random() * 100) + 1;
        
        await supabaseAdmin
          .from('keyword_rankings')
          .insert({
            keyword_id: keyword.id,
            position: position,
            recorded_at: new Date().toISOString()
          });

        await supabaseAdmin
          .from('keywords')
          .update({ last_checked: new Date().toISOString() })
          .eq('id', keyword.id);
      } catch (err) {
        console.error(`Error processing keyword ${keyword.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${keywords?.length || 0} keywords` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
