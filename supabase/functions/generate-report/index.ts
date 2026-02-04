import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { AIClient } from "../_shared/ai-client.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('VITE_SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { project_id } = await req.json();

        if (!project_id) {
            throw new Error("Missing project_id");
        }

        // 1. Fetch Project & Pages data
        const { data: project } = await supabaseClient.from('projects').select('*').eq('id', project_id).single();
        const { data: pages } = await supabaseClient.from('pages').select('*').eq('project_id', project_id);

        if (!project || !pages || pages.length === 0) {
            throw new Error("No data found for report generation");
        }

        // 2. Fetch External Data (Mocked here, but structure ready for RapidAPI)
        // Real implementation would use fetch() to RapidAPI endpoints using Deno.env.get('RAPIDAPI_KEY')
        const externalMetrics = {
            domain_authority: Math.floor(Math.random() * 50) + 10, // Placeholder
            backlinks: Math.floor(Math.random() * 1000) + 50
        };

        // 3. Aggregate Data
        const avgSeoScore = Math.round(pages.reduce((a, b) => a + (b.seo_score || 0), 0) / pages.length);
        const lowScoringPages = pages.filter(p => (p.seo_score || 0) < 60).map(p => p.url);

        // 4. Generate AI Report
        const ai = new AIClient('groq');
        const prompt = `
        Generate a Weekly SEO Audit Report (HTML format).
        Project: ${project.name} (${project.client})
        Total Pages Audited: ${pages.length}
        Average SEO Score: ${avgSeoScore}/100
        Domain Authority: ${externalMetrics.domain_authority}
        Backlinks: ${externalMetrics.backlinks}
        
        Issues found on: ${lowScoringPages.join(', ')}

        Structure the report with Executive Summary, Technical Analysis, and 3-5 Actionable Recommendations.
        Return ONLY valid HTML inside a div.
    `;

        const reportHtml = await ai.generate(prompt, undefined, "You are a senior SEO consultant.");

        // 5. Save Report
        const { error: saveError } = await supabaseClient
            .from('reports')
            .insert({
                project_id,
                report_type: 'Weekly Audit',
                title: `Weekly Audit - ${new Date().toLocaleDateString()}`,
                content: {
                    html: reportHtml,
                    metrics: { ...externalMetrics, avgSeoScore, pagesAudited: pages.length }
                }
            });

        if (saveError) throw saveError;

        return new Response(
            JSON.stringify({ success: true, report_id: 'created' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
