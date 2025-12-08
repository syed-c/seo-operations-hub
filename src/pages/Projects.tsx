import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Globe, Plus, Search, Filter, MoreVertical, TrendingUp, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  domain: string;
  client: string;
  healthScore: number;
  status: "active" | "paused" | "completed";
  keywords: number;
  backlinks: number;
  avgPosition: number;
  team: { name: string; avatar: string }[];
  lastUpdated: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "TechStartup Pro",
    domain: "techstartup.io",
    client: "TechStartup Inc.",
    healthScore: 92,
    status: "active",
    keywords: 156,
    backlinks: 1240,
    avgPosition: 4.2,
    team: [
      { name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64" },
      { name: "Mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64" },
    ],
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    name: "Ecommerce Giant",
    domain: "shop-giant.com",
    client: "Giant Retail Corp",
    healthScore: 78,
    status: "active",
    keywords: 423,
    backlinks: 3560,
    avgPosition: 8.7,
    team: [
      { name: "Emma", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64" },
      { name: "John", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" },
      { name: "Lisa", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64" },
    ],
    lastUpdated: "5 hours ago",
  },
  {
    id: "3",
    name: "Local Restaurant Chain",
    domain: "bestefood.local",
    client: "Best Food LLC",
    healthScore: 85,
    status: "active",
    keywords: 45,
    backlinks: 320,
    avgPosition: 2.1,
    team: [
      { name: "Tom", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64" },
    ],
    lastUpdated: "1 day ago",
  },
  {
    id: "4",
    name: "SaaS Platform",
    domain: "saasplatform.io",
    client: "SaaS Corp",
    healthScore: 61,
    status: "paused",
    keywords: 289,
    backlinks: 890,
    avgPosition: 15.3,
    team: [
      { name: "Sarah", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64" },
      { name: "Mike", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64" },
    ],
    lastUpdated: "3 days ago",
  },
];

const statusColors = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
};

export default function Projects() {
  return (
    <MainLayout>
      <Header title="Projects" subtitle="Manage all your SEO projects in one place" />

      {/* Actions Bar */}
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
        <Button className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-2 gap-5">
        {projects.map((project, index) => (
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
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.domain}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("chip text-xs capitalize", statusColors[project.status])}>
                  {project.status}
                </span>
                <button className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className="text-sm font-semibold">{project.healthScore}%</span>
              </div>
              <Progress
                value={project.healthScore}
                className="h-2"
                indicatorClassName={cn(
                  project.healthScore >= 80 && "bg-success",
                  project.healthScore >= 60 && project.healthScore < 80 && "bg-warning",
                  project.healthScore < 60 && "bg-destructive"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">{project.keywords}</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">{project.backlinks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Backlinks</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-semibold">{project.avgPosition}</p>
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {project.team.map((member, i) => (
                    <Avatar key={i} className="w-7 h-7 border-2 border-card">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {project.lastUpdated}
              </div>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
