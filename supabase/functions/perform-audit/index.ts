import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { fetchWithTimeout, parseSitemap, extractPageContent } from "../_shared/scraping-utils.ts";
import { calculateScores } from "../_shared/audit-logic.ts";
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

        const { project_id, url } = await req.json();

        if (!project_id || !url) {
            throw new Error("Missing project_id or url");
        }

        console.log(`Starting audit for ${url}`);

        // 1. Fetch Sitemap to get URLs
        let urls: string[] = [];
        try {
            const sitemapUrl = url.endsWith('/') ? `${url}sitemap.xml` : `${url}/sitemap.xml`;
            const sitemapRes = await fetchWithTimeout(sitemapUrl);
            if (sitemapRes.ok) {
                const xml = await sitemapRes.text();
                urls = await parseSitemap(xml);
                console.log(`Found ${urls.length} URLs in sitemap`);
            } else {
                console.warn(`Sitemap not found at ${sitemapUrl}`);
                urls = [url]; // Fallback to homepage
            }
        } catch (err) {
            console.error("Sitemap fetch error:", err);
            urls = [url];
        }

        // Limit to 20 pages for Edge Function limits (can increase if using queues)
        const pagesToAudit = urls.slice(0, 20);

        const ai = new AIClient('groq');

        // 2. Process Pages in Parallel (chunks of 5)
        for (let i = 0; i < pagesToAudit.length; i += 5) {
            const chunk = pagesToAudit.slice(i, i + 5);
            await Promise.all(chunk.map(async (pageUrl) => {
                try {
                    const htmlRes = await fetchWithTimeout(pageUrl);
                    if (!htmlRes.ok) return;
                    const html = await htmlRes.text();

                    const data = extractPageContent(html);
                    if (!data) return;

                    const scores = calculateScores(data);

                    // AI Analysis for this page
                    const aiAnalysis = await ai.generateJSON(
                        `Analyze this page metadata for SEO issues in JSON format: { "critique": "...", "recommendations": ["..."] }
                    Title: ${data.title}
                    Description: ${data.description}
                    H1: ${data.h1}
                    Word Count: ${data.wordCount}`,
                        'llama3-8b-8192'
                    );

                    // Upsert to Database
                    // Note: Assuming 'pages' table exists as per n8n workflow intuition.
                    // We'll upsert based on url + project_id
                    await supabaseClient.from('pages').upsert({
                        project_id,
                        url: pageUrl,
                        title: data.title,
                        meta_description: data.description,
                        h1: data.h1,
                        word_count: data.wordCount,
                        technical_score: scores.technical_score,
                        content_score: scores.content_score,
                        seo_score: scores.seo_score,
                        ai_analysis: aiAnalysis,
                        on_page_data: data,
                        last_audited: new Date().toISOString()
                    }, { onConflict: 'project_id, url' });

                } catch (err) {
                    console.error(`Failed to audit ${pageUrl}:`, err);
                }
            }));
        }

        // 3. Trigger Report Generation upon completion
        const functionsUrl = `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1`;
        fetch(`${functionsUrl}/generate-report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ project_id })
        }).catch(err => console.error("Failed to trigger report generation:", err));

        return new Response(
            JSON.stringify({ success: true, processed: pagesToAudit.length }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
