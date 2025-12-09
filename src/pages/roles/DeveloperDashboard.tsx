import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  AlertCircle, 
  TrendingUp, 
  BarChart3,
  ListTodo,
  Globe
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function DeveloperDashboard() {
  const { selectedProject } = useProject();
  const [techData, setTechData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      fetchTechData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchTechData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch websites count
      const { count: websitesCount, error: websitesError } = await supabase
        .from("websites")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (websitesError) throw websitesError;

      // Fetch pages count
      const { count: pagesCount, error: pagesError } = await supabase
        .from("pages")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (pagesError) throw pagesError;

      // Fetch tasks count for technical tasks
      const { count: tasksCount, error: tasksError } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId)
        .or("type.eq.technical");

      if (tasksError) throw tasksError;

      setTechData({
        websitesCount,
        pagesCount,
        tasksCount
      });
    } catch (error) {
      console.error("Error fetching technical data:", error);
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
        title={`${selectedProject ? selectedProject.name : "General"} - Developer Dashboard`} 
        subtitle="Manage technical SEO implementation and site performance" 
      />

      {techData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Websites</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{techData.websitesCount || 0}</div>
                <p className="text-xs text-muted-foreground">Monitored websites</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pages</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{techData.pagesCount || 0}</div>
                <p className="text-xs text-muted-foreground">Indexed pages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tech Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{techData.tasksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active technical tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Technical SEO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Technical SEO Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Site Performance</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Optimize Core Web Vitals and page loading speeds for better user experience.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Crawlability</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Ensure proper site structure, sitemaps, and robot.txt configuration.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Indexation</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Monitor and fix indexation issues to ensure all valuable pages are indexed.
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
                      <Wrench className="w-4 h-4" />
                      Run Technical Audit
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <AlertCircle className="w-4 h-4" />
                      Fix Crawl Errors
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <TrendingUp className="w-4 h-4" />
                      Optimize Site Speed
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <BarChart3 className="w-4 h-4" />
                      Performance Report
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
              Please select a project from the dropdown to view the Developer dashboard.
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