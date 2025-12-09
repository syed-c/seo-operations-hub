// Keyword Difficulty Function
// This function calculates keyword difficulty using DIY methods
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("Keyword difficulty function started");

interface KeywordData {
  id: string;
  project_id: string;
  keyword: string;
  intent: string;
  volume: number;
}

interface SearchResult {
  title: string;
  url: string;
  position: number;
}

interface PageMetrics {
  titleLength: number;
  wordCount: number;
  hasTargetKeyword: boolean;
  domainAge: number; // in years
  backlinkCount: number;
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
    // Get all keywords that need difficulty calculation
    const { data: keywords, error } = await supabaseAdmin
      .from('keywords')
      .select('*')
      .is('difficulty_score', null);
    
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
        // Calculate difficulty score
        const difficultyScore = await calculateKeywordDifficulty(keyword);
        
        if (difficultyScore !== null) {
          // Update the keyword with the difficulty score
          const { error: updateError } = await supabaseAdmin
            .from('keywords')
            .update({
              difficulty_score: difficultyScore,
              last_difficulty_check: new Date().toISOString()
            })
            .eq('id', keyword.id);
          
          if (updateError) {
            console.error(`Error updating difficulty for keyword ${keyword.id}:`, updateError);
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

async function calculateKeywordDifficulty(keyword: KeywordData): Promise<number | null> {
  const serpApiKey = Deno.env.get('SERPAPI_KEY');
  
  try {
    // Step 1: Scrape top 10 Google results
    let searchResults: SearchResult[] = [];
    
    if (serpApiKey) {
      // Use SerpAPI if available
      const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(keyword.keyword)}&api_key=${serpApiKey}&num=10`);
      const data = await response.json();
      
      if (data.organic_results) {
        searchResults = data.organic_results.map((result: any, index: number) => ({
          title: result.title,
          url: result.link,
          position: index + 1
        }));
      }
    } else {
      // Fallback to free scraper
      const fallbackResponse = await fetch(`https://www.google.com/search?q=${encodeURIComponent(keyword.keyword)}&num=10`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // In a real implementation, you would parse the HTML here
      // For now, we'll create mock results
      searchResults = Array.from({ length: 10 }, (_, i) => ({
        title: `Result ${i + 1} for ${keyword.keyword}`,
        url: `https://example${i + 1}.com/${keyword.keyword.replace(/\s+/g, '-')}`,
        position: i + 1
      }));
    }
    
    // Step 2: For each result, compute metrics
    let totalDomainAgeScore = 0;
    let totalBacklinkStrength = 0;
    let totalContentDepthScore = 0;
    let totalKeywordOptimizationScore = 0;
    let totalSerpCompetitorDiversity = 0;
    
    for (const result of searchResults) {
      const metrics = await getPageMetrics(result, keyword.keyword);
      
      // Domain age score (newer domains = higher difficulty)
      const domainAgeScore = Math.min(100, metrics.domainAge * 10); // Scale to 0-100
      totalDomainAgeScore += domainAgeScore;
      
      // Backlink strength (more backlinks = higher difficulty)
      const backlinkStrength = Math.min(100, metrics.backlinkCount / 10); // Scale to 0-100
      totalBacklinkStrength += backlinkStrength;
      
      // Content depth (more words = higher quality content)
      const contentDepthScore = Math.min(100, metrics.wordCount / 100); // Scale to 0-100
      totalContentDepthScore += contentDepthScore;
      
      // Keyword optimization (presence of target keyword)
      const keywordOptimizationScore = metrics.hasTargetKeyword ? 100 : 0;
      totalKeywordOptimizationScore += keywordOptimizationScore;
    }
    
    // SERP competitor diversity (variety of domains)
    const uniqueDomains = new Set(searchResults.map(r => new URL(r.url).hostname)).size;
    totalSerpCompetitorDiversity = (uniqueDomains / searchResults.length) * 100;
    
    // Calculate average scores
    const avgDomainAgeScore = totalDomainAgeScore / searchResults.length;
    const avgBacklinkStrength = totalBacklinkStrength / searchResults.length;
    const avgContentDepthScore = totalContentDepthScore / searchResults.length;
    const avgKeywordOptimizationScore = totalKeywordOptimizationScore / searchResults.length;
    
    // Combine into final difficulty score (0-100)
    const difficulty = 
      (avgDomainAgeScore * 0.15) +
      (avgBacklinkStrength * 0.35) +
      (avgContentDepthScore * 0.20) +
      (avgKeywordOptimizationScore * 0.20) +
      (totalSerpCompetitorDiversity * 0.10);
    
    return Math.round(difficulty);
  } catch (error) {
    console.error('Error calculating keyword difficulty:', error);
    return null;
  }
}

async function getPageMetrics(result: SearchResult, targetKeyword: string): Promise<PageMetrics> {
  // In a real implementation, you would:
  // 1. Fetch the page HTML
  // 2. Extract text content
  // 3. Count words
  // 4. Check for target keyword presence
  // 5. Get domain age from WHOIS API
  // 6. Get backlink count from your DIY crawler
  
  // For demo purposes, we'll return mock data
  return {
    titleLength: result.title.length,
    wordCount: Math.floor(Math.random() * 2000) + 500, // 500-2500 words
    hasTargetKeyword: Math.random() > 0.3, // 70% chance of having target keyword
    domainAge: Math.floor(Math.random() * 15) + 1, // 1-15 years
    backlinkCount: Math.floor(Math.random() * 5000) // 0-5000 backlinks
  };
}