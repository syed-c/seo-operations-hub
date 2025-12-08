import { Globe, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  domain: string;
  healthScore: number;
  keywords: number;
  ranking: {
    position: number;
    change: number;
  };
  issues: number;
  status: "healthy" | "warning" | "critical";
}

const projects: Project[] = [
  {
    id: "1",
    name: "TechStartup Pro",
    domain: "techstartup.io",
    healthScore: 92,
    keywords: 156,
    ranking: { position: 4.2, change: 2.1 },
    issues: 3,
    status: "healthy",
  },
  {
    id: "2",
    name: "Ecommerce Giant",
    domain: "shop-giant.com",
    healthScore: 78,
    keywords: 423,
    ranking: { position: 8.7, change: -1.3 },
    issues: 12,
    status: "warning",
  },
  {
    id: "3",
    name: "Local Restaurant",
    domain: "bestefood.local",
    healthScore: 85,
    keywords: 45,
    ranking: { position: 2.1, change: 0.5 },
    issues: 5,
    status: "healthy",
  },
  {
    id: "4",
    name: "SaaS Platform",
    domain: "saasplatform.io",
    healthScore: 61,
    keywords: 289,
    ranking: { position: 15.3, change: -3.2 },
    issues: 24,
    status: "critical",
  },
];

const statusColors = {
  healthy: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

const statusBg = {
  healthy: "bg-success",
  warning: "bg-warning",
  critical: "bg-destructive",
};

export function ProjectsOverview() {
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Active Projects</h3>
          <p className="text-sm text-muted-foreground mt-1">Performance overview</p>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground">{project.domain}</p>
                </div>
              </div>
              <div className={cn("flex items-center gap-1", statusColors[project.status])}>
                {project.status === "healthy" && <CheckCircle className="w-4 h-4" />}
                {project.status === "warning" && <AlertTriangle className="w-4 h-4" />}
                {project.status === "critical" && <AlertTriangle className="w-4 h-4" />}
                <span className="text-xs font-medium capitalize">{project.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-muted-foreground text-xs">Health Score</span>
                  <span className="font-medium">{project.healthScore}%</span>
                </div>
                <Progress
                  value={project.healthScore}
                  className="h-1.5"
                  indicatorClassName={statusBg[project.status]}
                />
              </div>
              <div className="text-center px-3">
                <p className="font-semibold">{project.keywords}</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center px-3">
                <div className="flex items-center gap-1 justify-center">
                  <span className="font-semibold">{project.ranking.position}</span>
                  <TrendingUp
                    className={cn(
                      "w-3.5 h-3.5",
                      project.ranking.change > 0 ? "text-success" : "text-destructive rotate-180"
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
              <div className="text-center px-3">
                <p className={cn("font-semibold", project.issues > 10 && "text-destructive")}>
                  {project.issues}
                </p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
