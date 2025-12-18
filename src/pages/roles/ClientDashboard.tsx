import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Link2,
  FileText,
  AlertCircle,
  MessageSquare,
  ListTodo
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function ClientDashboard() {
  const { selectedProject } = useProject();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      fetchClientData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchClientData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch project health score
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("health_score, name, client")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch keywords count
      const { count: keywordsCount, error: keywordsError } = await supabase
        .from("keywords")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (keywordsError) throw keywordsError;

      // Fetch tasks count
      const { count: tasksCount, error: tasksError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (tasksError) throw tasksError;

      setClientData({
        ...project,
        keywordsCount,
        tasksCount
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
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
        title={`${selectedProject ? selectedProject.name : "General"} - Client Dashboard`} 
        subtitle="View project performance and communicate with your SEO team" 
      />

      {clientData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Project Health</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientData.health_score || 0}%</div>
                <p className="text-xs text-muted-foreground">Overall project status</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientData.keywordsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Tracked keywords</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientData.tasksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backlinks</CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">—</div>
                <p className="text-xs text-muted-foreground">Backlink metrics</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Performance Summary</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your project is performing well with steady improvements in key metrics.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Recent Activity</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        The team has completed 5 tasks this week and identified 3 new opportunities.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Upcoming Work</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Next week's focus will be on content optimization and link building.
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
                      <BarChart3 className="w-4 h-4" />
                      View Reports
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <MessageSquare className="w-4 h-4" />
                      Contact Team
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <AlertCircle className="w-4 h-4" />
                      Request Changes
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <ListTodo className="w-4 h-4" />
                      View Tasks
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
              Please select a project from the dropdown to view the Client dashboard.
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