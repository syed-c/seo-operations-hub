import { Search, Plus, ChevronDown, FolderKanban } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProject } from "@/contexts/ProjectContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { projects, selectedProject, setSelectedProject, fetchProjects } = useProject();
  const navigate = useNavigate();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");

  const handleNewProject = () => {
    navigate("/projects");
  };

  const handleNewWebsite = () => {
    // TODO: Implement new website functionality
    console.log("New website clicked");
  };

  const handleNewKeyword = () => {
    // TODO: Implement new keyword functionality
    console.log("New keyword clicked");
  };

  const handleNewTask = () => {
    navigate("/tasks");
  };

  const handleRunAudit = () => {
    // TODO: Implement run audit functionality
    console.log("Run audit clicked");
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
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 rounded-xl">
              <FolderKanban className="w-4 h-4" />
              <span className="max-w-[150px] truncate">
                {selectedProject ? selectedProject.name : "Select Project"}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 max-h-60 overflow-y-auto">
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
                  <span className="w-full text-left font-medium cursor-pointer">+ Create New Project</span>
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
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="project-client">Client / Website URL (Optional)</Label>
                      <Input
                        id="project-client"
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

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects, keywords..."
            className="w-72 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* New Action */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              New
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleNewProject}>New Project</DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewWebsite}>New Website</DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewKeyword}>New Keyword</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleNewTask}>New Task</DropdownMenuItem>
            <DropdownMenuItem onClick={handleRunAudit}>Run Audit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <NotificationsPanel />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <Avatar className="w-7 h-7">
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Team Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}