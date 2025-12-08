import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "review" | "done";
  assignee: {
    name: string;
    avatar: string;
  };
  dueDate: string;
  type: "content" | "technical" | "backlinks" | "local";
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Optimize meta descriptions for product pages",
    project: "Ecommerce Site",
    priority: "high",
    status: "in-progress",
    assignee: {
      name: "Sarah Chen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=face",
    },
    dueDate: "Today",
    type: "content",
  },
  {
    id: "2",
    title: "Fix Core Web Vitals issues on homepage",
    project: "Tech Blog",
    priority: "urgent",
    status: "todo",
    assignee: {
      name: "Mike Ross",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
    },
    dueDate: "Tomorrow",
    type: "technical",
  },
  {
    id: "3",
    title: "Build 5 high-quality guest posts",
    project: "SaaS Platform",
    priority: "medium",
    status: "in-progress",
    assignee: {
      name: "Emma Wilson",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face",
    },
    dueDate: "This week",
    type: "backlinks",
  },
  {
    id: "4",
    title: "Claim and optimize Google Business Profile",
    project: "Local Restaurant",
    priority: "high",
    status: "review",
    assignee: {
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
    },
    dueDate: "Today",
    type: "local",
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
};

const statusIcons = {
  "todo": Circle,
  "in-progress": Clock,
  "review": AlertCircle,
  "done": CheckCircle2,
};

export function TaskList() {
  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-title">Priority Tasks</h3>
          <p className="text-sm text-muted-foreground mt-1">Tasks requiring attention</p>
        </div>
        <button className="text-sm text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="space-y-3">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status];
          return (
            <div
              key={task.id}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <StatusIcon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  task.status === "done" && "text-success",
                  task.status === "in-progress" && "text-primary",
                  task.status === "review" && "text-warning",
                  task.status === "todo" && "text-muted-foreground"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.project}</p>
              </div>
              <span className={cn("chip text-xs", typeColors[task.type])}>
                {task.type}
              </span>
              <span className={cn("chip text-xs", priorityColors[task.priority])}>
                {task.priority}
              </span>
              <span className="text-xs text-muted-foreground">{task.dueDate}</span>
              <Avatar className="w-7 h-7">
                <AvatarImage src={task.assignee.avatar} />
                <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
              </Avatar>
            </div>
          );
        })}
      </div>
    </div>
  );
}
