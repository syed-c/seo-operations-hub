import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Backlink monitor function started");

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

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*');
    
    if (error) {
      console.error('Error fetching projects:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing backlinks for ${projects?.length || 0} projects`);
    let totalBacklinks = 0;

    for (const project of projects || []) {
      try {
        const backlinkData = await fetchBacklinkData(project);
        
        if (backlinkData && backlinkData.length > 0) {
          for (const backlink of backlinkData) {
            // Check if backlink already exists
            const { data: existing } = await supabaseAdmin
              .from('backlinks')
              .select('id')
              .eq('project_id', project.id)
              .eq('source_url', backlink.source_url)
              .single();
            
            if (!existing) {
              await supabaseAdmin
                .from('backlinks')
                .insert({
                  project_id: project.id,
                  url: backlink.url,
                  source_url: backlink.source_url,
                  anchor_text: backlink.anchor_text,
                  status: 'active',
                  discovered_at: new Date().toISOString()
                });
              totalBacklinks++;
              console.log(`Added new backlink for project ${project.id}`);
            }
          }
        }
      } catch (err) {
        console.error(`Error processing project ${project.id}:`, err);
      }
    }

    // Log automation run
    await supabaseAdmin.from('automation_logs').insert({
      function_name: 'backlink-monitor',
      status: 'completed',
      records_processed: totalBacklinks,
      executed_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: `Processed ${projects?.length || 0} projects, found ${totalBacklinks} new backlinks` 
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

interface BacklinkData {
  url: string;
  source_url: string;
  anchor_text: string;
}

async function fetchBacklinkData(_project: { id: string; name?: string }): Promise<BacklinkData[]> {
  // TODO: Integrate with Ahrefs/Moz/Semrush API for real backlink data
  // For now, return empty array to avoid cluttering database
  const ahrefsApiKey = Deno.env.get('AHREFS_API_KEY');
  
  if (ahrefsApiKey) {
    console.log('Ahrefs API key found, but integration not yet implemented');
  }
  
  // Return empty array instead of mock data to avoid cluttering database
  // In production, this should call the actual API
  return [];
}
