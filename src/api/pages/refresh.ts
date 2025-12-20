import { supabase } from '@/lib/supabaseClient';

export async function refreshPages(projectId: string) {
  try {
    // Fetch the project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, client')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Failed to fetch project: ${projectError.message}`);
    }

    // Fetch the website URL for this project
    const { data: websites, error: websiteError } = await supabase
      .from('websites')
      .select('url')
      .eq('project_id', projectId)
      .limit(1);

    if (websiteError) {
      throw new Error(`Failed to fetch website: ${websiteError.message}`);
    }

    const websiteUrl = websites && websites.length > 0 ? websites[0].url : '';

    // Prepare the webhook payload
    const payload = {
      project_id: project.id,
      project_name: project.name,
      website: websiteUrl
    };

    // Get the webhook URL from environment variables
    const webhookUrl = import.meta.env.VITE_PAGES_REFRESH_WEBHOOK_URL;

    if (!webhookUrl) {
      throw new Error('VITE_PAGES_REFRESH_WEBHOOK_URL is not configured');
    }

    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed with status ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error refreshing pages:', error);
    throw error;
  }
}