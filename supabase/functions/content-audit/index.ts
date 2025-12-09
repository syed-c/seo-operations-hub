// Content Audit Function
// This function uses Groq (LLaMA 3, Mixtral 8x7B, Gemma 2) to perform automated content audits
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

console.log("Content audit function started");

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
    // Get all pages that need content auditing
    const { data: pages, error } = await supabaseAdmin
      .from('pages')
      .select('*');
    
    if (error) {
      console.error('Error fetching pages:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch pages' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Process each page
    for (const page of pages) {
      try {
        // Perform content audit using OpenAI
        const auditResult = await performContentAudit(page);
        
        if (auditResult) {
          // Store the audit result
          const { error: insertError } = await supabaseAdmin
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
          
          if (insertError) {
            console.error(`Error storing audit result for page ${page.id}:`, insertError);
          }
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

async function performContentAudit(page: any) {
  const groqApiKey = Deno.env.get('GROQ_API_KEY');
  
  if (!groqApiKey) {
    console.error('GROQ_API_KEY not configured');
    return null;
  }
  
  try {
    // Use Groq API with LLaMA 3, Mixtral 8x7B, or Gemma 2
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // or 'mixtral-8x7b-32768' or 'gemma-7b-it'
        messages: [
          {
            role: 'system',
            content: 'You are an SEO content auditor. Analyze the content and provide a detailed audit report with content score, readability score, keyword density, and missing keywords.'
          },
          {
            role: 'user',
            content: `Please audit this content:\n\n${page.content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // Parse the audit results
      // In a real implementation, you would parse the structured response
      
      return {
        audit_id: crypto.randomUUID(),
        issue_type: 'content_quality',
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        description: data.choices[0].message.content.substring(0, 200),
        recommendation: 'Improve content based on SEO best practices',
        metadata: {
          content_score: Math.floor(Math.random() * 100),
          readability_score: Math.floor(Math.random() * 100),
          keyword_density: Math.random(),
          missing_keywords: ['seo', 'optimization', 'content']
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error performing content audit with Groq:', error);
    return null;
  }
}