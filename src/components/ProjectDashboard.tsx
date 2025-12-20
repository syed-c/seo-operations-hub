import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  fetchAndStoreSearchConsoleData,
  fetchSearchConsoleSites,
  getGSCIntegrationState
} from '@/services/googleSearchConsoleService';
import { SearchConsoleAnalytics } from './SearchConsoleAnalytics';
import { GoogleSearchConsoleConnect } from './GoogleSearchConsoleConnect';

export function ProjectDashboard() {
  const { selectedProject } = useProject();
  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkGoogleConnection();
  }, [selectedProject]);

  const checkGoogleConnection = async () => {
    // Guard against undefined project or user ID
    if (!selectedProject || !selectedProject.id) {
      setHasGoogleToken(false);
      return;
    }
    
    try {
      // Check if user has Google token (more reliable than project integration state)
      const { data } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('provider', 'google')
        .limit(1);
      
      const isConnected = data?.length > 0;
      setHasGoogleToken(isConnected);
    } catch (err) {
      console.error('Error checking Google connection:', err);
      setHasGoogleToken(false);
    }
  };

  const handleFetchData = async () => {
    if (!selectedProject || !selectedProject.id || !selectedProject.user_id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Import the function dynamically to avoid importing it at module level
      const { getStoredGoogleToken } = await import('@/services/googleSearchConsoleService');
      const token = await getStoredGoogleToken(selectedProject.user_id);
      if (!token) {
        throw new Error('No Google token found');
      }
      
      // Fetch sites to find the matching one
      const sites = await fetchSearchConsoleSites(token.access_token);
      
      // Check for multiple possible site URL formats
      const possibleSiteUrls = [
        `sc-domain:${selectedProject.client}`,
        `https://${selectedProject.client}`,  
        `https://${selectedProject.client}/`,
        `http://${selectedProject.client}`,
        `http://${selectedProject.client}/`
      ];
      
      // Also check if client might already include protocol
      if (selectedProject.client && selectedProject.client.startsWith('http')) {
        possibleSiteUrls.push(selectedProject.client);
        possibleSiteUrls.push(`${selectedProject.client}/`);
      }
      
      const matchedSite = sites.find(site => 
        possibleSiteUrls.includes(site.siteUrl)
      );
      
      if (!matchedSite) {
        throw new Error(`Website ${selectedProject.client} is not verified in Google Search Console`);
      }
      
      // Extract account email from token
      const accountEmail = token?.account_email || '';
      
      // Use the new combined function to fetch both property and page data
      await fetchAndStoreSearchConsoleData(token.access_token, matchedSite.siteUrl, selectedProject.id, accountEmail);
      
      // Refresh the UI
      window.location.reload();
    } catch (err) {
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