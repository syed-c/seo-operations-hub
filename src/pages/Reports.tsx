import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { FileText, Download, Calendar, Clock, TrendingUp, TrendingDown, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  title: string;
  type: "daily" | "weekly" | "monthly" | "audit";
  project: string;
  generatedAt: string;
  highlights: {
    metric: string;
    value: string;
    change: number;
  }[];
  status: "ready" | "generating" | "scheduled";
}

const reports: Report[] = [
  {
    id: "1",
    title: "Weekly SEO Performance Report",
    type: "weekly",
    project: "All Projects",
    generatedAt: "2 hours ago",
    highlights: [
      { metric: "Organic Traffic", value: "45.2K", change: 12.5 },
      { metric: "Keywords Improved", value: "34", change: 15 },
      { metric: "New Backlinks", value: "156", change: 8.3 },
    ],
    status: "ready",
  },
  {
    id: "2",
    title: "Technical SEO Audit",
    type: "audit",
    project: "Ecommerce Giant",
    generatedAt: "Yesterday",
    highlights: [
      { metric: "Health Score", value: "78%", change: -3 },
      { metric: "Issues Found", value: "24", change: 12 },
      { metric: "Core Web Vitals", value: "Pass", change: 0 },
    ],
    status: "ready",
  },
  {
    id: "3",
    title: "Daily Ranking Update",
    type: "daily",
    project: "TechStartup Pro",
    generatedAt: "6 hours ago",
    highlights: [
      { metric: "Avg. Position", value: "4.2", change: 0.3 },
      { metric: "Top 10 Keywords", value: "45", change: 2 },
      { metric: "New Impressions", value: "12.4K", change: 5.6 },
    ],
    status: "ready",
  },
  {
    id: "4",
    title: "Monthly Content Analysis",
    type: "monthly",
    project: "SaaS Platform",
    generatedAt: "Generating...",
    highlights: [],
    status: "generating",
  },
];

const typeColors = {
  daily: "bg-info/10 text-info",
  weekly: "bg-primary/10 text-primary",
  monthly: "bg-secondary/10 text-secondary",
  audit: "bg-warning/10 text-warning",
};

export default function Reports() {
  return (
    <MainLayout>
      <Header title="Reports" subtitle="View automated SEO reports and insights" />

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Reports Generated</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "50ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-muted-foreground">Audits This Month</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">89</p>
              <p className="text-sm text-muted-foreground">AI Insights</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">7</p>
              <p className="text-sm text-muted-foreground">Scheduled Reports</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report, index) => (
          <div
            key={report.id}
            className="glass-card p-6 animate-slide-up hover:shadow-card-hover transition-all"
            style={{ animationDelay: `${(index + 4) * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{report.title}</h3>
                    <span className={cn("chip text-xs capitalize", typeColors[report.type])}>
                      {report.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.project} • {report.generatedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report.status === "ready" && (
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
                {report.status === "generating" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </div>
                )}
                <Button variant="outline" size="sm" className="rounded-xl">
                  View Details
                </Button>
              </div>
            </div>

            {report.highlights.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-border/50">
                {report.highlights.map((highlight, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">{highlight.metric}</p>
                      <p className="font-semibold">{highlight.value}</p>
                    </div>
                    {highlight.change !== 0 && (
                      <div
                        className={cn(
                          "flex items-center gap-0.5 text-sm font-medium",
                          highlight.change > 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {highlight.change > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {highlight.change > 0 ? "+" : ""}
                        {highlight.change}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
