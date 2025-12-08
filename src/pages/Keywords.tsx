import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Filter, ArrowUpDown, TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Keyword {
  id: string;
  keyword: string;
  project: string;
  page: string;
  volume: number;
  difficulty: number;
  position: number;
  previousPosition: number;
  clicks: number;
  impressions: number;
  ctr: number;
  intent: "informational" | "transactional" | "navigational" | "commercial";
}

const keywords: Keyword[] = [
  {
    id: "1",
    keyword: "best project management software",
    project: "SaaS Platform",
    page: "/features",
    volume: 12000,
    difficulty: 67,
    position: 3,
    previousPosition: 5,
    clicks: 1240,
    impressions: 45000,
    ctr: 2.8,
    intent: "commercial",
  },
  {
    id: "2",
    keyword: "how to manage remote teams",
    project: "SaaS Platform",
    page: "/blog/remote-teams",
    volume: 8500,
    difficulty: 42,
    position: 1,
    previousPosition: 1,
    clicks: 3200,
    impressions: 28000,
    ctr: 11.4,
    intent: "informational",
  },
  {
    id: "3",
    keyword: "buy wireless headphones",
    project: "Ecommerce Giant",
    page: "/headphones",
    volume: 22000,
    difficulty: 78,
    position: 8,
    previousPosition: 6,
    clicks: 890,
    impressions: 52000,
    ctr: 1.7,
    intent: "transactional",
  },
  {
    id: "4",
    keyword: "italian restaurant near me",
    project: "Local Restaurant",
    page: "/",
    volume: 33000,
    difficulty: 35,
    position: 2,
    previousPosition: 4,
    clicks: 2100,
    impressions: 18000,
    ctr: 11.7,
    intent: "navigational",
  },
  {
    id: "5",
    keyword: "startup marketing strategies",
    project: "TechStartup Pro",
    page: "/blog/marketing",
    volume: 4500,
    difficulty: 55,
    position: 12,
    previousPosition: 15,
    clicks: 320,
    impressions: 8500,
    ctr: 3.8,
    intent: "informational",
  },
];

const intentColors = {
  informational: "bg-info/10 text-info",
  transactional: "bg-success/10 text-success",
  navigational: "bg-primary/10 text-primary",
  commercial: "bg-warning/10 text-warning",
};

const getDifficultyColor = (difficulty: number) => {
  if (difficulty < 40) return "text-success";
  if (difficulty < 70) return "text-warning";
  return "text-destructive";
};

export default function Keywords() {
  return (
    <MainLayout>
      <Header title="Keywords" subtitle="Track and analyze keyword performance across all projects" />

      {/* Actions Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search keywords..."
              className="w-72 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        <Button className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Keywords
        </Button>
      </div>

      {/* Keywords Table */}
      <div className="glass-card overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    Keyword <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Project</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors mx-auto">
                    Position <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Volume</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Clicks</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">CTR</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Intent</th>
                <th className="text-center p-4 text-sm font-medium text-muted-foreground">Page</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw, index) => {
                const positionChange = kw.previousPosition - kw.position;
                return (
                  <tr
                    key={kw.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="p-4">
                      <p className="font-medium text-sm">{kw.keyword}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-muted-foreground">{kw.project}</p>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-lg">{kw.position}</span>
                        {positionChange > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-success">
                            <TrendingUp className="w-3.5 h-3.5" />+{positionChange}
                          </span>
                        )}
                        {positionChange < 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-destructive">
                            <TrendingDown className="w-3.5 h-3.5" />{positionChange}
                          </span>
                        )}
                        {positionChange === 0 && (
                          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm">{kw.volume.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("text-sm font-medium", getDifficultyColor(kw.difficulty))}>
                        {kw.difficulty}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm">{kw.clicks.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm">{kw.ctr}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn("chip text-xs capitalize", intentColors[kw.intent])}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button className="flex items-center gap-1 text-xs text-primary hover:underline mx-auto">
                        {kw.page} <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
