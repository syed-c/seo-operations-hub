import { useState, useEffect } from "react";
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
import { supabase, ensureSupabase } from "@/lib/supabaseClient";
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
import { useAuth } from "@/components/AuthGate";
import { getNavigationForRole, NavItem as RoleNavItem } from "@/lib/rolePermissions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  allowedRoles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
  allowedRoles?: string[];
}

// Default navigation sections (will be overridden by role-based navigation)
const defaultNavSections: NavSection[] = [
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
      { title: "Backlink Reports", href: "/backlink-reports", icon: Link2 },
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
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const { teamUser } = useAuth();
  const [navSections, setNavSections] = useState<NavSection[]>(defaultNavSections);

  // Update navigation based on user role
  useEffect(() => {
    if (teamUser?.role) {
      const roleBasedNavItems = getNavigationForRole(teamUser.role);

      // Map role-based items to NavSection structure
      const roleBasedSections: NavSection[] = [];

      // Determine which sections to show based on user role
      if (teamUser.role === 'Developer') {
        // For developers, only show specific sections
        roleBasedSections.push({
          title: "SEO Modules",
          items: roleBasedNavItems
            .filter(item => ['Dashboard', 'Projects', 'Pages'].includes(item.title))
            .map(item => ({
              title: item.title,
              href: item.href,
              icon: getIconForTitle(item.title),
            }))
        });

        roleBasedSections.push({
          title: "Operations",
          items: roleBasedNavItems
            .filter(item => ['Tasks', 'Reports', 'Chat'].includes(item.title))
            .map(item => ({
              title: item.title,
              href: item.href,
              icon: getIconForTitle(item.title),
            }))
        });
      } else {
        // For other roles, organize items into appropriate sections
        const quickAccessItems = roleBasedNavItems.filter(item =>
          ['Starred', 'Recent'].includes(item.title)
        ).map(item => ({
          title: item.title,
          href: item.href,
          icon: getIconForTitle(item.title),
        }));

        if (quickAccessItems.length > 0) {
          roleBasedSections.push({
            title: "Quick Access",
            items: quickAccessItems,
          });
        }

        const seoModulesItems = roleBasedNavItems
          .filter(item =>
            ['Dashboard', 'Role Dashboard', 'Projects', 'Pages', 'Keywords', 'Rankings', 'Backlinks', 'Local SEO'].includes(item.title)
          )
          .map(item => ({
            title: item.title,
            href: item.href,
            icon: getIconForTitle(item.title),
          }));

        if (seoModulesItems.length > 0) {
          roleBasedSections.push({
            title: "SEO Modules",
            items: seoModulesItems,
          });
        }

        const operationsItems = roleBasedNavItems
          .filter(item =>
            ['Tasks', 'Automation', 'Reports', 'Backlink Reports', 'Team Chat', 'Team'].includes(item.title)
          )
          .map(item => ({
            title: item.title,
            href: item.href,
            icon: getIconForTitle(item.title),
          }));

        if (operationsItems.length > 0) {
          roleBasedSections.push({
            title: "Operations",
            items: operationsItems,
          });
        }
      }

      setNavSections(roleBasedSections);
    }
  }, [teamUser]);

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  // Helper function to get appropriate icon for title
  const getIconForTitle = (title: string): React.ElementType => {
    switch (title) {
      case 'Dashboard':
      case 'Role Dashboard': return LayoutDashboard;
      case 'Projects': return FolderKanban;
      case 'Pages': return FileText;
      case 'Keywords': return Target;
      case 'Rankings': return TrendingUp;
      case 'Backlinks': return Link2;
      case 'Local SEO': return MapPin;
      case 'Tasks': return ListTodo;
      case 'Automation': return Zap;
      case 'Reports': return BarChart3;
      case 'Backlink Reports': return Link2;
      case 'Team Chat':
      case 'Chat': return MessageSquare;
      case 'Team': return Users;
      case 'Starred': return Star;
      case 'Recent': return Clock;
      case 'Settings': return Settings;
      case 'Websites': return Globe;
      default: return LayoutDashboard; // default icon
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newProjectDescription.trim() || !newProjectClient.trim()) return;

    try {
      // First, check if user has permission to create projects
      const { data: { user } } = await ensureSupabase().auth.getUser();

      if (!user) {
        console.error("User not authenticated");
        return;
      }

      // Check user role
      const { data: userData, error: userError } = await ensureSupabase()
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user role:", userError);
        return;
      }

      // Only Super Admin, Admin, and SEO Lead can create projects
      if (userData) {
        const allowedRoles = ['Super Admin', 'Admin', 'SEO Lead'];
        if (!allowedRoles.includes(userData.role)) {
          console.error("User does not have permission to create projects");
          return;
        }
      } else {
        console.warn("No user role found, proceeding with project creation");
      }

      // 1. Create project in Supabase first
      const { data: newProject, error: createError } = await ensureSupabase()
        .from('projects')
        .insert({
          name: newProjectName,
          client: newProjectClient,
          status: 'active',
          health_score: 70
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating project:", createError);
        return;
      }

      // 1.5 Add user to project_members as owner
      const { error: memberError } = await ensureSupabase()
        .from('project_members')
        .insert({
          project_id: newProject.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) {
        console.error("Error adding project member:", memberError);
        // Continue anyway to send webhook, but warn
      }

      // 2. Call webhook to create project/notify
      // Using hardcoded URL as requested
      const webhookUrl = "https://auton8n.n8n.shivahost.in/webhook/2b740420-f669-42ac-9d10-de506e7dff9b";

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Structure requested by user + description
            name: newProjectName,
            description: newProjectDescription,
            client: newProjectClient,
            status: "active",
            health_score: 70,
            // Additional context
            id: newProject.id,
            created_at: newProject.created_at,
            creator_role: userData?.role
          }),
        });
        console.log("Project creation webhook sent successfully");
      } catch (webhookError) {
        // Log but don't fail, as project is already created
        console.error("Error sending project creation webhook:", webhookError);
      }

      // 3. Success handling
      console.log("Project created successfully");

      // Refresh projects list
      await fetchProjects();

      // Close dialog and reset form
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      setNewProjectClient("");

    } catch (error) {
      console.error("Error in project creation flow:", error);
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
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setIsCreateDialogOpen(true);
                }}
                className="cursor-pointer"
              >
                <div className="w-full text-left flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Create New Project</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {navSections.map((section) => {
          // For developers, hide Quick Access section
          if (teamUser?.role === 'Developer' && section.title === 'Quick Access') {
            return null;
          }

          return (
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
          );
        })}
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
              <AvatarFallback>
                {teamUser?.first_name?.[0] || teamUser?.email?.[0]?.toUpperCase() || "U"}
                {teamUser?.last_name?.[0] || ""}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {teamUser?.first_name && teamUser?.last_name
                  ? `${teamUser.first_name} ${teamUser.last_name}`
                  : teamUser?.email?.split('@')[0] || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">{teamUser?.role || "Member"}</p>
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

      {/* Create Project Dialog - Moved outside DropdownMenu to prevent space key capture */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter the details for your new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sidebar-project-name">Project Name *</Label>
              <Input
                id="sidebar-project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sidebar-project-description">Project Description *</Label>
              <Input
                id="sidebar-project-description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter project description"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sidebar-project-client">Client / Website URL *</Label>
              <Input
                id="sidebar-project-client"
                value={newProjectClient}
                onChange={(e) => setNewProjectClient(e.target.value)}
                placeholder="https://example.com"
                required
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
              disabled={!newProjectName.trim() || !newProjectDescription.trim() || !newProjectClient.trim()}
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}