// GSC Analytics Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { data: websites, error } = await supabaseAdmin
      .from('websites')
      .select('*')
      .eq('monitoring_enabled', true);
    
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch websites' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const website of websites || []) {
      try {
        const gscMetrics = await fetchGSCData(website);
        
        for (const metric of gscMetrics) {
          await supabaseAdmin.from('gsc_metrics').insert(metric);
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
  const metrics: GSCMetric[] = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    metrics.push({
      project_id: website.project_id,
      page_url: `${website.url}/page-1`,
      clicks: Math.floor(Math.random() * 100),
      impressions: Math.floor(Math.random() * 1000),
      ctr: parseFloat((Math.random() * 0.2).toFixed(4)),
      avg_position: parseFloat((Math.random() * 50 + 1).toFixed(2)),
      date: date.toISOString().split('T')[0]
    });
  }
  
  return metrics;
}
