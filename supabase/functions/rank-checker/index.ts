import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Rank checker function started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      db: { schema: 'public' },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    
    const { data: keywords, error } = await supabaseAdmin
      .from('keywords')
      .select('*');
    
    if (error) {
      console.error('Error fetching keywords:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch keywords' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing ${keywords?.length || 0} keywords`);

    for (const keyword of keywords || []) {
      try {
        // TODO: Integrate with SerpAPI or DataForSEO for real rankings
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
          
        console.log(`Updated keyword ${keyword.id} with position ${position}`);
      } catch (err) {
        console.error(`Error processing keyword ${keyword.id}:`, err);
      }
    }

    // Log automation run
    await supabaseAdmin.from('automation_logs').insert({
      function_name: 'rank-checker',
      status: 'completed',
      records_processed: keywords?.length || 0,
      executed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${keywords?.length || 0} keywords` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
