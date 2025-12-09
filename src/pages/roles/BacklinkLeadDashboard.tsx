import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Link2, 
  Target, 
  BarChart3, 
  AlertCircle,
  TrendingUp,
  ListTodo
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function BacklinkLeadDashboard() {
  const { selectedProject } = useProject();
  const [backlinkData, setBacklinkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      fetchBacklinkData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchBacklinkData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch backlinks count
      const { count: backlinksCount, error: backlinksError } = await supabase
        .from("backlinks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (backlinksError) throw backlinksError;

      // Fetch new backlinks (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newBacklinksCount, error: newBacklinksError } = await supabase
        .from("backlinks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (newBacklinksError) throw newBacklinksError;

      // Fetch tasks count for backlink tasks
      const { count: tasksCount, error: tasksError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .or("type.eq.backlinks");

      if (tasksError) throw tasksError;

      setBacklinkData({
        backlinksCount,
        newBacklinksCount,
        tasksCount
      });
    } catch (error) {
      console.error("Error fetching backlink data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header 
        title={`${selectedProject ? selectedProject.name : "General"} - Backlink Lead Dashboard`} 
        subtitle="Manage backlink strategy and track link building performance" 
      />

      {backlinkData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backlinkData.backlinksCount || 0}</div>
                <p className="text-xs text-muted-foreground">All acquired backlinks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Backlinks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backlinkData.newBacklinksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backlink Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{backlinkData.tasksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active link building tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Backlink Strategy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Backlink Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Link Building Goals</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Focus on acquiring high-quality, relevant backlinks from authoritative domains.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Competitor Analysis</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Analyze competitor backlink profiles to identify opportunities.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Link Quality Monitoring</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Regularly audit existing backlinks for quality and spam detection.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Link2 className="w-4 h-4" />
                      Run Backlink Crawler
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Target className="w-4 h-4" />
                      Analyze Competitor Links
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <AlertCircle className="w-4 h-4" />
                      Spam Link Detection
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <BarChart3 className="w-4 h-4" />
                      Backlink Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Project Selected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please select a project from the dropdown to view the Backlink Lead dashboard.
            </p>
            <Button className="mt-4" onClick={() => window.location.hash = "/project-selection"}>
              Select Project
            </Button>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}