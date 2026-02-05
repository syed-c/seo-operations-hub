import { createClient } from "@supabase/supabase-js";
import { serveWithNotification } from "../_shared/wrapper.ts";
import { corsHeaders } from "../_shared/cors.ts";

serveWithNotification('admin-users', async (req) => {
  console.log('admin-users function invoked, method:', req.method);
  
  // Don't try to parse body for OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received, returning early');
    return { success: true };
  }
  
  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceRoleKey 
    });

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing environment variables');
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the request data
    let body;
    try {
      body = await req.json();
      console.log('Parsed request body:', body);
    } catch (e) {
      console.error('Failed to parse JSON body:', e);
      throw new Error('Invalid JSON body');
    }

    const { action, table, data, filters } = body;
    console.log(`Admin action: ${action} on table: ${table}`, { data, filters });

    if (!action || !table) {
      throw new Error('Missing required fields: action and table');
    }

    let result;

    switch (action) {
      case 'create':
        console.log('Processing create action for table:', table);
        // Check if this is for auth user creation
        if (table === 'auth_user') {
          console.log('Identified as auth user creation request');
          const { email, password, email_confirm, user_metadata } = data;

          const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || undefined, // Only include password if provided
            email_confirm: email_confirm !== false, // Default to true if not specified
            user_metadata: user_metadata || {},
          });

          if (authError) {
            console.error('Auth user creation error:', authError);
            // Check if it's an email exists error
            if (authError.code === 'email_exists') {
              throw new Error('A user with this email already exists');
            } else {
              throw new Error(authError.message || 'Failed to create auth user');
            }
          }

          result = { data: [authResult.user] };
          console.log('Auth user created successfully, ID:', authResult.user.id);

          // Create record in users table with profile information
          const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              id: authResult.user.id,
              email: authResult.user.email,
              first_name: user_metadata?.first_name || null,
              last_name: user_metadata?.last_name || null,
              role: user_metadata?.role || null,
            });

          if (userError) {
            console.error('Error storing user profile:', userError);
            // This is a fatal error, as we need the user profile record
            throw new Error(userError.message || 'Failed to store user profile');
          } else {
            console.log('User profile stored successfully for user:', authResult.user.id);
          }

          // If a password was provided, also insert into user_credentials table
          if (password) {
            // Hash the password before storing
            const { hash } = await import('https://esm.sh/bcrypt-ts@5.0.0');
            const passwordHash = await hash(password, 10); // Use default salt rounds of 10

            // Insert password hash into user_credentials table
            const { error: credentialError } = await supabaseAdmin
              .from('user_credentials')
              .insert({
                user_id: authResult.user.id,
                password_hash: passwordHash
              });

            if (credentialError) {
              console.error('Error storing password credentials:', credentialError);
              // This is not a fatal error, as the user profile is already created
              // We just log it for monitoring
            } else {
              console.log('Password credentials stored successfully for user:', authResult.user.id);
            }
          }
        } else {
          console.log('Processing as regular database insert for table:', table);
          result = await supabaseAdmin.from(table).insert(data).select();
        }
        break;
      case 'update':
        // Check if this is for auth user update (for password changes)
        if (table === 'auth_user' && data.password) {
          console.log('Updating password for auth user with ID:', filters?.id);

          // Hash the new password
          const { hash } = await import('https://esm.sh/bcrypt-ts@5.0.0');
          const passwordHash = await hash(data.password, 10); // Use default salt rounds of 10

          // Update password hash in user_credentials table
          const { error: credentialError } = await supabaseAdmin
            .from('user_credentials')
            .upsert({  // Use upsert to handle both insert and update
              user_id: filters.id,
              password_hash: passwordHash,
              password_set_at: new Date().toISOString()
            });

          if (credentialError) {
            console.error('Error updating password credentials:', credentialError);
            throw new Error(credentialError.message || 'Failed to update password');
          }

          // Return success response
          result = { data: [{ id: filters.id, password_updated: true }] };
        } else {
          let query = supabaseAdmin.from(table).update(data);
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query.select();
        }
        break;
      case 'delete':
        // Check if this is for auth user deletion
        if (table === 'auth_user') {
          console.log('Deleting auth user with ID:', filters?.id);
          if (!filters?.id) {
            throw new Error('User ID is required for auth user deletion');
          }

          const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(filters.id);

          if (authError) {
            console.error('Auth user deletion error:', authError);
            throw new Error(authError.message || 'Failed to delete auth user');
          }

          result = { data: [] };
        } else {
          let query = supabaseAdmin.from(table).delete();
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query;
        }
        break;
      case 'select':
        {
          let query = supabaseAdmin.from(table).select(data?.select || '*');
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as string);
            });
          }
          result = await query;
        }
        break;
      default:
        throw new Error('Invalid action. Use create, update, delete, or select');
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw new Error(result.error.message || 'Database operation failed');
    }

    console.log(`Admin action ${action} successful, returned ${result.data?.length || 0} records`);
    console.log('Result data:', JSON.stringify(result.data));
    // Return plain object for serveWithNotification wrapper to handle
    return { data: result.data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
