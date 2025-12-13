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
  storeSearchConsoleData
} from '@/services/googleSearchConsoleService';

export function ProjectDashboard() {
  const { selectedProject } = useProject();
  const [hasGoogleToken, setHasGoogleToken] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkGoogleConnection();
  }, [selectedProject]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const token = await getStoredGoogleToken(user.id);
      if (!token) {
        throw new Error('Google account not connected');
      }

      // Refresh token if expired
      let accessToken = token.access_token;
      if (new Date(token.expires_at) < new Date()) {
        // Token expired, refresh it
        // Note: In a real implementation, you would implement token refresh logic here
        throw new Error('Token expired. Please reconnect your Google account.');
      }

      // Fetch sites to verify the project's website is connected
      const sites = await fetchSearchConsoleSites(accessToken);
      const projectWebsite = `sc-domain:${selectedProject.client}`;
      const isVerified = sites.some(site => site.siteUrl === projectWebsite);

      if (!isVerified) {
        throw new Error(`Website ${selectedProject.client} is not verified in Google Search Console`);
      }

      // Fetch analytics data
      const query = {
        startDate: '2023-01-01',
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['page'],
        rowLimit: 1000,
      };

      const data = await fetchSearchAnalytics(accessToken, projectWebsite, query);
      
      // Store data in Supabase
      await storeSearchConsoleData(selectedProject.id, data);
      
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
            </div>
          </CardContent>
        </Card>
      )}

      {!hasGoogleToken ? (
        <GoogleSearchConsoleConnect />
      ) : (
        <SearchConsoleAnalytics />
      )}
    </div>
  );
}