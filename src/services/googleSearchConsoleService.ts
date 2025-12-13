import { supabase } from '@/lib/supabaseClient';

// Types for Google Search Console data
interface SearchAnalyticsQuery {
  startDate: string;
  endDate: string;
  dimensions: string[];
  rowLimit?: number;
  startRow?: number;
}

interface SearchAnalyticsResponse {
  rows: {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  responseAggregationType: string;
}

interface SiteUrl {
  siteUrl: string;
  permissionLevel: string;
}

// Google OAuth functions
export const initGoogleAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=https://www.googleapis.com/auth/webmasters.readonly&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  window.location.href = authUrl;
};

// Exchange authorization code for access token
export const exchangeCodeForToken = async (code: string) => {
  const response = await fetch('/api/auth/google/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }
  
  return await response.json();
};

// Store Google token for user
export const storeGoogleToken = async (userId: string, tokenData: any) => {
  const { error } = await supabase
    .from('user_tokens')
    .upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000),
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });
  
  if (error) {
    console.error('Error storing Google token:', error);
    throw error;
  }
};

// Get stored Google token for user
export const getStoredGoogleToken = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching Google token:', error);
    return null;
  }
  
  return data;
};

// Refresh Google access token
export const refreshGoogleToken = async (refreshToken: string) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }
  
  return await response.json();
};

// Fetch list of sites from Google Search Console
export const fetchSearchConsoleSites = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch Search Console sites');
  }
  
  const data = await response.json();
  return data.siteEntry as SiteUrl[];
};

// Fetch search analytics data from Google Search Console
export const fetchSearchAnalytics = async (
  accessToken: string,
  siteUrl: string,
  query: SearchAnalyticsQuery
) => {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Search Console analytics');
  }
  
  const data = await response.json();
  return data as SearchAnalyticsResponse;
};

// Check if a site is verified in Google Search Console
export const isSiteVerified = async (accessToken: string, siteUrl: string) => {
  try {
    const sites = await fetchSearchConsoleSites(accessToken);
    return sites.some(site => site.siteUrl === siteUrl);
  } catch (error) {
    console.error('Error checking site verification:', error);
    return false;
  }
};

// Store Search Console data in Supabase
export const storeSearchConsoleData = async (
  projectId: string,
  analyticsData: SearchAnalyticsResponse
) => {
  const rowsToInsert = analyticsData.rows.map(row => ({
    project_id: projectId,
    page_url: row.keys[0] || null,
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    avg_position: row.position,
    date: new Date().toISOString().split('T')[0], // Today's date
  }));
  
  const { error } = await supabase
    .from('gsc_metrics')
    .insert(rowsToInsert);
  
  if (error) {
    console.error('Error storing Search Console data:', error);
    throw error;
  }
};