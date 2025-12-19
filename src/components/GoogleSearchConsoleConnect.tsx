import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabaseClient';
import {
  initGoogleAuth,
  getStoredGoogleToken,
  fetchSearchConsoleSites,
  isSiteVerified,
  fetchSearchAnalytics,
  storeSearchConsoleData
} from '@/services/googleSearchConsoleService';

export function GoogleSearchConsoleConnect() {
  const { selectedProject } = useProject();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Check if user has already connected Google account
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!selectedProject) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const token = await getStoredGoogleToken(user.id);
        if (token) {
          // Check if token is still valid
          if (new Date(token.expires_at) > new Date()) {
            setIsConnected(true);
            // Fetch sites to verify connection
            await fetchSites(token.access_token);
          } else {
            // Token expired, clear it and show connect button
            await supabase
              .from('user_tokens')
              .delete()
              .eq('user_id', user.id)
              .eq('provider', 'google');
          }
        }
      } catch (err) {
        console.error('Error checking connection status:', err);
      }
    };
    
    checkConnectionStatus();
  }, [selectedProject]);

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear any existing token before reconnecting
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'google');
      }
      
      initGoogleAuth();
    } catch (err) {
      setError('Failed to initiate Google authentication');
      setIsLoading(false);
    }
  };

  const fetchSites = async (accessToken: string) => {
    try {
      const siteList = await fetchSearchConsoleSites(accessToken);
      setSites(siteList);
      
      // Check if the project's website is in the list
      if (selectedProject) {
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
        
        const matchedSite = siteList.find(site => 
          possibleSiteUrls.includes(site.siteUrl)
        );
        
        if (matchedSite) {
          // Fetch analytics data
          await fetchAnalyticsData(accessToken, matchedSite.siteUrl);
        } else {
          // Show available sites for debugging
          console.log('Available sites in Search Console:', siteList);
          console.log('Looking for:', possibleSiteUrls);
          setError(`Website ${selectedProject.client} is not verified in Google Search Console. Available sites: ${siteList.map(s => s.siteUrl).join(', ')}`);
        }
      }
    } catch (err) {
      setError('Failed to fetch Search Console sites');
      console.error(err);
    }
  };

  const fetchAnalyticsData = async (accessToken: string, siteUrl: string) => {
    try {
      const query = {
        startDate: '2023-01-01',
        endDate: new Date().toISOString().split('T')[0],
        dimensions: ['date', 'page'],
        rowLimit: 1000,
      };
      
      const data = await fetchSearchAnalytics(accessToken, siteUrl, query);
      setAnalytics(data);
      
      // Store data in Supabase
      if (selectedProject) {
        await storeSearchConsoleData(selectedProject.id, data, query.dimensions);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error(err);
    }
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Google Search Console Connected</CardTitle>
          <CardDescription>
            Your Google Search Console account is connected. You can view analytics data below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium mb-2">Connected Sites:</h3>
              <ul className="list-disc pl-5">
                {sites.map((site, index) => (
                  <li key={index}>{site.siteUrl}</li>
                ))}
              </ul>
            </div>
          )}
          
          {analytics && (
            <div>
              <h3 className="font-medium mb-2">Analytics Summary:</h3>
              <p>Total Rows: {analytics.rows?.length || 0}</p>
              {/* Add more analytics display here */}
            </div>
          )}
          
          {error && (
            <div className="text-red-500 mt-2">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Google Search Console</CardTitle>
        <CardDescription>
          Connect your Google account to fetch Search Console data for this project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleConnect} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Connecting...' : 'Connect Google Account'}
        </Button>
        
        {error && (
          <div className="text-red-500 mt-2">
            {error}
          </div>
        )}
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p>Note: You only need to do this once. After connecting, we'll automatically fetch your Search Console data.</p>
        </div>
      </CardContent>
    </Card>
  );
}