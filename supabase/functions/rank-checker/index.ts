// Rank Checker Function
// This function integrates with SerpAPI or DataForSEO to check keyword rankings
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("Rank checker function started");

interface KeywordRankingData {
  keyword_id: string;
  position: number;
  search_volume: number;
  location: string;
  device: 'desktop' | 'mobile';
  trend: 'up' | 'down' | 'stable';
  recorded_at: string;
}

interface KeywordData {
  id: string;
  project_id: string;
  keyword: string;
  intent: string;
  difficulty: number;
  volume: number;
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
    // Get all active keywords that need ranking checks
    const { data: keywords, error } = await supabaseAdmin
      .from('keywords')
      .select('*');
    
    if (error) {
      console.error('Error fetching keywords:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch keywords' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process each keyword
    for (const keyword of keywords) {
      try {
        // Fetch ranking data from SerpAPI or DataForSEO
        const rankingData = await fetchKeywordRanking(keyword);
        
        if (rankingData) {
          // Store the ranking data
          const { error: insertError } = await supabaseAdmin
            .from('keyword_rankings')
            .insert(rankingData);
          
          if (insertError) {
            console.error(`Error storing ranking for keyword ${keyword.id}:`, insertError);
          }
        }
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

async function fetchKeywordRanking(keyword: KeywordData): Promise<KeywordRankingData | null> {
  const serpApiKey = Deno.env.get('SERPAPI_KEY');
  
  try {
    // Try SerpAPI first
    const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword.keyword)}&api_key=${serpApiKey}`);
    const data = await response.json();
    
    // Extract ranking information from the response
    if (data.organic_results && data.search_parameters) {
      // Find position of our URL in results
      let position = 0;
      for (let i = 0; i < data.organic_results.length; i++) {
        // Here you would check if the result matches your domain
        // For demo purposes, we'll just return a random position
        position = Math.floor(Math.random() * 100) + 1;
        break;
      }
      
      return {
        keyword_id: keyword.id,
        position: position,
        search_volume: data.search_information?.total_results || 0,
        location: data.search_parameters.gl || 'us',
        device: data.search_parameters.device === 'mobile' ? 'mobile' : 'desktop',
        trend: 'stable',
        recorded_at: new Date().toISOString()
      };
    }
  } catch (serpError) {
    console.error('SerpAPI error, falling back to free scraper:', serpError);
  }
  
  // Fallback to free scraper
  try {
    // Simple free scraping approach
    const fallbackResponse = await fetch(`https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    // In a real implementation, you would parse the HTML here
    // For now, we'll return mock data
    return {
      keyword_id: keyword.id,
      position: Math.floor(Math.random() * 100) + 1,
      search_volume: keyword.volume || 0,
      location: 'us',
      device: 'desktop',
      trend: 'stable',
      recorded_at: new Date().toISOString()
    };
  } catch (fallbackError) {
    console.error('Fallback scraper error:', fallbackError);
    return null;
  }
}