// Backlink Monitor Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Backlink monitor function started");

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
    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select('*');
    
    if (error) {
      console.error('Error fetching projects:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const project of projects || []) {
      try {
        const backlinkData = await fetchBacklinkData(project);
        
        if (backlinkData && backlinkData.length > 0) {
          for (const backlink of backlinkData) {
            await supabaseAdmin
              .from('backlinks')
              .insert({
                project_id: project.id,
                url: backlink.url,
                source_url: backlink.source_url,
                anchor_text: backlink.anchor_text,
                discovered_at: new Date().toISOString()
              });
          }
        }
      } catch (err) {
        console.error(`Error processing project ${project.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${projects?.length || 0} projects` }), {
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

async function fetchBacklinkData(_project: { id: string }) {
  return [
    {
      url: `https://example.com/page-${Math.floor(Math.random() * 100)}`,
      source_url: `https://source-${Math.floor(Math.random() * 1000)}.com`,
      anchor_text: 'SEO Optimization'
    }
  ];
}
