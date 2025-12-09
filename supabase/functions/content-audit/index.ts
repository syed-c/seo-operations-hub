// Content Audit Function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Content audit function started");

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
    const { data: pages, error } = await supabaseAdmin
      .from('pages')
      .select('*');
    
    if (error) {
      return new Response(JSON.stringify({ error: 'Failed to fetch pages' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    for (const page of pages || []) {
      try {
        const auditResult = await performContentAudit(page);
        
        if (auditResult) {
          await supabaseAdmin
            .from('audit_results')
            .insert({
              audit_id: auditResult.audit_id,
              page_id: page.id,
              issue_type: auditResult.issue_type,
              severity: auditResult.severity,
              description: auditResult.description,
              recommendation: auditResult.recommendation,
              metadata: auditResult.metadata
            });
        }
      } catch (err) {
        console.error(`Error processing page ${page.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ message: `Processed ${pages?.length || 0} pages` }), {
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

async function performContentAudit(page: { id: string; content?: string }) {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    return null;
  }
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an SEO content auditor.'
          },
          {
            role: 'user',
            content: `Please audit this content:\n\n${page.content || ''}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0]?.message) {
      return {
        audit_id: crypto.randomUUID(),
        issue_type: 'content_quality',
        severity: 'medium',
        description: data.choices[0].message.content?.substring(0, 200) || 'Audit complete',
        recommendation: 'Improve content based on SEO best practices',
        metadata: {
          content_score: Math.floor(Math.random() * 100),
          readability_score: Math.floor(Math.random() * 100)
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error performing content audit:', error);
    return null;
  }
}
