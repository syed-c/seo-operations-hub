// Backlink Crawler Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Backlink crawler function started");

interface WebsiteData {
  id: string;
  project_id: string;
  url: string;
}

interface Backlink {
  url: string;
  source_url: string;
  anchor_text: string;
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
      console.error('Error fetching websites:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch websites' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const website of websites || []) {
      try {
        const backlinks = await crawlBacklinks(website);
        
        for (const backlink of backlinks) {
          const { data: existing, error: checkError } = await supabaseAdmin
            .from('backlinks')
            .select('id')
            .eq('url', backlink.url)
            .eq('source_url', backlink.source_url)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error(`Error checking existing backlink:`, checkError);
            continue;
          }
          
          if (!existing) {
            await supabaseAdmin
              .from('backlinks')
              .insert({
                project_id: website.project_id,
                url: backlink.url,
                source_url: backlink.source_url,
                anchor_text: backlink.anchor_text,
                discovered_at: new Date().toISOString()
              });
          }
        }
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        await supabaseAdmin
          .from('backlinks')
          .update({ lost: true })
          .lt('discovered_at', oneWeekAgo.toISOString())
          .is('lost', null);
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

async function crawlBacklinks(website: WebsiteData): Promise<Backlink[]> {
  const bingApiKey = Deno.env.get('BING_API_KEY');
  
  try {
    const backlinks: Backlink[] = [];
    const domain = new URL(website.url).hostname;
    
    if (bingApiKey) {
      try {
        const response = await fetch(
          `https://api.bing.microsoft.com/v7.0/search?q=link:${domain}&count=50`,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': bingApiKey
            }
          }
        );
        
        const data = await response.json();
        
        if (data.webPages && data.webPages.value) {
          for (const result of data.webPages.value) {
            backlinks.push({
              url: website.url,
              source_url: result.url,
              anchor_text: result.name || ''
            });
          }
        }
      } catch (bingError) {
        console.error('Bing API error:', bingError);
      }
    }
    
    // Generate mock backlinks for demo
    for (let i = 0; i < 5; i++) {
      backlinks.push({
        url: website.url,
        source_url: `https://example${i}.com/article-${Math.random().toString(36).substring(7)}`,
        anchor_text: `Link to ${domain}`
      });
    }
    
    return backlinks;
  } catch (error) {
    console.error('Error crawling backlinks:', error);
    return [];
  }
}
