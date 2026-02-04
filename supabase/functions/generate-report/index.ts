import { createClient } from "@supabase/supabase-js";
import { AIClient } from "../_shared/ai-client.ts";
import { serveWithNotification } from "../_shared/wrapper.ts";
import { jobManager } from "../_shared/job-manager.ts";

serveWithNotification('generate-report', async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('VITE_SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { project_id, job_id } = body;

    if (!project_id) {
        throw new Error("Missing project_id");
    }

    if (job_id) await jobManager.log(job_id, 'generate-report', 'info', `Generating report for project ${project_id}`);

    // 1. Fetch Project & Pages data
    const { data: project } = await supabaseClient.from('projects').select('*').eq('id', project_id).single();
    const { data: pages } = await supabaseClient.from('pages').select('*').eq('project_id', project_id);

    if (!project || !pages || pages.length === 0) {
        if (job_id) await jobManager.log(job_id, 'generate-report', 'warn', "No pages found for report generation");
        throw new Error("No data found for report generation");
    }

    // 2. Aggregate Data
    const avgSeoScore = Math.round(pages.reduce((a: number, b: any) => a + (b.seo_score || 0), 0) / pages.length);
    const lowScoringPages = pages.filter((p: any) => (p.seo_score || 0) < 60).map((p: any) => p.url);

    // 3. Generate AI Report
    const ai = new AIClient('groq');
    const prompt = `
    Generate a Weekly SEO Audit Report (HTML format).
    Project: ${project.name} (${project.client})
    Total Pages Audited: ${pages.length}
    Average SEO Score: ${avgSeoScore}/100
    
    Issues found on: ${lowScoringPages.join(', ')}

    Structure the report with Executive Summary, Technical Analysis, and 3-5 Actionable Recommendations.
    Return ONLY valid HTML inside a div.
`;

    try {
        const reportHtml = await ai.generate(prompt, undefined, "You are a senior SEO consultant.");

        // 4. Save Report
        const { error: saveError } = await supabaseClient
            .from('reports')
            .insert({
                project_id,
                report_type: 'Weekly Audit',
                title: `Weekly Audit - ${new Date().toLocaleDateString()}`,
                content: {
                    html: reportHtml,
                    metrics: { avgSeoScore, pagesAudited: pages.length }
                }
            });

        if (saveError) throw saveError;
        if (job_id) await jobManager.log(job_id, 'generate-report', 'info', "Report successfully generated and saved.");

        return { success: true, status: "completed" };

    } catch (err) {
        if (job_id) await jobManager.log(job_id, 'generate-report', 'error', `Report generation failed: ${err.message}`);
        throw err;
    }
});


