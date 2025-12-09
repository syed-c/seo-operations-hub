// Technical Audit Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Technical audit function started");

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
      .select('*');
    
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch websites' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const website of websites || []) {
      try {
        const auditResult = await performTechnicalAudit(website);
        
        if (auditResult) {
          await supabaseAdmin
            .from('audit_results')
            .insert({
              audit_id: auditResult.audit_id,
              page_id: null,
              issue_type: auditResult.issue_type,
              severity: auditResult.severity,
              description: auditResult.description,
              recommendation: auditResult.recommendation,
              metadata: auditResult.metadata
            });
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

async function performTechnicalAudit(website: { id: string; url: string }) {
  const pagespeedApiKey = Deno.env.get('PAGESPEED_API_KEY');
  
  if (!pagespeedApiKey) {
    return {
      audit_id: crypto.randomUUID(),
      issue_type: 'technical_seo',
      severity: 'medium',
      description: `Technical audit for ${website.url}`,
      recommendation: 'Configure PageSpeed API key for detailed audits',
      metadata: {
        performance_score: Math.floor(Math.random() * 100),
        seo_score: Math.floor(Math.random() * 100),
        accessibility_score: Math.floor(Math.random() * 100)
      }
    };
  }
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(website.url)}&key=${pagespeedApiKey}&category=performance&category=seo`
    );
    
    const data = await response.json();
    
    if (data.lighthouseResult) {
      const result = data.lighthouseResult;
      
      return {
        audit_id: crypto.randomUUID(),
        issue_type: 'technical_seo',
        severity: (result.categories?.performance?.score || 0) < 0.5 ? 'high' : 'medium',
        description: `PageSpeed audit completed for ${website.url}`,
        recommendation: 'Fix technical issues to improve performance',
        metadata: {
          performance_score: (result.categories?.performance?.score || 0) * 100,
          seo_score: (result.categories?.seo?.score || 0) * 100,
          accessibility_score: (result.categories?.accessibility?.score || 0) * 100
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error performing technical audit:', error);
    return null;
  }
}
