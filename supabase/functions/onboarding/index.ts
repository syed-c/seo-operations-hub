import { createClient } from "@supabase/supabase-js";
import { AIClient } from "../_shared/ai-client.ts";
import { serveWithNotification } from "../_shared/wrapper.ts";

serveWithNotification('onboarding', async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('VITE_SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { project_id } = await req.json();

    if (!project_id) {
        throw new Error("Missing project_id");
    }

    // 1. Fetch Project Details
    const { data: project, error: projectError } = await supabaseClient
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single();

    if (projectError || !project) {
        throw new Error(`Project not found: ${projectError?.message}`);
    }

    // 1. Log Project Details
    console.log(`Starting onboarding for project: ${project.name} (${project.client})`);

    // 2. Create Job Record
    const { data: job, error: jobError } = await supabaseClient
        .from('jobs')
        .insert({
            project_id,
            type: 'onboarding',
            status: 'queued',
            config: { url: project.client }
        })
        .select()
        .single();

    if (jobError) throw jobError;

    // 3. Initialize Job State
    await supabaseClient.from('job_state').insert({
        job_id: job.id,
        cursor: { urls: [], currentIndex: 0, sitemapFetched: false }
    });

    // 4. Trigger Audit (Async invoke)
    const functionsUrl = `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1`;

    fetch(`${functionsUrl}/perform-audit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_id, url: project.client, job_id: job.id })
    }).catch(err => console.error("Failed to trigger audit:", err));

    // 5. Generate Welcome/Onboarding Message with AI
    const ai = new AIClient('groq');
    const welcomePrompt = `
      Project: ${project.name}
      Client URL: ${project.client}
      Description: ${project.description || 'N/A'}
      
      Generate a brief, professional welcome message and a summary of what the SEO onboarding process will involve.
    `;

    const welcomeMessage = await ai.generate(welcomePrompt, undefined, "You are an SEO onboarding specialist.");

    // 5. Create Onboarding Report Entry
    const { error: reportError } = await supabaseClient
        .from('reports')
        .insert({
            project_id,
            report_type: 'Onboarding',
            title: `Onboarding: ${project.name}`,
            content: {
                message: welcomeMessage,
                status: 'Audit Initiated',
                timestamp: new Date().toISOString()
            }
        });

    if (reportError) throw reportError;

    return { success: true, message: "Onboarding started", welcome: welcomeMessage };
});

