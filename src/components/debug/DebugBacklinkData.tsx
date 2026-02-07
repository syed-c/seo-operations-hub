import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import sampleData from '@/test-data/sample-backlink-report.json';

export function DebugBacklinkData() {
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      console.log('Sample data:', sampleData);
      setParsedData(sampleData);
    } catch (err) {
      console.error('Error parsing data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  const analyzeData = () => {
    if (!parsedData) return null;
    
    const analysis = {
      totalReports: parsedData.length,
      statuses: {} as Record<string, number>,
      totalLinks: 0,
      workingLinks: 0,
      deadLinks: 0,
      warningLinks: 0,
    };

    parsedData.forEach((report: any) => {
      // Count statuses
      analysis.statuses[report.status] = (analysis.statuses[report.status] || 0) + 1;
      
      // Count links
      if (report.created_links) {
        analysis.totalLinks += report.created_links.total || 0;
        analysis.workingLinks += report.created_links.working || 0;
        analysis.deadLinks += report.created_links.dead || 0;
        analysis.warningLinks += report.created_links.warning || 0;
      }
      
      if (report.overall_summary) {
        analysis.totalLinks += report.overall_summary.total_links_checked || 0;
        analysis.workingLinks += report.overall_summary.total_working || 0;
        analysis.deadLinks += report.overall_summary.total_dead || 0;
      }
    });

    return analysis;
  };

  const analysis = analyzeData();

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Backlink Data Debug</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive">
              <h3 className="font-bold">Error:</h3>
              <p>{error}</p>
            </div>
          ) : parsedData ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Data Analysis:</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-bold">Raw Data Structure:</h3>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto max-h-96">
                  {JSON.stringify(parsedData[0], null, 2)}
                </pre>
              </div>
              
              <Button onClick={() => console.log('Full data:', parsedData)}>
                Log Full Data to Console
              </Button>
            </div>
          ) : (
            <p>Loading data...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}