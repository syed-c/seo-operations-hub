
import { createClient } from "@supabase/supabase-js";
import { AIClient } from "../_shared/ai-client.ts";
import { serveWithNotification } from "../_shared/wrapper.ts";
import { jobManager } from "../_shared/job-manager.ts";

serveWithNotification('process-ai', async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('VITE_SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { project_id, job_id } = body;

    const ai = new AIClient('groq');

    // Fetch pages that need AI analysis
    const { data: pages, error } = await supabaseClient
        .from('pages')
        .select('*')
        .eq('project_id', project_id)
        .eq('ai_status', 'pending')
        .limit(10); // Process in small batches

    if (error) throw error;
    if (!pages || pages.length === 0) {
        return { success: true, message: "No pending AI tasks found." };
    }

    if (job_id) await jobManager.log(job_id, 'process-ai', 'info', `Processing AI for ${pages.length} pages.`);

    for (const page of pages) {
        try {
            await supabaseClient.from('pages').update({ ai_status: 'processing' }).eq('id', page.id);

            const aiAnalysis = await ai.generateJSON(
                `Analyze this page metadata for SEO issues in JSON format: { "critique": "...", "recommendations": ["..."] }
                Title: ${page.title}
                Description: ${page.meta_description}
                H1: ${page.h1}
                Word Count: ${page.word_count}`,
                'llama3-8b-8192'
            );

            await supabaseClient.from('pages').update({
                ai_analysis: aiAnalysis,
                ai_status: 'completed'
            }).eq('id', page.id);

        } catch (err) {
            console.error(`AI Analysis failed for page ${page.url}:`, err);
            await supabaseClient.from('pages').update({ ai_status: 'failed' }).eq('id', page.id);
            if (job_id) await jobManager.log(job_id, 'process-ai', 'error', `AI failure for ${page.url}: ${err.message}`);
        }
    }

    // Check if more pages are pending and trigger self if within limits?
    // For now, keeping it simple.

    return { success: true, processed: pages.length };
});
