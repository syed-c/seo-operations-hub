import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Target, 
  Users, 
  Calendar,
  BarChart3,
  AlertCircle,
  ListTodo
} from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function ContentLeadDashboard() {
  const { selectedProject } = useProject();
  const [contentData, setContentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedProject) {
      fetchContentData(selectedProject.id);
    }
  }, [selectedProject]);

  const fetchContentData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // Fetch pages count
      const { count: pagesCount, error: pagesError } = await supabase
        .from("pages")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (pagesError) throw pagesError;

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
        .eq("project_id", projectId)
        .or("type.eq.content");

      if (tasksError) throw tasksError;

      setContentData({
        pagesCount,
        keywordsCount,
        tasksCount
      });
    } catch (error) {
      console.error("Error fetching content data:", error);
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
        title={`${selectedProject ? selectedProject.name : "General"} - Content Lead Dashboard`} 
        subtitle="Manage content strategy and track content performance" 
      />

      {contentData ? (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Pages</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentData.pagesCount || 0}</div>
                <p className="text-xs text-muted-foreground">Published pages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Keywords</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentData.keywordsCount || 0}</div>
                <p className="text-xs text-muted-foreground">Content-focused keywords</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Content Tasks</CardTitle>
                <ListTodo className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentData.tasksCount || 0}</div>
                <p className="text-xs text-muted-foreground">Active content tasks</p>
              </CardContent>
            </Card>
          </div>

          {/* Content Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Content Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Content Goals</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Focus on creating high-quality, SEO-optimized content that drives engagement and conversions.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Content Calendar</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Manage publishing schedule and content deadlines.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Content Audits</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Regularly audit existing content for optimization opportunities.
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
                      <FileText className="w-4 h-4" />
                      Create Content Brief
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Target className="w-4 h-4" />
                      Assign Keywords
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <Calendar className="w-4 h-4" />
                      Schedule Content
                    </Button>
                    <Button className="w-full justify-start gap-2" variant="outline">
                      <BarChart3 className="w-4 h-4" />
                      Content Audit
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
              Please select a project from the dropdown to view the Content Lead dashboard.
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