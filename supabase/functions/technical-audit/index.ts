// Technical SEO Audit Function
// This function performs technical SEO audits using PageSpeed Insights API (free)
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("Technical audit function started");

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
    // Get all websites that need technical auditing
    const { data: websites, error } = await supabaseAdmin
      .from('websites')
      .select('*');
    
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
        // Perform technical audit using Lighthouse or PageSpeed Insights
        const auditResult = await performTechnicalAudit(website);
        
        if (auditResult) {
          // Store the audit result
          const { error: insertError } = await supabaseAdmin
            .from('audit_results')
            .insert({
              audit_id: auditResult.audit_id,
              page_id: null, // This is a website-level audit
              issue_type: auditResult.issue_type,
              severity: auditResult.severity,
              description: auditResult.description,
              recommendation: auditResult.recommendation,
              metadata: auditResult.metadata
            });
          
          if (insertError) {
            console.error(`Error storing audit result for website ${website.id}:`, insertError);
          }
          
          // Update the website with technical audit timestamp
          const { error: updateError } = await supabaseAdmin
            .from('websites')
            .update({
              last_technical_audit: new Date().toISOString()
            })
            .eq('id', website.id);
          
          if (updateError) {
            console.error(`Error updating website audit timestamp ${website.id}:`, updateError);
          }
          
          // Update pages with CWV metrics if available
          if (auditResult.metadata.core_web_vitals) {
            const { error: pageUpdateError } = await supabaseAdmin
              .from('pages')
              .update({
                cwv_lcp: auditResult.metadata.core_web_vitals.lcp,
                cwv_cls: auditResult.metadata.core_web_vitals.cls,
                cwv_fid: auditResult.metadata.core_web_vitals.fid,
                performance_score: auditResult.metadata.performance_score,
                seo_score: auditResult.metadata.seo_score,
                accessibility_score: auditResult.metadata.accessibility_score,
                last_audited: new Date().toISOString()
              })
              .eq('website_id', website.id);
            
            if (pageUpdateError) {
              console.error(`Error updating page metrics for website ${website.id}:`, pageUpdateError);
            }
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

async function performTechnicalAudit(website: any) {
  const pagespeedApiKey = Deno.env.get('PAGESPEED_API_KEY');
  
  if (!pagespeedApiKey) {
    console.error('PAGESPEED_API_KEY not configured');
    return null;
  }
  
  try {
    // Use PageSpeed Insights API (free)
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(website.url)}&key=${pagespeedApiKey}&category=performance&category=accessibility&category=seo`
    );
    
    const data = await response.json();
    
    if (data.lighthouseResult) {
      const lighthouseResult = data.lighthouseResult;
      
      // Extract Core Web Vitals
      const lcp = lighthouseResult.audits['largest-contentful-paint']?.numericValue || 0;
      const cls = lighthouseResult.audits['cumulative-layout-shift']?.numericValue || 0;
      const fid = lighthouseResult.audits['first-input-delay']?.numericValue || 0;
      
      // Extract scores
      const performanceScore = lighthouseResult.categories.performance?.score * 100 || 0;
      const seoScore = lighthouseResult.categories.seo?.score * 100 || 0;
      const accessibilityScore = lighthouseResult.categories.accessibility?.score * 100 || 0;
      
      // Update the pages table with CWV metrics
      // This would be done in the main function loop
      
      return {
        audit_id: crypto.randomUUID(),
        issue_type: 'technical_seo',
        severity: performanceScore < 50 ? 'critical' : performanceScore < 80 ? 'high' : 'medium',
        description: `PageSpeed audit completed for ${website.url}`,
        recommendation: 'Fix technical issues to improve site performance',
        metadata: {
          core_web_vitals: {
            lcp: lcp,
            fid: fid,
            cls: cls
          },
          performance_score: performanceScore,
          accessibility_score: accessibilityScore,
          seo_score: seoScore,
          issues: extractIssues(lighthouseResult)
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error performing technical audit with PageSpeed:', error);
    return null;
  }
}

function extractIssues(lighthouseResult: any): string[] {
  const issues: string[] = [];
  
  // Extract common issues from lighthouseResult
  if (lighthouseResult.audits['uses-responsive-images']?.score < 0.5) {
    issues.push('Images are not responsive');
  }
  
  if (lighthouseResult.audits['meta-description']?.score < 0.5) {
    issues.push('Missing meta description');
  }
  
  if (lighthouseResult.audits['image-alt']?.score < 0.5) {
    issues.push('Missing alt attributes on images');
  }
  
  if (lighthouseResult.audits['render-blocking-resources']?.score < 0.5) {
    issues.push('Render-blocking resources detected');
  }
  
  if (lighthouseResult.audits['speed-index']?.score < 0.5) {
    issues.push('Slow loading resources');
  }
  
  return issues;
}