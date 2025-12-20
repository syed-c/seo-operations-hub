// src/api/auth/google/callback.ts
import { supabase } from '@/lib/supabaseClient';
import { storeGoogleToken } from '@/services/googleSearchConsoleService';

export async function handleGoogleCallback(code: string, userId: string) {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('Missing userId in OAuth callback');
    }
    
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    // Store token in database
    await storeGoogleToken(userId, tokenData);
    
    return { success: true, tokenData };
  } catch (error) {
    console.error('Error handling Google callback:', error);
    return { success: false, error: error.message };
  }
}