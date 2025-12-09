import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Link2, 
  FileText, 
  BarChart3, 
  ListTodo,
  Users,
  AlertCircle
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function SEOLeadDashboard() {
  const { selectedProject } = useProject();
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchProjectData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch project metrics
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
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

      // Fetch backlinks count
      const { count: backlinksCount, error: backlinksError } = await supabase
        .from("backlinks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (backlinksError) throw backlinksError;

      setProjectData({
        ...project,
        keywordsCount,
        tasksCount,
        backlinksCount
      });
    } catch (error) {
      console.error("Error fetching project data:", error);
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
        title={`${selectedProject ? selectedProject.name : "General"} - SEO Lead Dashboard`} 
        subtitle="Manage SEO strategy and track performance" 
      />

      {projectData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Health Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.health_score || 0}%</div>
                <p className="text-xs text-muted-foreground">Project health status</p>
                <Progress 
                  value={projectData.health_score || 0} 
                  className="mt-2" 
                  indicatorClassName={
                    (projectData.health_score || 0) >= 80 
                      ? "bg-success" 
                      : (projectData.health_score || 0) >= 60 
                        ? "bg-warning" 
                        : "bg-destructive"
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Keywords</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.keywordsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Tracked keywords</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.tasksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Backlinks</CardTitle>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectData.backlinksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total backlinks</p>
              </CardContent>
            </Card>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Description</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {projectData.description || "No description provided"}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Client</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {projectData.client || "Not specified"}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Status</h3>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 capitalize bg-primary/10 text-primary">
                        {projectData.status || "active"}
                      </span>
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
                      <Target className="w-4 h-4" />
                      Add Keywords
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <ListTodo className="w-4 h-4" />
                      Create Task
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Link2 className="w-4 h-4" />
                      Run Backlink Audit
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <FileText className="w-4 h-4" />
                      Generate Report
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
              Please select a project from the dropdown to view the SEO Lead dashboard.
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