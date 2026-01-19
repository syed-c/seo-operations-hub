import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Link,
  Link2Off,
  TrendingUp,
  Users,
  Folder
} from 'lucide-react';
import { useBacklinkReportStats } from '@/hooks/useBacklinkReports';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = {
  critical: 'hsl(var(--destructive))',
  warning: 'hsl(var(--warning))',
  healthy: 'hsl(var(--success))',
};

export function BacklinkReportsDashboard({ projectId }: { projectId?: string }) {
  const { data: stats, isLoading, error } = useBacklinkReportStats(projectId);

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Error loading report statistics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-10 w-10 rounded-xl mb-3" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statusPieData = [
    { name: 'Critical', value: stats.byStatus.critical, color: COLORS.critical },
    { name: 'Warning', value: stats.byStatus.warning, color: COLORS.warning },
    { name: 'Healthy', value: stats.byStatus.healthy, color: COLORS.healthy },
  ].filter(d => d.value > 0);

  const linkData = [
    { name: 'Working Links', value: stats.linkMetrics.totalWorkingLinks, fill: 'hsl(var(--success))' },
    { name: 'Dead Links', value: stats.linkMetrics.totalDeadLinks, fill: 'hsl(var(--destructive))' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '50ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.byStatus.critical}</p>
                <p className="text-sm text-muted-foreground">Critical Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{stats.byStatus.warning}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{stats.byStatus.healthy}</p>
                <p className="text-sm text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
            <div className="flex justify-center gap-6 mt-4">
              {statusPieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Link Health Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Link Health</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={linkData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">{stats.linkMetrics.deadLinkRate}%</span> dead link rate
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Weekly Reports</p>
                <p className="text-2xl font-bold">{stats.trends.weekly}</p>
                <p className="text-xs text-destructive">
                  {stats.trends.weeklyCritical} critical
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly Reports</p>
                <p className="text-2xl font-bold">{stats.trends.monthly}</p>
                <p className="text-xs text-destructive">
                  {stats.trends.monthlyCritical} critical
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Failing Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Top Failing Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topFailingProjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No failing projects</p>
            ) : (
              <div className="space-y-2">
                {stats.topFailingProjects.map((project, idx) => (
                  <div key={project.projectId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                    <span className="text-sm font-medium">{project.name || `Project #${idx + 1}`}</span>
                    <div className="flex gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
                        {project.critical} critical
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning">
                        {project.warning} warning
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Assignees with Critical Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Assignees with Critical Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topAssigneesWithCritical.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No critical issues by assignee</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {stats.topAssigneesWithCritical.map((assignee, idx) => (
                <div key={assignee.assigneeId} className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm font-medium truncate" title={assignee.name}>{assignee.name || `Assignee #${idx + 1}`}</p>
                  <p className="text-2xl font-bold text-destructive">{assignee.critical}</p>
                  <p className="text-xs text-muted-foreground">{assignee.total} total reports</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
