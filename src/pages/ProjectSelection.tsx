import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus, TrendingUp, Users, Calendar } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { supabase } from "@/lib/supabaseClient";

export default function ProjectSelection() {
  const navigate = useNavigate();
  const { projects, selectedProject, setSelectedProject, fetchProjects } = useProject();

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    navigate("/");
  };

  const handleGeneralSelect = () => {
    setSelectedProject(null);
    navigate("/");
  };

  const handleCreateProject = () => {
    navigate("/websites");
  };

  return (
    <MainLayout>
      <Header 
        title="Select a Project" 
        subtitle="Choose a project (website) to work on or view general analytics" 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Option Card */}
        <Card 
          className="cursor-pointer hover:shadow-card-hover transition-all border-2 border-dashed hover:border-solid"
          onClick={handleGeneralSelect}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              General Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              View consolidated analytics across all your projects
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{projects.length} projects</span>
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
        
        {/* Project Cards */}
        {projects.map((project) => (
          <Card 
            key={project.id}
            className={`cursor-pointer hover:shadow-card-hover transition-all ${
              selectedProject?.id === project.id ? "border-2 border-primary" : ""
            }`}
            onClick={() => handleProjectSelect(project)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {project.name}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                  {project.status || "active"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {project.client || "No client specified"}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Team</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {project.created_at 
                      ? new Date(project.created_at).toLocaleDateString() 
                      : "—"}
                  </span>
                </div>
              </div>
              {project.health_score !== undefined && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Health Score</span>
                    <span className="font-medium">{project.health_score}%</span>
                  </div>
                  <div className="mt-1 w-full bg-muted rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        project.health_score >= 80 
                          ? "bg-success" 
                          : project.health_score >= 60 
                            ? "bg-warning" 
                            : "bg-destructive"
                      }`}
                      style={{ width: `${project.health_score}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Create New Project Card */}
        <Card 
          className="cursor-pointer hover:shadow-card-hover transition-all border-2 border-dashed hover:border-solid flex flex-col items-center justify-center text-center"
          onClick={handleCreateProject}
        >
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Plus className="w-8 h-8 text-muted-foreground mb-2" />
            <CardTitle className="text-lg">Create New Project</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Start a new SEO project (website)
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}