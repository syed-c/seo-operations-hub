import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProject } from '@/contexts/ProjectContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  initGoogleAuth,
  fetchSearchConsoleSites,
  fetchAndStoreSearchConsoleData,
  storeGSCConnectionState,
  getGSCIntegrationState
} from '@/services/googleSearchConsoleService';

export function GoogleSearchConsoleConnect() {
  const { selectedProject } = useProject();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sites, setSites] = useState<{ siteUrl: string; permissionLevel: string }[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    // Guard against undefined project
    if (!selectedProject || !selectedProject.id) return;
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if user has Google token (more reliable than project integration state)
      const { data } = await supabase
        .from('user_tokens')
        .select('id')
        .eq('provider', 'google')
        .eq('user_id', user.id)
        .limit(1);
      
      const isConnected = (data?.length ?? 0) > 0;
      setIsConnected(isConnected);
      
      // If connected, fetch sites to display them
      if (isConnected) {
        // Import token function dynamically to avoid importing at module level
        const { getStoredGoogleToken } = await import('@/services/googleSearchConsoleService');
        const token = await getStoredGoogleToken(user.id);
        if (token) {
          const sites = await fetchSearchConsoleSites(token.access_token);
          setSites(sites);
        }
      }
    } catch (err) {
      console.error('Error checking connection:', err);
      setError('Failed to check connection status');
    }
  };

  const handleConnect = () => {
    if (!selectedProject) {
      setError('No project selected');
      return;
    }
    
    try {
      initGoogleAuth(selectedProject.id);
    } catch (err) {
      setError('Failed to initiate Google authentication');
      console.error(err);
    }
  };

  // This function would be called after successful OAuth callback
  // For now, we'll rely on the dashboard to check integration state
  const handleSuccessfulConnection = async (accountEmail: string, propertyUrl: string) => {
    if (!selectedProject) return;
    
    try {
      await storeGSCConnectionState(selectedProject.id, accountEmail);
      setIsConnected(true);
    } catch (err) {
      setError('Failed to store connection state');
      console.error(err);
    }
  };

  const fetchAnalyticsData = async (accessToken: string, siteUrl: string) => {
    if (!selectedProject || !selectedProject.id) return;
    
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Import token function dynamically
      const { getStoredGoogleToken } = await import('@/services/googleSearchConsoleService');
      // Extract account email from token
      const token = await getStoredGoogleToken(user.id);
      const accountEmail = token?.account_email || '';
      
      // Use the new combined function to fetch both property and page data
      const data = await fetchAndStoreSearchConsoleData(accessToken, siteUrl, selectedProject.id, accountEmail);
      setAnalytics(data);
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
              <p>Total Property Rows: {analytics.propertyData?.rows?.length || 0}</p>
              <p>Total Page Rows: {analytics.pageData?.rows?.length || 0}</p>
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