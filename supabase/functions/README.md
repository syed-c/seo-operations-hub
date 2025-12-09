# Supabase Edge Functions

This directory contains Supabase Edge Functions for securely handling admin operations.

## Functions

### admin-users

Handles secure user management operations that require service role privileges:
- Creating users
- Updating users
- Deleting users

The function uses the Supabase service role key which is only available in the Edge Function environment, never exposed to the client.

## Deployment

To deploy these functions:

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Deploy the functions:
   ```bash
   supabase functions deploy admin-users
   ```

## Security

- Functions are deployed with `verify_jwt = false` to allow authenticated users to call admin functions through our frontend wrapper
- The actual service role key never leaves the Edge Function environment
- All admin operations are performed server-side