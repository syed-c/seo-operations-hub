import { useState } from "react";
import { NavLink } from "@/components/NavLink";
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
  Bell,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProject } from "@/contexts/ProjectContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabaseClient";
import { callAdminFunction } from "@/lib/adminApiClient";
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

const navSections: NavSection[] = [
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
      { title: "Role Dashboard", href: "/dashboard", icon: Users },
      { title: "Projects", href: "/projects", icon: FolderKanban, badge: 12 },
      // Removed Websites since websites are now projects
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

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["SEO Modules", "Operations"]);
  const { projects, selectedProject, setSelectedProject, fetchProjects } = useProject();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      // First, check if user has permission to create projects
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Check user role
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user role:", userError);
        return;
      }

      // If no user data found, use a default role for demo purposes
      if (!userData) {
        console.warn("No user data found, using default role");
        // For demo purposes, continue with project creation
      }

      // Only Super Admin, Admin, and SEO Lead can create projects
      // If no user data, allow for demo purposes
      if (userData) {
        const allowedRoles = ['Super Admin', 'Admin', 'SEO Lead'];
        if (!allowedRoles.includes(userData.role)) {
          console.error("User does not have permission to create projects");
          return;
        }
      } else {
        console.warn("Proceeding with project creation without role check for demo");
      }

      // Create a project in the projects table using admin API client
      const { data: projectData, error: projectError } = await callAdminFunction('create', 'projects', {
        name: newProjectName,
        client: newProjectClient || null,
        status: "active",
        health_score: 70,
      });
      
      if (projectError) throw projectError;
      
      const data = projectData?.data || [];

      if (error) throw error;

      if (data && data[0]) {
        // Also create a website entry for this project
        const { error: websiteError } = await supabase
          .from("websites")
          .insert({
            project_id: data[0].id,
            domain: newProjectName,
            url: newProjectClient || `https://${newProjectName.replace(/\s+/g, '-').toLowerCase()}.com`,
            is_verified: false,
          });

        if (websiteError) {
          console.error("Error creating website:", websiteError);
          // Don't throw here as we still want to select the project
        }

        // Create project membership for the creator
        const { error: memberError } = await supabase
          .from("project_members")
          .insert({
            project_id: data[0].id,
            user_id: user.id,
            role: "owner"
          });

        if (memberError) {
          console.error("Error creating project membership:", memberError);
        }

        // Create default automation rules for the new project
        const defaultRules = [
          {
            project_id: data[0].id,
            name: "Daily ranking sync",
            description: "Sync keyword rankings daily",
            trigger_event: "daily_sync",
            condition: {},
            action: { type: "run_function", name: "rank-checker" }
          },
          {
            project_id: data[0].id,
            name: "Weekly audit",
            description: "Run full SEO audit weekly",
            trigger_event: "weekly_audit",
            condition: {},
            action: { type: "run_function", name: "technical-audit" }
          },
          {
            project_id: data[0].id,
            name: "Backlink monitor",
            description: "Monitor backlinks daily",
            trigger_event: "daily_monitor",
            condition: {},
            action: { type: "run_function", name: "backlink-monitor" }
          },
          {
            project_id: data[0].id,
            name: "Content audit",
            description: "Audit content quality weekly",
            trigger_event: "weekly_content_audit",
            condition: {},
            action: { type: "run_function", name: "content-audit" }
          }
        ];

        const { error: rulesError } = await supabase
          .from("automation_rules")
          .insert(defaultRules);

        if (rulesError) {
          console.error("Error creating default automation rules:", rulesError);
        }

        // Refresh projects list
        await fetchProjects();
        // Select the newly created project
        setSelectedProject(data[0]);
      }

      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectClient("");
    } catch (error) {
      console.error("Error creating project:", error);
    }
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm">
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
              <button className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors">
                <div className="flex items-center gap-2 truncate">
                  <FolderKanban className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedProject ? selectedProject.name : "Select Project"}
                  </span>
                </div>
                <ChevronsUpDown className="w-4 h-4 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-60 overflow-y-auto">
              <DropdownMenuItem onClick={() => setSelectedProject(null)}>
                <span className="font-medium">General Analytics</span>
              </DropdownMenuItem>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={selectedProject?.id === project.id ? "bg-accent" : ""}
                >
                  <span className="truncate">{project.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="w-full text-left flex items-center gap-2 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <span>Create New Project</span>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                      <DialogDescription>
                        Enter the details for your new project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="sidebar-project-name">Project Name</Label>
                        <Input
                          id="sidebar-project-name"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          placeholder="Enter project name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sidebar-project-client">Client / Website URL (Optional)</Label>
                        <Input
                          id="sidebar-project-client"
                          value={newProjectClient}
                          onChange={(e) => setNewProjectClient(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={!newProjectName.trim()}
                      >
                        Create Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
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
          <div className="mt-3 p-3 rounded-xl bg-muted/50 flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">SEO Lead</p>
            </div>
          </div>
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