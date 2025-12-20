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
export const initGoogleAuth = (projectId: string) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Google OAuth credentials not configured');
  }
  
  // Encode project ID in state parameter
  const state = btoa(JSON.stringify({ projectId }));
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=https://www.googleapis.com/auth/webmasters.readonly&` +
    `access_type=offline&` +
    `prompt=consent&` +
    `state=${state}`;
  
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

// Store Google OAuth tokens (auth only, no account metadata)
export const storeGoogleToken = async (userId: string, tokenData: any) => {
  // Validate inputs
  if (!userId) {
    throw new Error('Missing userId in OAuth callback');
  }
  
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
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,provider'
    });
  
  if (error) {
    console.error('Error storing Google token:', error);
    throw error;
  }
};

// Get stored Google token for user
export const getStoredGoogleToken = async (userId: string) => {
  // Guard against undefined user ID
  if (!userId) {
    console.warn('Skipping Google token fetch - user ID is undefined');
    return null;
  }
  
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

// Store GSC connection state (separate from auth tokens)
export const storeGSCConnectionState = async (
  projectId: string,
  accountEmail: string
) => {
  const { error } = await supabase
    .from('project_integrations')
    .upsert({
      project_id: projectId,
      provider: 'google_search_console',
      is_connected: true,
      account_email: accountEmail,
      connected_at: new Date().toISOString()
    }, {
      onConflict: 'project_id,provider'
    });
  
  if (error) {
    console.error('Error storing GSC connection state:', error);
    throw error;
  }
};

// Get GSC integration state for a project
export const getGSCIntegrationState = async (projectId: string) => {
  const { data, error } = await supabase
    .from('project_integrations')
    .select('*')
    .eq('project_id', projectId)
    .eq('provider', 'google_search_console')
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching GSC integration state:', error);
    return null;
  }
  
  return data;
};

// Get the connected GSC property URL for a project
export const getConnectedGSCProperty = async (projectId: string): Promise<string | null> => {
  const integrationState = await getGSCIntegrationState(projectId);
  return integrationState?.property_url || null;
};

// Check if a project is connected to GSC
export const isProjectConnectedToGSC = async (projectId: string): Promise<boolean> => {
  const integrationState = await getGSCIntegrationState(projectId);
  return !!integrationState?.is_connected;
};

// Get account email associated with GSC integration
export const getGSCAccountEmail = async (projectId: string): Promise<string | null> => {
  const integrationState = await getGSCIntegrationState(projectId);
  return integrationState?.account_email || null;
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
    const errorText = await response.text();
    throw new Error(`Failed to fetch Search Console analytics: ${response.status} ${response.statusText}. ${errorText}`);
  }
  
  const data = await response.json();
  return data as SearchAnalyticsResponse;
};

// Get property-level analytics from GSC API
export const fetchPropertyLevelAnalytics = async (
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) => {
  const query = {
    startDate,
    endDate,
    dimensions: [], // No dimensions for property-level data
    rowLimit: 1000,
  };
  
  return await fetchSearchAnalytics(accessToken, siteUrl, query);
};

