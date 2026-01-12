import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Plus, TrendingUp, Users, Calendar, BarChart3 } from "lucide-react";
import { useProject } from "@/contexts/ProjectContext";
import { useUserRole, getDashboardRoute } from "@/hooks/useUserRole";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ProjectSelection() {
  const navigate = useNavigate();
  const { projects, selectedProject, setSelectedProject, fetchProjects, loading } = useProject();
  const { role } = useUserRole();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    navigate(getDashboardRoute(role));
  };

  const handleGeneralSelect = () => {
    setSelectedProject(null);
    navigate(getDashboardRoute(role));
  };

  const handleCreateProject = () => {
    navigate("/projects");
  };

  return (
    <MainLayout>
      <Header
        title="Select a Project"
        subtitle="Choose a project to work on or view general analytics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* General Analytics Card */}
        <Card
          className="cursor-pointer hover:shadow-card-hover transition-all border-2 border-dashed border-primary/30 hover:border-primary bg-gradient-to-br from-primary/5 to-transparent animate-slide-up"
          onClick={handleGeneralSelect}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className="block">General Analytics</span>
                <span className="text-sm font-normal text-muted-foreground">All projects combined</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              View consolidated analytics and metrics across all your projects in one dashboard.
            </p>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>{projects.length} projects</span>
              </div>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </CardContent>
        </Card>

        {/* Project Cards */}
        {projects.map((project, index) => (
          <Card
            key={project.id}
            className={cn(
              "cursor-pointer hover:shadow-card-hover transition-all animate-slide-up",
              selectedProject?.id === project.id && "ring-2 ring-primary"
            )}
            style={{ animationDelay: `${(index + 1) * 50}ms` }}
            onClick={() => handleProjectSelect(project)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate">{project.name}</span>
                    <span className="text-xs font-normal text-muted-foreground truncate block">
                      {project.client || "No URL specified"}
                    </span>
                  </div>
                </div>
                <span className={cn(
                  "text-xs px-2 py-1 rounded-full capitalize",
                  project.status === "active" && "bg-success/10 text-success",
                  project.status === "paused" && "bg-warning/10 text-warning",
                  project.status === "completed" && "bg-muted text-muted-foreground",
                  project.status === "critical" && "bg-destructive/10 text-destructive"
                )}>
                  {project.status || "active"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.health_score !== undefined && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">Health Score</span>
                    <span className="text-sm font-medium">{project.health_score}%</span>
                  </div>
                  <Progress
                    value={project.health_score}
                    className="h-2"
                    indicatorClassName={cn(
                      project.health_score >= 80 && "bg-success",
                      project.health_score >= 60 && project.health_score < 80 && "bg-warning",
                      project.health_score < 60 && "bg-destructive"
                    )}
                  />
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Team</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create New Project Card */}
        <Card
          className="cursor-pointer hover:shadow-card-hover transition-all border-2 border-dashed hover:border-primary/50 flex flex-col items-center justify-center text-center min-h-[200px] animate-slide-up"
          style={{ animationDelay: `${(projects.length + 1) * 50}ms` }}
          onClick={handleCreateProject}
        >
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <Plus className="w-7 h-7 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-1">Create New Project</CardTitle>
            <p className="text-muted-foreground text-sm">
              Start a new SEO project
            </p>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && projects.length === 0 && (
          <Card className="col-span-full flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground">Loading projects...</span>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
