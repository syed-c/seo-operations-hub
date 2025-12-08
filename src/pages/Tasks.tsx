import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Filter, MoreHorizontal, Clock, User, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  project: string;
  priority: "low" | "medium" | "high" | "urgent";
  type: "content" | "technical" | "backlinks" | "local" | "audit";
  assignee: { name: string; avatar: string };
  dueDate: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const columns: Column[] = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-muted",
    tasks: [
      {
        id: "1",
        title: "Write meta descriptions for product pages",
        description: "Create unique, compelling meta descriptions for all 25 product pages",
        project: "Ecommerce Giant",
        priority: "high",
        type: "content",
        assignee: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64" },
        dueDate: "Tomorrow",
      },
      {
        id: "2",
        title: "Disavow toxic backlinks",
        description: "Review and submit disavow file for 15 toxic domains",
        project: "SaaS Platform",
        priority: "medium",
        type: "backlinks",
        assignee: { name: "Mike Ross", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64" },
        dueDate: "This week",
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-info",
    tasks: [
      {
        id: "3",
        title: "Fix Core Web Vitals issues",
        description: "Optimize LCP and CLS on homepage and key landing pages",
        project: "TechStartup Pro",
        priority: "urgent",
        type: "technical",
        assignee: { name: "John Doe", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" },
        dueDate: "Today",
      },
      {
        id: "4",
        title: "Update GMB listings",
        description: "Add new photos and update business hours for all 12 locations",
        project: "Local Restaurant",
        priority: "high",
        type: "local",
        assignee: { name: "Emma Wilson", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64" },
        dueDate: "Today",
      },
    ],
  },
  {
    id: "review",
    title: "In Review",
    color: "bg-warning",
    tasks: [
      {
        id: "5",
        title: "Weekly SEO audit report",
        description: "Review and approve the automated weekly audit findings",
        project: "All Projects",
        priority: "medium",
        type: "audit",
        assignee: { name: "Sarah Chen", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64" },
        dueDate: "Today",
      },
    ],
  },
  {
    id: "done",
    title: "Completed",
    color: "bg-success",
    tasks: [
      {
        id: "6",
        title: "Build 10 guest post links",
        description: "Secured placements on DA50+ sites in tech niche",
        project: "TechStartup Pro",
        priority: "high",
        type: "backlinks",
        assignee: { name: "Mike Ross", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64" },
        dueDate: "Completed",
      },
    ],
  },
];

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const typeColors = {
  content: "chip-primary",
  technical: "bg-secondary/10 text-secondary",
  backlinks: "chip-success",
  local: "bg-info/10 text-info",
  audit: "bg-muted text-muted-foreground",
};

export default function Tasks() {
  return (
    <MainLayout>
      <Header title="Tasks" subtitle="Manage and track all SEO tasks across projects" />

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
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
          New Task
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-5">
        {columns.map((column) => (
          <div key={column.id} className="space-y-3">
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", column.color)} />
                <h3 className="font-medium">{column.title}</h3>
                <span className="text-sm text-muted-foreground">({column.tasks.length})</span>
              </div>
              <button className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="space-y-3">
              {column.tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="glass-card p-4 animate-slide-up hover:shadow-card-hover transition-all cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn("chip text-xs", typeColors[task.type])}>{task.type}</span>
                    <span className={cn("chip text-xs", priorityColors[task.priority])}>
                      <Flag className="w-3 h-3" />
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Project: <span className="text-foreground">{task.project}</span>
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {task.dueDate}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Task Button */}
              <button className="w-full p-3 rounded-xl border border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
