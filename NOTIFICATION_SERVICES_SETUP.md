# Notification Services Setup Guide

This guide explains how to set up the various notification services used in the SEO Operations Hub.

## Required Environment Variables

Add the following environment variables to your Supabase project settings:

### Email Service (Resend)
```
RESEND_API_KEY=your_resend_api_key_here
```

### SMS/WhatsApp Service (Twilio)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_WHATSAPP_NUMBER=your_twilio_whatsapp_number_here
```

### Slack Integration
No specific environment variables are required for Slack. Users will provide their own webhook URLs in the notification settings.

## Setting Up Notification Channels

### 1. Email Setup with Resend

1. Sign up for a Resend account at https://resend.com/
2. Obtain your API key from the Resend dashboard
3. Add the `RESEND_API_KEY` to your Supabase project environment variables
4. Update the Edge Function code to uncomment the Resend integration

### 2. WhatsApp Setup with Twilio

1. Sign up for a Twilio account at https://www.twilio.com/
2. Navigate to the Twilio Console and find your Account SID and Auth Token
3. Add the following environment variables to your Supabase project:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_NUMBER`
4. Update the Edge Function code to uncomment the Twilio integration

### 3. Slack Setup

1. Create a Slack app in your workspace
2. Enable incoming webhooks for your app
3. Copy the webhook URL
4. Users can add this webhook URL in their notification settings

## Testing Notifications

To test the notification system:

1. Ensure all Edge Functions are deployed:
   ```bash
   supabase functions deploy send-notification
   ```

2. Create a test notification in the database:
   ```sql
   INSERT INTO notifications (user_id, title, message)
   VALUES ('USER_ID_HERE', 'Test Notification', 'This is a test notification');
   ```

3. Call the send-notification function:
   ```sql
   SELECT supabase_functions.http_post(
     'http://localhost:5432/functions/v1/send-notification',
     '{"notification_id": "NOTIFICATION_ID_HERE", "event_type": "test_event", "data": {"test": "data"}}',
     '{"Content-Type": "application/json"}'
   );
   ```

## Notification Templates

Default notification templates are automatically inserted during the database migration. You can customize these templates in the `notification_templates` table.

## Troubleshooting

### Common Issues

1. **Environment variables not found**: Ensure all required environment variables are set in your Supabase project settings, not just locally.

2. **Permission denied errors**: Make sure your Edge Functions have the necessary permissions to access the database tables.

3. **API rate limiting**: Be aware of rate limits for external services like Resend and Twilio.

### Logs and Monitoring

Check the Supabase function logs for detailed error messages:
```bash
supabase functions logs send-notification
```