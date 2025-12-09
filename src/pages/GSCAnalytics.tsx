import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Eye, MousePointerClick } from "lucide-react";

interface GSCMetric {
  id: string;
  project_id: string;
  page_url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  date: string;
}

export default function GSCAnalytics() {
  const [metrics, setMetrics] = useState<GSCMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState("30d");
  
  const loadMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("gsc_metrics")
        .select("*")
        .order("date", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setMetrics(data || []);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load GSC metrics");
    }
  };
  
  useEffect(() => {
    loadMetrics();
  }, []);
  
  // Aggregate data by date for charts
  const aggregatedByDate = metrics.reduce((acc: any, metric) => {
    const date = metric.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        avg_position: 0,
        count: 0
      };
    }
    acc[date].clicks += metric.clicks;
    acc[date].impressions += metric.impressions;
    acc[date].ctr += metric.ctr;
    acc[date].avg_position += metric.avg_position;
    acc[date].count += 1;
    return acc;
  }, {});
  
  // Calculate averages
  const chartData = Object.values(aggregatedByDate).map((item: any) => ({
    ...item,
    ctr: item.ctr / item.count,
    avg_position: item.avg_position / item.count
  })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Top performing pages
  const topPages = metrics
    .reduce((acc: any, metric) => {
      const key = metric.page_url;
      if (!acc[key]) {
        acc[key] = {
          page_url: metric.page_url,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          avg_position: 0,
          count: 0
        };
      }
      acc[key].clicks += metric.clicks;
      acc[key].impressions += metric.impressions;
      acc[key].ctr += metric.ctr;
      acc[key].avg_position += metric.avg_position;
      acc[key].count += 1;
      return acc;
    }, {})
    .reduce((acc: any, item: any) => {
      acc.push({
        ...item,
        ctr: item.ctr / item.count,
        avg_position: item.avg_position / item.count
      });
      return acc;
    }, [])
    .sort((a: any, b: any) => b.clicks - a.clicks)
    .slice(0, 10);
  
  return (
    <MainLayout>
      <Header title="GSC Analytics" subtitle="Google Search Console performance metrics" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <Button variant="outline" size="sm" className="gap-2 rounded-xl">
          <Eye className="w-4 h-4" />
          Compare Periods
        </Button>
      </div>
      
      {loading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.clicks, 0).toLocaleString()}
            </div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.impressions, 0).toLocaleString()}
            </div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +8.2% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length || 0).toFixed(2)}%
            </div>
            <p className="text-xs text-destructive flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" />
              -1.3% from last period
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metrics.reduce((sum, m) => sum + m.avg_position, 0) / metrics.length || 0).toFixed(1)}
            </div>
            <p className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" />
              -2.1 positions from last period
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Clicks & Impressions Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impressions" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">CTR & Average Position Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      borderColor: "hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--foreground))"
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="ctr" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="avg_position" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Performing Pages */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm">Top Performing Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Page</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">
                    <MousePointerClick className="w-4 h-4 inline mr-1" />
                    Clicks
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Impressions</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">CTR</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Position</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((page: any, index: number) => (
                  <tr 
                    key={index} 
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      <p className="text-sm font-medium truncate max-w-xs">{page.page_url}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-semibold">{page.clicks.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span>{page.impressions.toLocaleString()}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{(page.ctr * 100).toFixed(2)}%</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-medium">{page.avg_position.toFixed(1)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}