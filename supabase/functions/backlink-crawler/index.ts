// Backlink Crawler Function
// This function crawls for backlinks using DIY methods
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

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
    // Get all websites that need backlink crawling
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
        // Crawl for backlinks
        const backlinks = await crawlBacklinks(website);
        
        // Store new backlinks
        for (const backlink of backlinks) {
          // Check if backlink already exists
          const { data: existing, error: checkError } = await supabaseAdmin
            .from('backlinks')
            .select('id')
            .eq('url', backlink.url)
            .eq('source_url', backlink.source_url)
            .single();
          
          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error(`Error checking existing backlink:`, checkError);
            continue;
          }
          
          if (!existing) {
            // Insert new backlink
            const { error: insertError } = await supabaseAdmin
              .from('backlinks')
              .insert({
                project_id: website.project_id,
                url: backlink.url,
                source_url: backlink.source_url,
                anchor_text: backlink.anchor_text,
                discovered_at: new Date().toISOString()
              });
            
            if (insertError) {
              console.error(`Error inserting backlink:`, insertError);
            }
          }
        }
        
        // Mark old backlinks as lost (simple implementation)
        // In a real implementation, you would compare with previous crawl results
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const { error: updateError } = await supabaseAdmin
          .from('backlinks')
          .update({ lost: true })
          .lt('discovered_at', oneWeekAgo.toISOString())
          .is('lost', null);
        
        if (updateError) {
          console.error(`Error marking lost backlinks:`, updateError);
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

async function crawlBacklinks(website: WebsiteData): Promise<Backlink[]> {
  const bingApiKey = Deno.env.get('BING_API_KEY');
  const scraperApiKey = Deno.env.get('SCRAPER_API_KEY');
  
  try {
    const backlinks: Backlink[] = [];
    const domain = new URL(website.url).hostname;
    
    // Method 1: Bing Web Search API (if available)
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
            // Extract links from result (simplified)
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
    
    // Method 2: DuckDuckGo HTML scraper (free)
    try {
      // In a real implementation, you would scrape DuckDuckGo search results
      // For demo purposes, we'll create mock backlinks
      
      // Generate some mock backlinks
      for (let i = 0; i < 10; i++) {
        backlinks.push({
          url: website.url,
          source_url: `https://example${i}.com/article-${Math.random().toString(36).substring(7)}`,
          anchor_text: `Link to ${domain}`
        });
      }
    } catch (duckduckgoError) {
      console.error('DuckDuckGo scraper error:', duckduckgoError);
    }
    
    // Method 3: Free SERP scrapers
    if (scraperApiKey) {
      try {
        // Example using ScraperAPI or similar service
        const response = await fetch(
          `http://api.scraperapi.com?api_key=${scraperApiKey}&url=https://www.google.com/search?q=link:${domain}`
        );
        
        // In a real implementation, you would parse the HTML response
        // For demo purposes, we'll add more mock backlinks
        
        for (let i = 10; i < 15; i++) {
          backlinks.push({
            url: website.url,
            source_url: `https://blog${i}.com/post-${Math.random().toString(36).substring(7)}`,
            anchor_text: `Visit ${domain}`
          });
        }
      } catch (scraperError) {
        console.error('Scraper API error:', scraperError);
      }
    }
    
    return backlinks;
  } catch (error) {
    console.error('Error crawling backlinks:', error);
    return [];
  }
}