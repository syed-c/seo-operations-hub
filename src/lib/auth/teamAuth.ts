import { supabase } from '@/lib/supabaseClient';
import { hashPassword, comparePassword } from './password';

/**
 * Team login function
 * Authenticates a user against the users table and user_credentials table
 * @param email User's email
 * @param password User's password
 * @returns Object with success status and user data or error message
 */
export async function teamLogin(email: string, password: string) {
  try {
    // 1. Fetch user by email from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // 2. Check if user_credentials exists for this user
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('password_hash, last_login_at')
      .eq('user_id', user.id)
      .single();

    if (credError || !credentials) {
      return { success: false, error: 'Password not set for this account' };
    }

    // 3. Compare password with hash
    const isPasswordValid = await comparePassword(password, credentials.password_hash);
    
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // 4. Update last_login_at on successful login
    const { error: updateError } = await supabase
      .from('user_credentials')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (updateError) {
      console.warn('Failed to update last login time:', updateError);
      // Don't fail the login just because we couldn't update the timestamp
    }

    // 5. Return success with user data
    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Team login error:', error);
    return { success: false, error: 'An unexpected error occurred during login' };
  }
}

/**
 * Set or update password for a user
 * @param userId The user's ID
 * @param password The new password
 * @returns Object with success status and optional error message
 */
export async function setUserPassword(userId: string, password: string) {
  try {
    // Validate password length
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Check if credentials already exist for this user
    const { data: existingCredentials } = await supabase
      .from('user_credentials')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existingCredentials) {
      // Update existing credentials
      const { error } = await supabase
        .from('user_credentials')
        .update({ 
          password_hash: passwordHash,
          password_set_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user credentials:', error);
        return { success: false, error: 'Failed to update password' };
      }
    } else {
      // Insert new credentials
      const { error } = await supabase
        .from('user_credentials')
        .insert({
          user_id: userId,
          password_hash: passwordHash
        });

      if (error) {
        console.error('Error inserting user credentials:', error);
        return { success: false, error: 'Failed to set password' };
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Set user password error:', error);
    return { success: false, error: 'An unexpected error occurred while setting password' };
  }
}

/**
 * Check if a user has a password set
 * @param userId The user's ID
 * @returns Boolean indicating if password is set
 */
export async function hasPassword(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_credentials')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking password status:', error);
    return false;
  }
}