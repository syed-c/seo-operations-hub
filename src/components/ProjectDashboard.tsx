import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabaseClient';
import { GoogleSearchConsoleConnect } from '@/components/GoogleSearchConsoleConnect';
import { SearchConsoleAnalytics } from '@/components/SearchConsoleAnalytics';
import {
  getStoredGoogleToken,
  fetchSearchConsoleSites,
  fetchSearchAnalytics,
  storeSearchConsoleData,
  refreshGoogleToken
} from '@/services/googleSearchConsoleService';

export function ProjectDashboard() {
  const { selectedProject } = useProject();
  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkGoogleConnection();
  }, [selectedProject, hasGoogleToken]);

  const checkGoogleConnection = async () => {
    if (!selectedProject) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const token = await getStoredGoogleToken(user.id);
      setHasGoogleToken(!!token);
    } catch (err) {
      console.error('Error checking Google connection:', err);
      setError('Failed to check Google connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchData = async () => {
    if (!selectedProject) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting GSC data fetch process...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('User authenticated:', user.id);

      const token = await getStoredGoogleToken(user.id);
      if (!token) {
        throw new Error('Google account not connected');
      }
      console.log('Google token retrieved');

      // Refresh token if expired
      let accessToken = token.access_token;
      if (new Date(token.expires_at) < new Date()) {
        console.log('Token expired, refreshing...');
        // Token expired, refresh it
        try {
          const refreshedToken = await refreshGoogleToken(token.refresh_token);
          accessToken = refreshedToken.access_token;
          
          // Update the stored token with the new access token and expiration time
          const { error: updateError } = await supabase
            .from('user_tokens')
            .update({
              access_token: refreshedToken.access_token,
              expires_at: new Date(Date.now() + refreshedToken.expires_in * 1000)
            })
            .eq('user_id', user.id)
            .eq('provider', 'google');
            
          if (updateError) throw updateError;
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          throw new Error('Token expired. Please reconnect your Google account.');
        }
      }

      // Fetch sites to verify the project's website is connected
      console.log('Fetching Search Console sites...');
      const sites = await fetchSearchConsoleSites(accessToken);
      console.log('Sites fetched:', sites);
      
      // Check for multiple possible site URL formats
      const possibleSiteUrls = [
        `sc-domain:${selectedProject.client}`,
        `https://${selectedProject.client}`,  
        `https://${selectedProject.client}/`,
        `http://${selectedProject.client}`,
        `http://${selectedProject.client}/`
      ];
      
      // Also check if client might already include protocol
      if (selectedProject.client.startsWith('http')) {
        possibleSiteUrls.push(selectedProject.client);
        possibleSiteUrls.push(`${selectedProject.client}/`);
      }
      
      const matchedSite = sites.find(site => 
        possibleSiteUrls.includes(site.siteUrl)
      );
      console.log('Matched site:', matchedSite);
      console.log('Looking for:', possibleSiteUrls);

      if (!matchedSite) {
        // Log the actual sites for debugging
        console.log('Available sites in Search Console:', sites);
        console.log('Looking for:', possibleSiteUrls);
        throw new Error(`Website ${selectedProject.client} is not verified in Google Search Console. Available sites: ${sites.map(s => s.siteUrl).join(', ')}`);
      }

      // Fetch analytics data
      const query = {
        startDate: '2023-01-01',
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date', 'page'],
        rowLimit: 1000,
      };
      console.log('Fetching analytics data with query:', query);

      const data = await fetchSearchAnalytics(accessToken, matchedSite.siteUrl, query);
      console.log('Analytics data fetched:', data?.rows?.length || 0, 'rows');
      
      // Store data in Supabase
      console.log('Storing data in Supabase...');
      await storeSearchConsoleData(selectedProject.id, data, query.dimensions);
      console.log('Data stored successfully');
      
      // Refresh the UI
      window.location.reload();
    } catch (err) {
      console.error('Error in handleFetchData:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      setError(err instanceof Error ? err.message : 'Failed to fetch Search Console data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project Dashboard</CardTitle>
          <CardDescription>Please select a project to view dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Select a project from the dropdown to view its dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{selectedProject.name} Dashboard</h1>
          <p className="text-muted-foreground">
            View and analyze your project's performance
          </p>
        </div>
        
        {hasGoogleToken && (
          <Button 
            onClick={handleFetchData} 
            disabled={isLoading}
          >
            {isLoading ? 'Fetching Data...' : 'Refresh Search Console Data'}
          </Button>
        )}
      </div>

      {error && (
        <Card>
          <CardContent>
            <div className="text-red-500 p-4 bg-red-50 rounded-md">
              {error}
              {error.includes('Token expired') && (
                <div className="mt-4">
                  <Button onClick={() => {
                    // Remove the expired token and show the connect component
                    setHasGoogleToken(false);
                  }}>
                    Reconnect Google Account
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasGoogleToken ? (
        <GoogleSearchConsoleConnect />
      ) : (
        <SearchConsoleAnalytics onRefresh={handleFetchData} />
      )}
    </div>
  );
}