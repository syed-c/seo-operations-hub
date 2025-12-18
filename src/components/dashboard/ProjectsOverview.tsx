import { useEffect, useState } from "react";
import { Globe, AlertTriangle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

interface Project {
  id: string;
  name: string;
  client?: string;
  health_score?: number;
  status?: string;
}

const statusColors = {
  healthy: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
  active: "text-success",
  paused: "text-warning",
  completed: "text-muted-foreground",
};

export function ProjectsOverview() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, client, status, health_score")
        .order("created_at", { ascending: false });
      setLoading(false);
      if (error) {
        console.error(error.message);
        return;
      }
      setProjects(data || []);
    };
    load();
  }, []);

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Active Projects</h3>
          <p className="text-sm text-muted-foreground mt-1">Performance overview</p>
        </div>
        <div className="text-sm text-muted-foreground">{loading ? "Loading..." : `${projects.length} projects`}</div>
      </div>
      <div className="space-y-4">
        {projects.length === 0 && !loading && (
          <div className="p-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground text-center">
            No projects yet. Create one from the Projects page.
          </div>
        )}
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{project.client || "—"}</p>
                </div>
              </div>
              <div className={cn("flex items-center gap-1", statusColors[(project.status as keyof typeof statusColors) || "active"])}>
                {(project.status || "active") === "active" && <CheckCircle className="w-4 h-4" />}
                {(project.status || "active") !== "active" && <AlertTriangle className="w-4 h-4" />}
                <span className="text-xs font-medium capitalize">{project.status || "active"}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-muted-foreground text-xs">Health Score</span>
                  <span className="font-medium">{project.health_score ?? 0}%</span>
                </div>
                <Progress
                  value={project.health_score ?? 0}
                  className="h-1.5"
                  indicatorClassName={
                    (project.health_score ?? 0) >= 80
                      ? "bg-success"
                      : (project.health_score ?? 0) >= 60
                      ? "bg-warning"
                      : "bg-destructive"
                  }
                />
              </div>
              <div className="text-center px-3">
                <p className="font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center px-3">
                <p className="font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
              <div className="text-center px-3">
                <p className="font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
