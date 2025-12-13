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
import { ProjectDashboard } from "@/components/ProjectDashboard";

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

      <ProjectDashboard />
    </MainLayout>
  );
}