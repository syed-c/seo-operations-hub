import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Globe, Plus, Search, Filter, MoreVertical, TrendingUp, Users, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/hooks/use-toast";

type ProjectRecord = {
  id: string;
  name: string;
  client?: string;
  description?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
};

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  critical: "bg-destructive/10 text-destructive",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch projects with React Query
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client, description, status, health_score, created_at")
        .order("created_at", { ascending: false });
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  // Mutation for creating a project
  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Partial<ProjectRecord>) => {
      const { data, error } = await supabase.from("projects").insert({
        name: newProject.name,
        client: newProject.client,
        description: newProject.description,
        status: 'active',
        health_score: 0,
      }).select().single();
      
      if (error) throw new Error(error.message);
      
      // Create a default website for this project
      if (data) {
        await supabase.from("websites").insert({
          project_id: data.id,
          name: newProject.name,
          url: newProject.client?.startsWith('http') ? newProject.client : `https://${newProject.client || newProject.name?.toLowerCase().replace(/\s+/g, '')}.com`,
          status: 'active',
        });
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project Created",
        description: "Your new project has been created with automation enabled.",
      });
      // Reset form
      setName("");
      setClient("");
      setDescription("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
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
      toast({
        title: "Project Deleted",
        description: "Project has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Mutation for updating a project
  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: ProjectRecord) => {
      const { error } = await supabase
        .from("projects")
        .update({ 
          name: updatedProject.name,
          client: updatedProject.client,
          status: updatedProject.status, 
          health_score: updatedProject.health_score, 
        })
        .eq("id", updatedProject.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Saved",
        description: "Project updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onCreate = () => {
    if (!name) {
      toast({
        title: "Validation Error",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }
    createProjectMutation.mutate({
      name,
      client: client || undefined,
      description: description || undefined,
    });
  };

  const onDelete = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  const onUpdate = (project: ProjectRecord) => {
    updateProjectMutation.mutate(project);
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return projects;
    return projects.filter((p: ProjectRecord) => 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [projects, searchQuery]);

  return (
    <MainLayout>
      <Header title="Projects" subtitle="Manage all your SEO projects" />

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Client / Website URL"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <Button 
            className="gap-2 rounded-xl" 
            onClick={onCreate}
            disabled={createProjectMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            {createProjectMutation.isPending ? "Creating..." : "New Project"}
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">Error: {error.message}</p>}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No projects found. Create your first project to get started!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((project: any, index) => (
          <div
            key={project.id}
            className="glass-card p-5 animate-slide-up hover:shadow-card-hover transition-all group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.client || "No client specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("chip text-xs capitalize", statusColors[project.status] || "bg-muted")}>
                  {project.status || "active"}
                </span>
                <button
                  className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDelete(project.id)}
                  disabled={deleteProjectMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className="text-sm font-semibold">{project.health_score ?? 0}%</span>
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
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
