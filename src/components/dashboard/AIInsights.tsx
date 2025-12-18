import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "suggestion";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  project?: string;
}

const insights: Insight[] = [
  {
    id: "1",
    type: "opportunity",
    title: "Ranking opportunity detected",
    description: "3 keywords are on page 2, close to ranking on page 1. Optimize content to push them higher.",
    impact: "high",
    project: "TechStartup Pro",
  },
  {
    id: "2",
    type: "warning",
    title: "Core Web Vitals declining",
    description: "LCP increased by 0.8s on the homepage. This may affect mobile rankings.",
    impact: "high",
    project: "Ecommerce Giant",
  },
  {
    id: "3",
    type: "suggestion",
    title: "Content refresh needed",
    description: "5 blog posts haven't been updated in 6+ months. Refreshing could boost traffic 20-30%.",
    impact: "medium",
  },
];

const typeConfig = {
  opportunity: {
    icon: TrendingUp,
    bg: "bg-success/10",
    iconColor: "text-success",
    border: "border-success/20",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-warning/10",
    iconColor: "text-warning",
    border: "border-warning/20",
  },
  suggestion: {
    icon: Lightbulb,
    bg: "bg-info/10",
    iconColor: "text-info",
    border: "border-info/20",
  },
};

const impactColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function AIInsights() {
  const navigate = useNavigate();

  const handleViewAll = () => {
    navigate("/reports");
  };

  return (
    <div className="glass-card p-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="section-title">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by intelligence engine</p>
          </div>
        </div>
        <button 
          className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
          onClick={handleViewAll}
        >
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-3">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;
          return (
            <div
              key={insight.id}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", config.bg)}>
                  <Icon className={cn("w-4.5 h-4.5", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <span className={cn("chip text-xs", impactColors[insight.impact])}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                  {insight.project && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Project: <span className="text-foreground">{insight.project}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}