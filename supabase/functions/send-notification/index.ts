// Supabase Edge Function for sending multi-channel notifications
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Send notification function started");

Deno.serve(async (req: Request) => {
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

  // Get the request data
  const { notification_id, event_type, data } = await req.json();

  try {
    // Get the notification details
    const { data: notification, error: notificationError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (notificationError) {
      throw new Error(`Error fetching notification: ${notificationError.message}`);
    }

    // Get user's notification channels
    const { data: channels, error: channelsError } = await supabaseAdmin
      .from('notification_channels')
      .select('*')
      .eq('user_id', notification.user_id)
      .eq('is_enabled', true);

    if (channelsError) {
      throw new Error(`Error fetching channels: ${channelsError.message}`);
    }

    if (!channels || channels.length === 0) {
      throw new Error('No enabled notification channels found for user');
    }

    // Get notification template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .eq('event_type', event_type)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (templateError) {
      throw new Error(`Error fetching template: ${templateError.message}`);
    }

    // Process each channel
    const results = [];
    for (const channel of channels) {
      try {
        let success = false;
        let errorMessage: string | null = null;

        // Replace template variables with actual data
        const subject = template?.subject ? replaceTemplateVariables(template.subject, data) : '';
        const content = template?.content ? replaceTemplateVariables(template.content, data) : '';

        switch (channel.channel_type) {
          case 'email':
            success = await sendEmail(channel.channel_identifier, subject, content, data);
            break;
          case 'slack':
            success = await sendSlackMessage(channel.channel_identifier, content, data);
            break;
          case 'whatsapp':
            success = await sendWhatsAppMessage(channel.channel_identifier, content, data);
            break;
          case 'in_app':
            success = true;
            break;
          default:
            errorMessage = `Unsupported channel type: ${channel.channel_type}`;
        }

        // Record the notification event
        await supabaseAdmin
          .from('notification_events')
          .insert({
            notification_id: notification.id,
            channel_type: channel.channel_type,
            channel_identifier: channel.channel_identifier,
            status: success ? 'sent' : 'failed',
            error_message: errorMessage,
            sent_at: success ? new Date().toISOString() : null
          });

        results.push({
          channel: channel.channel_type,
          success,
          error: errorMessage
        });
      } catch (channelError: unknown) {
        const message = channelError instanceof Error ? channelError.message : 'Unknown error';
        console.error(`Error processing channel ${channel.channel_type}:`, channelError);
        
        await supabaseAdmin
          .from('notification_events')
          .insert({
            notification_id: notification.id,
            channel_type: channel.channel_type,
            channel_identifier: channel.channel_identifier,
            status: 'failed',
            error_message: message,
            sent_at: null
          });

        results.push({
          channel: channel.channel_type,
          success: false,
          error: message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Notification processing completed',
        results
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-notification function:', error);
    
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function replaceTemplateVariables(template: string, data: Record<string, unknown>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  return result;
}

async function sendEmail(_to: string, _subject: string, _content: string, _data: Record<string, unknown>): Promise<boolean> {
  console.log(`Sending email to ${_to}`);
  return true;
}

async function sendSlackMessage(_webhookUrl: string, _content: string, _data: Record<string, unknown>): Promise<boolean> {
  console.log(`Sending Slack message to ${_webhookUrl}`);
  return true;
}

async function sendWhatsAppMessage(_phoneNumber: string, _content: string, _data: Record<string, unknown>): Promise<boolean> {
  console.log(`Sending WhatsApp message to ${_phoneNumber}`);
  return true;
}
