// GSC Analytics Function
// This function fetches Google Search Console data
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("GSC analytics function started");

interface WebsiteData {
  id: string;
  project_id: string;
  url: string;
}

interface GSCMetric {
  project_id: string;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  date: string;
}

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
    // Get all websites that need GSC analytics
    const { data: websites, error } = await supabaseAdmin
      .from('websites')
      .select('*')
      .eq('monitoring_enabled', true);
    
    if (error) {
      console.error('Error fetching websites:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch websites' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process each website
    for (const website of websites) {
      try {
        // Fetch GSC data (in a real implementation, you would integrate with GSC API)
        const gscMetrics = await fetchGSCData(website);
        
        // Store GSC metrics
        for (const metric of gscMetrics) {
          const { error: insertError } = await supabaseAdmin
            .from('gsc_metrics')
            .insert(metric);
          
          if (insertError) {
            console.error(`Error inserting GSC metric:`, insertError);
          }
        }
      } catch (err) {
        console.error(`Error processing website ${website.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${websites?.length || 0} websites` }), {
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

async function fetchGSCData(website: WebsiteData): Promise<GSCMetric[]> {
  // In a real implementation, you would integrate with Google Search Console API
  // For demo purposes, we'll generate mock data
  
  const metrics: GSCMetric[] = [];
  const today = new Date();
  
  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate some mock pages
    for (let j = 0; j < 5; j++) {
      metrics.push({
        project_id: website.project_id,
        page_url: `${website.url}/page-${j + 1}`,
        clicks: Math.floor(Math.random() * 100),
        impressions: Math.floor(Math.random() * 1000),
        ctr: parseFloat((Math.random() * 0.2).toFixed(4)), // 0-20%
        avg_position: parseFloat((Math.random() * 50 + 1).toFixed(2)), // 1-50
        date: date.toISOString().split('T')[0]
      });
    }
  }
  
  return metrics;
}