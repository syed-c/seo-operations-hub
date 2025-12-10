import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Globe,
  FileText,
  Target,
  TrendingUp,
  Link2,
  MapPin,
  ListTodo,
  BarChart3,
  Settings,
  MessageSquare,
  Users,
  Zap,
  ChevronDown,
  Star,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import { useUserRole, roleNavigationConfig, getDashboardRoute, type UserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Full navigation for super admin
const allNavSections: NavSection[] = [
  {
    title: "Quick Access",
    items: [
      { title: "Starred", href: "/starred", icon: Star },
      { title: "Recent", href: "/recent", icon: Clock },
    ],
  },
  {
    title: "SEO Modules",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Projects", href: "/projects", icon: FolderKanban, badge: 12 },
      { title: "Pages", href: "/pages", icon: FileText },
      { title: "Keywords", href: "/keywords", icon: Target, badge: 248 },
      { title: "Rankings", href: "/rankings", icon: TrendingUp },
      { title: "Backlinks", href: "/backlinks", icon: Link2 },
      { title: "Local SEO", href: "/local-seo", icon: MapPin },
    ],
  },
  {
    title: "Operations",
    items: [
      { title: "Tasks", href: "/tasks", icon: ListTodo, badge: 23 },
      { title: "Automation", href: "/automation", icon: Zap },
      { title: "Reports", href: "/reports", icon: BarChart3 },
      { title: "Team Chat", href: "/chat", icon: MessageSquare, badge: 5 },
      { title: "Team", href: "/team", icon: Users },
    ],
  },
];

// Get role-specific navigation
function getRoleNavigation(role: UserRole): NavSection[] {
  const allowedRoutes = roleNavigationConfig[role] || [];
  
  return allNavSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      allowedRoutes.some(route => item.href === route || route.startsWith(item.href))
    )
  })).filter(section => section.items.length > 0);
}

// Role display names
const roleDisplayNames: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  seo_lead: "SEO Lead",
  content_lead: "Content Lead",
  backlink_lead: "Backlink Lead",
  developer: "Developer",
  client: "Client",
  readonly: "Read Only",
};

export function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["SEO Modules", "Operations"]);
  const { projects, selectedProject, setSelectedProject, fetchProjects } = useProject();
  const { role } = useUserRole();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");

  const navSections = getRoleNavigation(role);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from("websites")
        .insert({
          domain: newProjectName,
          url: newProjectUrl || newProjectName,
          status: "active",
          health_score: 70,
        })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        await fetchProjects();
        setSelectedProject({
          id: data[0].id,
          name: data[0].domain,
          client: data[0].url,
          status: data[0].status,
          health_score: data[0].health_score,
          created_at: data[0].created_at
        });
      }

      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectUrl("");
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProject(project);
    navigate(getDashboardRoute(role));
  };

  const handleGeneralSelect = () => {
    setSelectedProject(null);
    navigate(getDashboardRoute(role));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 glass-panel rounded-3xl z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Target className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-display font-bold text-foreground">SEO CRM</h1>
                <p className="text-xs text-muted-foreground">Operations Hub</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="p-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm cursor-pointer hover:bg-muted transition-colors">
            <Search className="w-4 h-4" />
            <span>Search...</span>
            <kbd className="ml-auto text-xs bg-background px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
        </div>
      )}

      {/* Project Selector */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-muted/50 text-sm hover:bg-muted transition-colors border border-border/50">
                <div className="flex items-center gap-2 truncate">
                  <FolderKanban className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="truncate font-medium">
                    {selectedProject ? selectedProject.name : "All Projects"}
                  </span>
                </div>
                <ChevronsUpDown className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-72 overflow-y-auto bg-popover">
              <DropdownMenuItem onClick={handleGeneralSelect} className="cursor-pointer">
                <Globe className="w-4 h-4 mr-2" />
                <span className="font-medium">All Projects (General)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className={cn(
                    "cursor-pointer",
                    selectedProject?.id === project.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      project.status === "active" && "bg-success",
                      project.status === "paused" && "bg-warning",
                      project.status === "critical" && "bg-destructive"
                    )} />
                    <span className="truncate">{project.name}</span>
                    {project.health_score && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {project.health_score}%
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              {(role === "super_admin" || role === "admin") && (
                <>
                  <DropdownMenuSeparator />
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                        <Plus className="w-4 h-4 mr-2" />
                        <span>Create New Project</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                          Enter the details for your new SEO project.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="project-name">Project Name</Label>
                          <Input
                            id="project-name"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="e.g., My Website"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="project-url">Website URL (Optional)</Label>
                          <Input
                            id="project-url"
                            value={newProjectUrl}
                            onChange={(e) => setNewProjectUrl(e.target.value)}
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                          Create Project
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
              >
                {section.title}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    expandedSections.includes(section.title) && "rotate-180"
                  )}
                />
              </button>
            )}
            {(collapsed || expandedSections.includes(section.title)) && (
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "sidebar-item",
                      collapsed && "justify-center px-2"
                    )}
                    activeClassName="active"
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/50">
        <NavLink
          to="/settings"
          className={cn("sidebar-item", collapsed && "justify-center px-2")}
          activeClassName="active"
        >
          <Settings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        
        {!collapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="mt-3 p-3 rounded-xl bg-muted/50 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors">
                <Avatar className="w-9 h-9">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">John Doe</p>
                  <p className="text-xs text-muted-foreground truncate">{roleDisplayNames[role]}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}
