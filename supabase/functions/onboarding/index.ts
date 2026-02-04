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

        // 1. Fetch Project Details
        const { data: project, error: projectError } = await supabaseClient
            .from('projects')
            .select('*')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            throw new Error(`Project not found: ${projectError?.message}`);
        }

        // 2. Add initial log
        console.log(`Starting onboarding for project: ${project.name} (${project.client})`);

        // 3. Trigger Audit (Async invoke to avoid timeout if possible, or direct call)
        // For now, we'll just log that we are willing to trigger it. 
        // In a real scenario, we might want to call the perform-audit function via fetch
        // so this function can return quickly.

        const functionsUrl = `${Deno.env.get('VITE_SUPABASE_URL')}/functions/v1`;

        // Trigger Audit
        fetch(`${functionsUrl}/perform-audit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ project_id, url: project.client }) // passing client url as starting point
        }).catch(err => console.error("Failed to trigger audit:", err));

        // 4. Generate Welcome/Onboarding Message with AI
        const ai = new AIClient('groq');
        const welcomePrompt = `
      Project: ${project.name}
      Client URL: ${project.client}
      Description: ${project.description || 'N/A'}
      
      Generate a brief, professional welcome message and a summary of what the SEO onboarding process will involve (e.g., initial crawl, technical audit, keyword analysis).
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

        return new Response(
            JSON.stringify({ success: true, message: "Onboarding started", welcome: welcomeMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
