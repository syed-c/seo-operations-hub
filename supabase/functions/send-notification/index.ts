// Supabase Edge Function for sending multi-channel notifications
import { serve } from "std/http/server.ts";
import { createClient } from '@supabase/supabase-js';

// Import libraries for different notification channels
// Note: In a real implementation, you would need to add these dependencies to your project
// For this example, we'll simulate the functionality

console.log("Send notification function started");

serve(async (req) => {
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
        let errorMessage = null;

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
            // In-app notifications are already stored in the notifications table
            success = true;
            break;
          default:
            errorMessage = `Unsupported channel type: ${channel.channel_type}`;
        }

        // Record the notification event
        const { error: eventError } = await supabaseAdmin
          .from('notification_events')
          .insert({
            notification_id: notification.id,
            channel_type: channel.channel_type,
            channel_identifier: channel.channel_identifier,
            status: success ? 'sent' : 'failed',
            error_message: errorMessage,
            sent_at: success ? new Date().toISOString() : null
          });

        if (eventError) {
          console.error(`Error recording notification event: ${eventError.message}`);
        }

        results.push({
          channel: channel.channel_type,
          success,
          error: errorMessage
        });
      } catch (channelError: any) {
        console.error(`Error processing channel ${channel.channel_type}:`, channelError);
        
        // Record the failed notification event
        const { error: eventError } = await supabaseAdmin
          .from('notification_events')
          .insert({
            notification_id: notification.id,
            channel_type: channel.channel_type,
            channel_identifier: channel.channel_identifier,
            status: 'failed',
            error_message: channelError.message,
            sent_at: null
          });

        if (eventError) {
          console.error(`Error recording notification event: ${eventError.message}`);
        }

        results.push({
          channel: channel.channel_type,
          success: false,
          error: channelError.message
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
  } catch (error) {
    console.error('Error in send-notification function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Helper function to replace template variables
function replaceTemplateVariables(template: string, data: any): string {
  let result = template;
  
  // Replace common variables
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value));
  }
  
  return result;
}

// Simulated email sending function
async function sendEmail(to: string, subject: string, content: string, data: any): Promise<boolean> {
  console.log(`Sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content: ${content}`);
  console.log(`Data:`, data);
  
  // In a real implementation, you would integrate with an email service like Resend
  // Example with Resend:
  /*
  const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
  
  const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: to,
    subject: subject,
    html: content,
  });
  
  if (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
  */
  
  // Simulate success
  return true;
}

// Simulated Slack message sending function
async function sendSlackMessage(webhookUrl: string, content: string, data: any): Promise<boolean> {
  console.log(`Sending Slack message to ${webhookUrl}`);
  console.log(`Content: ${content}`);
  console.log(`Data:`, data);
  
  // In a real implementation, you would send a POST request to the Slack webhook
  /*
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
      attachments: [
        {
          color: 'good',
          fields: Object.entries(data).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          }))
        }
      ]
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Slack message sending failed: ${response.statusText}`);
  }
  */
  
  // Simulate success
  return true;
}

// Simulated WhatsApp message sending function
async function sendWhatsAppMessage(phoneNumber: string, content: string, data: any): Promise<boolean> {
  console.log(`Sending WhatsApp message to ${phoneNumber}`);
  console.log(`Content: ${content}`);
  console.log(`Data:`, data);
  
  // In a real implementation, you would integrate with Twilio
  /*
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const client = twilio(accountSid, authToken);
  
  const message = await client.messages.create({
    body: content,
    from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
    to: `whatsapp:${phoneNumber}`
  });
  
  if (!message.sid) {
    throw new Error('WhatsApp message sending failed');
  }
  */
  
  // Simulate success
  return true;
}