// Get page-level analytics from GSC API
export const fetchPageLevelAnalytics = async (
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) => {
  const query = {
    startDate,
    endDate,
    dimensions: ['date', 'page'],
    rowLimit: 1000,
  };
  
  return await fetchSearchAnalytics(accessToken, siteUrl, query);
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

// Store Search Console property-level data in Supabase
export const storePropertySearchConsoleData = async (
  projectId: string,
  analyticsData: SearchAnalyticsResponse,
  startDate: string,
  endDate: string
) => {
  // For property-level data, we aggregate all rows into a single entry per date
  // But since we're fetching a date range, we should create one aggregated row for the entire period
  
  // Calculate aggregated values
  const totalClicks = analyticsData.rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = analyticsData.rows.reduce((sum, row) => sum + row.impressions, 0);
  const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  
  // Calculate weighted average position
  let totalPosition = 0;
  let totalWeight = 0;
  analyticsData.rows.forEach(row => {
    if (row.position !== null) {
      totalPosition += row.position * row.impressions;
      totalWeight += row.impressions;
    }
  });
  const avgPosition = totalWeight > 0 ? totalPosition / totalWeight : 0;
  
  // Use endDate as the date for this aggregated data
  const date = endDate;
  
  const rowData = {
    project_id: projectId,
    clicks: totalClicks,
    impressions: totalImpressions,
    ctr: avgCtr,
    avg_position: avgPosition,
    date: date,
  };
  
  // Use upsert to avoid duplicates
  const { error: upsertError } = await supabase
    .from('gsc_property_metrics')
    .upsert([rowData], {
      onConflict: 'project_id,date'
    });
  
  if (upsertError) {
    console.error('Error storing Search Console property data:', upsertError);
    throw upsertError;
  }
};

// Store Search Console page-level data in Supabase
export const storePageSearchConsoleData = async (
  projectId: string,
  analyticsData: SearchAnalyticsResponse,
  queryDimensions: string[]
) => {
  // Parse dimensions for each row
  const parsedRows = analyticsData.rows
    .map(row => {
      let pageUrl = null;
      let date = null;
      
      // Map the keys based on dimensions order
      queryDimensions.forEach((dim, index) => {
        if (dim === 'page') {
          pageUrl = row.keys[index] || null;
        } else if (dim === 'date') {
          date = row.keys[index] || null;
        }
      });
      
      return {
        project_id: projectId,
        page_url: pageUrl,
        clicks: row.clicks,
        impressions: row.impressions,
        avg_position: row.position,
        date: date, // Use actual date from GSC
      };
    })
    .filter(row => {
      // Filter out rows with null values for unique constraint fields
      if (row.date === null || row.page_url === null) {
        return false;
      }
      return true;
    });
  
  // Calculate CTR for all entries
  const rowsToInsert = parsedRows.map(item => ({
    ...item,
    ctr: item.impressions > 0 ? item.clicks / item.impressions : 0
  }));
  
  // Use upsert to avoid duplicates
  // Filter out any rows that might still have null values for unique constraint fields
  const validRowsToInsert = rowsToInsert.filter(
    row => row.project_id !== null && row.date !== null && row.page_url !== null
  );
  
  if (validRowsToInsert.length > 0) {
    const { error: upsertError } = await supabase
      .from('gsc_metrics')
      .upsert(validRowsToInsert, {
        onConflict: 'project_id, date, page_url'
      });
    
    if (upsertError) {
      console.error('Error storing Search Console page data:', upsertError);
      throw upsertError;
    }
  } else if (rowsToInsert.length > 0) {
    console.warn('Filtered out all rows due to null values in unique constraint fields');
  }
};

// Combined function to fetch and store both property and page data
export const fetchAndStoreSearchConsoleData = async (
  accessToken: string,
  siteUrl: string,
  projectId: string,
  accountEmail: string
) => {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = '2023-01-01';
    
    // Fetch property-level data (no dimensions)
    const propertyQuery = {
      startDate,
      endDate,
      dimensions: [], // No dimensions for property-level data
      rowLimit: 1000,
    };
    
    const propertyData = await fetchSearchAnalytics(accessToken, siteUrl, propertyQuery);
    await storePropertySearchConsoleData(projectId, propertyData, startDate, endDate);
    
    // Fetch page-level data (with date and page dimensions)
    const pageQuery = {
      startDate,
      endDate,
      dimensions: ['date', 'page'],
      rowLimit: 1000,
    };
    
    const pageData = await fetchSearchAnalytics(accessToken, siteUrl, pageQuery);
    await storePageSearchConsoleData(projectId, pageData, pageQuery.dimensions);
    
    // Update the integration state with the account email
    await storeGSCConnectionState(projectId, accountEmail);
    
    // Update the project integration with the property URL
    const { error: updateError } = await supabase
      .from('project_integrations')
      .update({
        property_url: siteUrl
      })
      .eq('project_id', projectId)
      .eq('provider', 'google_search_console');
    
    if (updateError) {
      console.error('Error updating project integration with property URL:', updateError);
      throw updateError;
    }
    
    return { propertyData, pageData };
  } catch (error) {
    console.error('Error fetching and storing Search Console data:', error);
    throw error;
  }
};

// Update the last synced timestamp for a project
export const updateLastSyncedTimestamp = async (projectId: string) => {
  const { error } = await supabase
    .from('project_integrations')
    .update({
      last_synced_at: new Date().toISOString()
    })
    .eq('project_id', projectId)
    .eq('provider', 'google_search_console');
  
  if (error) {
    console.error('Error updating last synced timestamp:', error);
    throw error;
  }
};

// Disconnect GSC integration for a project
export const disconnectGSCIntegration = async (projectId: string) => {
  const { error } = await supabase
    .from('project_integrations')
    .update({
      is_connected: false,
      connected_at: null,
      property_url: null
    })
    .eq('project_id', projectId)
    .eq('provider', 'google_search_console');
  
  if (error) {
    console.error('Error disconnecting GSC integration:', error);
    throw error;
  }
};

// Get last synced timestamp for GSC integration
export const getLastSyncedTimestamp = async (projectId: string): Promise<string | null> => {
  const integrationState = await getGSCIntegrationState(projectId);
  return integrationState?.last_synced_at || null;
};
