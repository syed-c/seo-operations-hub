import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRoleDashboardData } from "@/hooks/useRoleDashboardData";
import { useRoleAnalytics } from "@/hooks/useRoleAnalytics";
import { useRoleTasks } from "@/hooks/useRoleTasks";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  MousePointerClick,
  Eye,
  TrendingUp,
  Wrench,
  FileText,
  Link2,
  MapPin,
  AlertCircle,
  Users,
  Target,
  Calendar,
  BarChart3,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Shield,
  Clock,
  CheckCircle,
  Circle,
  Play,
  EyeIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BacklinkReportsDashboard } from "@/components/reports/BacklinkReportsDashboard";

interface UserRole {
  id: string;
  name: string;
  description: string;
}

interface DashboardProps {
  userRole: string;
  userId: string;
}

const RoleBasedDashboard = ({ userRole, userId }: DashboardProps) => {
  const [role, setRole] = useState<string>(userRole);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);

  // Use the new hook for dashboard data
  const { data, loading, error } = useRoleDashboardData(role, userId);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, name, description')
          .order('name');

        if (error) {
          console.error('Error fetching roles:', error);
          return;
        }

        setAvailableRoles(data || []);
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchRoles();
  }, []);

  // Define KPI data based on real data
  const getKpiData = () => {
    return [
      { title: "Total Projects", value: data.totalProjects.toString(), change: 0, changeLabel: "current", icon: BarChart3 },
      { title: "Active Clients", value: data.activeClients.toString(), change: 0, changeLabel: "current", icon: Users },
      { title: "Team Members", value: data.teamMembers.toString(), change: 0, changeLabel: "current", icon: Users },
      { title: "Revenue", value: `$${data.revenue.toLocaleString()}`, change: 0, changeLabel: "current", icon: BarChart3 },
      { title: "Avg. Project Health", value: `${data.avgProjectHealth}%`, change: 0, changeLabel: "current", icon: TrendingUp },
      { title: "Completion Rate", value: `${data.completionRate}%`, change: 0, changeLabel: "current", icon: Target },
      { title: "Support Tickets", value: data.supportTickets.toString(), change: 0, changeLabel: "current", icon: AlertCircle },
      { title: "Client Satisfaction", value: `${data.clientSatisfaction}/5`, change: 0, changeLabel: "current", icon: BarChart3 },
    ];
  };

  const kpiData = getKpiData();

  // Show loading state
  if (loading) {
    return (
      <MainLayout>
        <Header
          title={`${role} Dashboard`}
          subtitle={`Performance overview for ${role} role`}
        />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <MainLayout>
        <Header
          title={`${role} Dashboard`}
          subtitle={`Performance overview for ${role} role`}
        />
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">Error loading dashboard data: {error}</p>
        </div>
      </MainLayout>
    );
  }

  // Analytics Tab Component
  const AnalyticsTab = ({ userRole, userId }: { userRole: string; userId: string }) => {
    const { data, loading, error, timeFilter, setTimeFilter } = useRoleAnalytics(userRole, userId);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!data) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Performance Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex items-center justify-center bg-muted/10 rounded-lg">
              <p className="text-muted-foreground">No analytics data available</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Backlink Reports Section for relevant roles */}
        {['Super Admin', 'SEO Lead', 'Backlink Lead', 'Manager'].includes(userRole) && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Backlink Automation Reports</h3>
            <BacklinkReportsDashboard />
          </div>
        )}

        {/* Time Filter */}
        <div className="flex justify-end">
          <Select value={timeFilter || "all"} onValueChange={(value) => setTimeFilter(value === "all" ? undefined : value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.projects.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.projects.active}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.projects.paused}</div>
                <div className="text-sm text-muted-foreground">Paused</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.projects.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{data.projects.critical}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.users.total}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.users.superAdmins}</div>
                <div className="text-sm text-muted-foreground">Super Admins</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.users.admins}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.users.members}</div>
                <div className="text-sm text-muted-foreground">Members</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.users.clients}</div>
                <div className="text-sm text-muted-foreground">Clients</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Health */}
        <Card>
          <CardHeader>
            <CardTitle>Task Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{data.tasks.total}</div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{data.tasks.todo}</div>
                <div className="text-sm text-muted-foreground">To Do</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.tasks.inProgress}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.tasks.review}</div>
                <div className="text-sm text-muted-foreground">Review</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.tasks.done}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{data.tasks.overdue}</div>
                <div className="text-sm text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Tasks Tab Component
  const TasksTab = ({ userRole, userId }: { userRole: string; userId: string }) => {
    const { tasks, loading, error, filters, updateFilters, clearFilters } = useRoleTasks(userRole, userId);

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Status badge component
    const StatusBadge = ({ status }: { status: string }) => {
      const statusConfig = {
        'todo': { label: 'To Do', color: 'bg-gray-100 text-gray-800', icon: Circle },
        'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Play },
        'review': { label: 'Review', color: 'bg-yellow-100 text-yellow-800', icon: EyeIcon },
        'done': { label: 'Done', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      };

      const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Circle };
      const Icon = config.icon;

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          <Icon className="mr-1.5 h-3 w-3" />
          {config.label}
        </span>
      );
    };

    // Priority badge component
    const PriorityBadge = ({ priority }: { priority: string }) => {
      const priorityConfig = {
        'low': { label: 'Low', color: 'bg-gray-100 text-gray-800' },
        'medium': { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
        'high': { label: 'High', color: 'bg-yellow-100 text-yellow-800' },
        'urgent': { label: 'Urgent', color: 'bg-red-100 text-red-800' },
      };

      const config = priorityConfig[priority as keyof typeof priorityConfig] || { label: priority, color: 'bg-gray-100 text-gray-800' };

      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      );
    };

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <Select value={filters.status || "all"} onValueChange={(value) => updateFilters({ ...filters, status: value === "all" ? undefined : value as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.priority || "all"} onValueChange={(value) => updateFilters({ ...filters, priority: value === "all" ? undefined : value as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.dueDate || "all"} onValueChange={(value) => updateFilters({ ...filters, dueDate: value === "all" ? undefined : value as any })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Due Date</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          {(filters.status || filters.priority || filters.dueDate) && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )
          }
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tasks found</p>
                {Object.keys(filters).length > 0 ? (
                  <Button onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Button>Create your first task</Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground truncate mt-1">{task.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                        {task.due_date && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <Clock className="mr-1.5 h-3 w-3" />
                            Due {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )
                        }
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="ml-4 whitespace-nowrap">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // Define role-specific content
  const getRoleContent = () => {
    switch (role) {
      case 'Super Admin':
        return {
          overview: "As a Super Admin, you have full access to all projects, teams, and system settings. Monitor overall company performance, manage user accounts, and oversee all SEO operations.",
          quickActions: [
            { label: "Manage Users", icon: Users },
            { label: "View All Projects", icon: FolderKanban },
            { label: "System Settings", icon: Wrench },
            { label: "Billing & Invoices", icon: BarChart3 },
          ]
        };

      case 'SEO Lead':
        return {
          overview: "As an SEO Lead, you manage multiple projects and coordinate team efforts. Track keyword rankings, monitor traffic growth, and ensure all SEO initiatives are aligned with business goals.",
          quickActions: [
            { label: "Create Project Report", icon: BarChart3 },
            { label: "Assign Team Tasks", icon: ListTodo },
            { label: "Review Analytics", icon: TrendingUp },
            { label: "Team Performance", icon: Users },
          ]
        };

      case 'Content Lead':
        return {
          overview: "As a Content Lead, you oversee content strategy and production. Monitor content performance, track publishing schedules, and ensure all content meets SEO standards.",
          quickActions: [
            { label: "Create Content Brief", icon: FileText },
            { label: "Review Content Performance", icon: BarChart3 },
            { label: "Assign Writing Tasks", icon: ListTodo },
            { label: "Content Calendar", icon: Calendar },
          ]
        };

      case 'Backlink Lead':
        return {
          overview: "As a Backlink Lead, you focus on link building and competitor analysis. Track backlink growth, monitor domain authority, and identify new link building opportunities.",
          quickActions: [
            { label: "Analyze Competitor Backlinks", icon: Link2 },
            { label: "Create Link Building Campaign", icon: Target },
            { label: "Monitor Spam Links", icon: AlertCircle },
            { label: "Backlink Report", icon: BarChart3 },
          ]
        };

      case 'Developer':
        return {
          overview: "As a Developer, you handle technical SEO implementation. Monitor site performance, fix technical issues, and ensure optimal crawlability and indexation.",
          quickActions: [
            { label: "Run Technical Audit", icon: Wrench },
            { label: "Fix Crawl Errors", icon: AlertCircle },
            { label: "Optimize Site Speed", icon: TrendingUp },
            { label: "Security Check", icon: Shield },
          ]
        };

      case 'Client':
        return {
          overview: "As a Client, you can view project progress and performance metrics. Track your organic traffic growth, keyword rankings, and completed tasks.",
          quickActions: [
            { label: "View Project Reports", icon: BarChart3 },
            { label: "Contact Account Manager", icon: MessageSquare },
            { label: "Request Changes", icon: Wrench },
            { label: "View Tasks", icon: ListTodo },
          ]
        };

      default:
        return {
          overview: "Welcome to your dashboard. Select a role to see role-specific metrics and actions.",
          quickActions: []
        };
    }
  };

  const roleContent = getRoleContent();

  return (
    <MainLayout>
      <Header
        title={`${role} Dashboard`}
        subtitle={`Performance overview for ${role} role`}
      />

      {/* Role Selector */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {availableRoles.map((r) => (
            <Button
              key={r.id}
              variant={role === r.name ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setRole(r.name)}
            >
              {r.name}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                icon={kpi.icon}
                delay={index * 50}
              />
            ))}
          </div>

          {/* Role-Specific Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Role Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {roleContent.overview}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {roleContent.quickActions.map((action, index) => (
                      <Button
                        key={index}
                        className="w-full justify-start gap-2"
                        variant="outline"
                      >
                        <action.icon className="w-4 h-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab userRole={role} userId={userId} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TasksTab userRole={role} userId={userId} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default RoleBasedDashboard;