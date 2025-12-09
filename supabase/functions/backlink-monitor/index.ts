// Backlink Monitor Function
// This function integrates with Ahrefs / Moz / Semrush to monitor backlinks
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("Backlink monitor function started");

serve(async (_req) => {
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

  try {
    // Get all projects that need backlink monitoring
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

    // Process each project
    for (const project of projects) {
      try {
        // Fetch backlink data from Ahrefs/Moz/Semrush
        const backlinkData = await fetchBacklinkData(project);
        
        if (backlinkData && backlinkData.length > 0) {
          // Store the backlink data
          for (const backlink of backlinkData) {
            const { error: insertError } = await supabaseAdmin
              .from('backlinks')
              .insert({
                project_id: project.id,
                url: backlink.url,
                source_url: backlink.source_url,
                anchor_text: backlink.anchor_text,
                domain_authority: backlink.domain_authority,
                spam_score: backlink.spam_score,
                link_type: backlink.link_type
              });
            
            if (insertError) {
              console.error(`Error storing backlink for project ${project.id}:`, insertError);
            }
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

async function fetchBacklinkData(project: any) {
  // This is where you would integrate with Ahrefs/Moz/Semrush
  // For now, returning mock data
  
  // Example integration with Ahrefs API:
  /*
  const ahrefsApiKey = Deno.env.get('AHREFS_API_KEY');
  const response = await fetch(`https://apiv2.ahrefs.com/?token=${ahrefsApiKey}&from=backlinks_new_lost&target=${encodeURIComponent(project.url)}&mode=recent&output=json`);
  const data = await response.json();
  
  // Extract backlink information from the response
  // ... process data ...
  */
  
  // Mock data for demonstration
  return [
    {
      url: `https://example.com/page-${Math.floor(Math.random() * 100)}`,
      source_url: `https://source-${Math.floor(Math.random() * 1000)}.com`,
      anchor_text: 'SEO Optimization',
      domain_authority: Math.floor(Math.random() * 100),
      spam_score: Math.floor(Math.random() * 100),
      link_type: Math.random() > 0.5 ? 'dofollow' : 'nofollow'
    },
    {
      url: `https://example.com/page-${Math.floor(Math.random() * 100)}`,
      source_url: `https://source-${Math.floor(Math.random() * 1000)}.com`,
      anchor_text: 'Digital Marketing',
      domain_authority: Math.floor(Math.random() * 100),
      spam_score: Math.floor(Math.random() * 100),
      link_type: Math.random() > 0.5 ? 'dofollow' : 'nofollow'
    }
  ];
}