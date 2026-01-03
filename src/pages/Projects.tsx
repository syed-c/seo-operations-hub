import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Globe, Plus, Search, Filter, MoreVertical, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";

type ProjectRecord = {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
};

const statusColors = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  critical: "bg-destructive/10 text-destructive",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const { teamUser } = useAuth();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [health, setHealth] = useState(70);
  const [status, setStatus] = useState("active");
  
  // Determine if user has permission to create/edit projects
  const canCreateEditProjects = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead';

  // Fetch projects with React Query based on user role
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (teamUser?.role === 'Developer') {
        // For developers, fetch only assigned projects
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const { data, error } = await supabase
          .from('projects')
          .select(`
            projects.id, 
            projects.name, 
            projects.client, 
            projects.status, 
            projects.health_score, 
            projects.created_at
          `)
          .join('project_members', 'projects.id', 'project_members.project_id')
          .eq('project_members.user_id', user.id);
          
        if (error) throw new Error(error.message);
        return data || [];
      } else {
        // For other roles, fetch all projects
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, client, status, health_score, created_at")
          .order("created_at", { ascending: false });
        
        if (error) throw new Error(error.message);
        return data || [];
      }
    }
  });

  // Mutation for creating a project
  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Partial<ProjectRecord>) => {
      const { error } = await supabase.from("projects").insert(newProject);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Reset form
      setName("");
      setClient("");
      setHealth(70);
      setStatus("active");
    }
  });

  // Mutation for deleting a project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Mutation for updating a project
  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: ProjectRecord) => {
      const { error } = await supabase
        .from("projects")
        .update({ 
          status: updatedProject.status, 
          health_score: updatedProject.health_score, 
          client: updatedProject.client, 
          name: updatedProject.name 
        })
        .eq("id", updatedProject.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const onCreate = () => {
    if (!name) return;
    createProjectMutation.mutate({
      name,
      client,
      status,
      health_score: health,
    });
  };

  const onDelete = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  const onUpdate = (project: ProjectRecord) => {
    updateProjectMutation.mutate(project);
  };

  const filtered = useMemo(() => projects, [projects]);

  return (
    <MainLayout>
      <Header title="Projects" subtitle="Manage all your SEO projects" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-64 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        {canCreateEditProjects && (
        <div className="flex items-center gap-3">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <input
            type="number"
            className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Health"
            value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
          />
          <Button 
            className="gap-2 rounded-xl" 
            onClick={onCreate}
            disabled={createProjectMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">Error: {error.message}</p>}
      {createProjectMutation.isError && <p className="text-sm text-destructive mb-4">Error: {createProjectMutation.error.message}</p>}

      <div className="grid grid-cols-2 gap-5">
        {filtered.map((project, index) => (
          <div
            key={project.id}
            className="glass-card p-5 animate-slide-up hover:shadow-card-hover transition-all cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {canCreateEditProjects ? (
                    <>
                      <input
                        className="font-semibold bg-transparent outline-none"
                        value={project.name}
                        onChange={(e) => {
                          const updatedProjects = projects.map(p => 
                            p.id === project.id ? { ...p, name: e.target.value } : p
                          );
                          // Optimistic update
                          queryClient.setQueryData(['projects'], updatedProjects);
                        }}
                      />
                      <input
                        className="text-sm text-muted-foreground bg-transparent outline-none"
                        value={project.client ?? ""}
                        onChange={(e) => {
                          const updatedProjects = projects.map(p => 
                            p.id === project.id ? { ...p, client: e.target.value } : p
                          );
                          // Optimistic update
                          queryClient.setQueryData(['projects'], updatedProjects);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.client ?? ""}</div>
                    </>
                  )}
                </div>
              </div>
              {canCreateEditProjects && (
              <div className="flex items-center gap-2">
                <select
                  className={cn("chip text-xs capitalize bg-muted text-foreground")}
                  value={project.status ?? "active"}
                  onChange={(e) => {
                    const updatedProjects = projects.map(p => 
                      p.id === project.id ? { ...p, status: e.target.value } : p
                    );
                    // Optimistic update
                    queryClient.setQueryData(['projects'], updatedProjects);
                  }}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                  <option value="critical">critical</option>
                </select>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                  onClick={() => onDelete(project.id)}
                  disabled={deleteProjectMutation.isPending}
                >
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <input
                  type="number"
                  className="text-sm font-semibold w-20 bg-transparent outline-none"
                  value={project.health_score ?? 0}
                  onChange={(e) => {
                    const updatedProjects = projects.map(p => 
                      p.id === project.id ? { ...p, health_score: Number(e.target.value) } : p
                    );
                    // Optimistic update
                    queryClient.setQueryData(['projects'], updatedProjects);
                  }}
                />
              </div>
              <Progress
                value={project.health_score ?? 0}
                className="h-2"
                indicatorClassName={cn(
                  (project.health_score ?? 0) >= 80 && "bg-success",
                  (project.health_score ?? 0) >= 60 && (project.health_score ?? 0) < 80 && "bg-warning",
                  (project.health_score ?? 0) < 60 && "bg-destructive"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Backlinks</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-semibold">—</p>
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  <Avatar className="w-7 h-7 border-2 border-card">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" />
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              {canCreateEditProjects && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl" 
                onClick={() => onUpdate(project)}
                disabled={updateProjectMutation.isPending}
              >
                Save
              </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}