import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserRole {
  id: string;
  name: string;
  description: string;
}

interface DashboardProps {
  userRole: string;
}

const RoleBasedDashboard = ({ userRole }: DashboardProps) => {
  const [role, setRole] = useState<string>(userRole);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  // Define KPI data based on role
  const getKpiData = () => {
    switch (role) {
      case 'Super Admin':
        return [
          { title: "Total Projects", value: "24", change: 5.2, changeLabel: "vs last month", icon: BarChart3 },
          { title: "Active Clients", value: "18", change: 12.5, changeLabel: "vs last month", icon: Users },
          { title: "Team Members", value: "12", change: 9.1, changeLabel: "vs last month", icon: Users },
          { title: "Revenue", value: "$42.5K", change: 15.3, changeLabel: "vs last month", icon: BarChart3 },
          { title: "Avg. Project Health", value: "87%", change: 3.2, changeLabel: "vs last month", icon: TrendingUp },
          { title: "Completion Rate", value: "92%", change: 2.1, changeLabel: "vs last month", icon: Target },
          { title: "Support Tickets", value: "8", change: -22.2, changeLabel: "vs last month", icon: AlertCircle },
          { title: "Client Satisfaction", value: "4.8/5", change: 1.2, changeLabel: "vs last month", icon: BarChart3 },
        ];
      
      case 'SEO Lead':
        return [
          { title: "Managed Projects", value: "8", change: 3.1, changeLabel: "vs last month", icon: BarChart3 },
          { title: "Avg. Rankings", value: "7.2", change: 8.7, changeLabel: "vs last month", icon: TrendingUp },
          { title: "Keywords Tracked", value: "1,248", change: 5.4, changeLabel: "vs last month", icon: Target },
          { title: "Traffic Growth", value: "24%", change: 12.3, changeLabel: "vs last month", icon: MousePointerClick },
          { title: "Conversion Rate", value: "3.8%", change: 2.1, changeLabel: "vs last month", icon: Target },
          { title: "Backlink Growth", value: "15%", change: 7.2, changeLabel: "vs last month", icon: Link2 },
          { title: "Pending Audits", value: "3", change: -25.0, changeLabel: "vs last month", icon: Wrench },
          { title: "Team Performance", value: "89%", change: 4.1, changeLabel: "vs last month", icon: Users },
        ];
      
      case 'Content Lead':
        return [
          { title: "Content Pieces", value: "142", change: 12.4, changeLabel: "vs last month", icon: FileText },
          { title: "Content Score", value: "84%", change: 3.2, changeLabel: "vs last month", icon: FileText },
          { title: "Publishing Rate", value: "18/wk", change: 8.9, changeLabel: "vs last month", icon: Calendar },
          { title: "Engagement Rate", value: "4.2%", change: 5.1, changeLabel: "vs last month", icon: MousePointerClick },
          { title: "Content Ideas", value: "24", change: 15.2, changeLabel: "vs last month", icon: Target },
          { title: "Writer Productivity", value: "92%", change: 2.7, changeLabel: "vs last month", icon: Users },
          { title: "Content Issues", value: "5", change: -37.5, changeLabel: "vs last month", icon: AlertCircle },
          { title: "SEO Impact", value: "15%", change: 6.3, changeLabel: "vs last month", icon: TrendingUp },
        ];
      
      case 'Backlink Lead':
        return [
          { title: "Backlinks", value: "2,847", change: 8.7, changeLabel: "vs last month", icon: Link2 },
          { title: "Domain Authority", value: "62", change: 4.2, changeLabel: "vs last month", icon: TrendingUp },
          { title: "Referral Traffic", value: "8.4K", change: 12.5, changeLabel: "vs last month", icon: MousePointerClick },
          { title: "Link Quality", value: "87%", change: 2.1, changeLabel: "vs last month", icon: Link2 },
          { title: "New Links", value: "142", change: 15.3, changeLabel: "vs last month", icon: Link2 },
          { title: "Lost Links", value: "23", change: -28.1, changeLabel: "vs last month", icon: AlertCircle },
          { title: "Spam Detection", value: "98%", change: 1.4, changeLabel: "vs last month", icon: AlertCircle },
          { title: "Competitor Gap", value: "156", change: -12.2, changeLabel: "vs last month", icon: Target },
        ];
      
      case 'Developer':
        return [
          { title: "Technical Score", value: "92%", change: 3.8, changeLabel: "vs last month", icon: Wrench },
          { title: "Core Web Vitals", value: "89%", change: 5.2, changeLabel: "vs last month", icon: Wrench },
          { title: "Site Speed", value: "1.2s", change: -8.9, changeLabel: "vs last month", icon: TrendingUp },
          { title: "Mobile Score", value: "94%", change: 2.1, changeLabel: "vs last month", icon: Wrench },
          { title: "Crawl Errors", value: "12", change: -45.5, changeLabel: "vs last month", icon: AlertCircle },
          { title: "Security Issues", value: "0", change: 0, changeLabel: "vs last month", icon: AlertCircle },
          { title: "Tasks Completed", value: "42", change: 18.3, changeLabel: "vs last month", icon: Target },
          { title: "Deployment Success", value: "100%", change: 0, changeLabel: "vs last month", icon: TrendingUp },
        ];
      
      case 'Client':
        return [
          { title: "Project Health", value: "87%", change: 2.4, changeLabel: "vs last month", icon: BarChart3 },
          { title: "Organic Traffic", value: "48.2K", change: 12.5, changeLabel: "vs last month", icon: MousePointerClick },
          { title: "Avg. Position", value: "4.2", change: 15.2, changeLabel: "improved", icon: TrendingUp },
          { title: "Top Keywords", value: "142", change: 8.3, changeLabel: "vs last month", icon: Target },
          { title: "Backlinks", value: "2,847", change: 5.7, changeLabel: "new this month", icon: Link2 },
          { title: "Content Score", value: "72%", change: -2.4, changeLabel: "needs work", icon: FileText },
          { title: "Issues Found", value: "23", change: -18.5, changeLabel: "reduced", icon: AlertCircle },
          { title: "Tasks Completed", value: "38", change: 15.2, changeLabel: "vs last month", icon: Target },
        ];
      
      default:
        return [
          { title: "Total Clicks", value: "48.2K", change: 12.5, changeLabel: "vs last week", icon: MousePointerClick },
          { title: "Impressions", value: "1.2M", change: 8.3, changeLabel: "vs last week", icon: Eye },
          { title: "Avg. Position", value: "4.2", change: 15.2, changeLabel: "improved", icon: TrendingUp },
          { title: "Technical Score", value: "87%", change: 3.1, changeLabel: "vs last audit", icon: Wrench },
          { title: "Content Score", value: "72%", change: -2.4, changeLabel: "needs work", icon: FileText },
          { title: "Backlinks", value: "2,847", change: 5.7, changeLabel: "new this month", icon: Link2 },
          { title: "Local SEO Score", value: "91%", change: 1.2, changeLabel: "stable", icon: MapPin },
          { title: "Issues Found", value: "23", change: -18.5, changeLabel: "reduced", icon: AlertCircle },
        ];
    }
  };

  const kpiData = getKpiData();

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
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-muted/10 rounded-lg">
                <p className="text-muted-foreground">Analytics charts would appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Task {item}</h4>
                      <p className="text-sm text-muted-foreground">Description for task {item}</p>
                    </div>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default RoleBasedDashboard;