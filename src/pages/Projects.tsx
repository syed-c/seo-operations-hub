import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Globe, Plus, Search, Filter, MoreVertical, TrendingUp, Users, Calendar, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase, ensureSupabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProjectRecord = {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
};

const statusColors = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-muted text-muted-foreground",
  critical: "bg-destructive/10 text-destructive",
};

export default function Projects() {
  const queryClient = useQueryClient();
  const { teamUser } = useAuth();
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [health, setHealth] = useState(70);
  const [status, setStatus] = useState("active");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [projectMembers, setProjectMembers] = useState<any[]>([]); // Track current project members
  const [selectedProjectMemberId, setSelectedProjectMemberId] = useState<string | null>(null);
  
  // Determine if user has permission to create/edit projects
  const canCreateEditProjects = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead';
  console.log('Team user role:', teamUser?.role, 'Can create/edit projects:', canCreateEditProjects); // Debug log

  // Fetch team members for project assignment
  const { data: teamMembers = [], isLoading: teamMembersLoading, error: teamMembersError } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      console.log('Fetching team members...'); // Debug log
      // Use admin API to fetch users since RLS restricts direct access to users table
      try {
        const adminApiClient = await import('@/lib/adminApiClient');
        const result = await adminApiClient.selectRecords('users', 'id, email, first_name, last_name, role');
        
        if (result?.error) {
          console.error('Admin API error:', result.error);
          throw new Error(result.error);
        }
        
        if (!result || !result.data) {
          console.warn('No data returned from admin API');
          return [];
        }
        
        console.log('Raw team members data:', result.data); // Debug log
        // Filter out Super Admins on the client side since the Edge Function only supports equality filters
        const filteredUsers = result.data.filter(user => user && user.role !== 'Super Admin');
        console.log('Filtered team members:', filteredUsers); // Debug log
        return filteredUsers;
      } catch (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }
    },
    enabled: canCreateEditProjects
  });

  // Log for debugging
  if (canCreateEditProjects && teamMembersError) {
    console.error('Team members query error:', teamMembersError);
  }

  // Fetch projects with React Query based on user role
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      if (teamUser?.role === 'Developer') {
        // For developers, fetch only assigned projects
        const { data: { user } } = await ensureSupabase().auth.getUser();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        const { data, error } = await ensureSupabase()
          .from('projects')
          .select(`
            projects.id, 
            projects.name, 
            projects.client, 
            projects.status, 
            projects.health_score, 
            projects.created_at
          `)
          .join('project_members', 'projects.id', 'project_members.project_id')
          .eq('project_members.user_id', user.id);
          
        if (error) throw new Error(error.message);
        return data || [];
      } else {
        // For other roles, fetch all projects
        const { data, error } = await ensureSupabase()
          .from("projects")
          .select("id, name, client, status, health_score, created_at")
          .order("created_at", { ascending: false });
        
        if (error) throw new Error(error.message);
        return data || [];
      }
    }
  });

  // Mutation for creating a project
  const createProjectMutation = useMutation({
    mutationFn: async (newProject: Partial<ProjectRecord>) => {
      const { error } = await ensureSupabase().from("projects").insert(newProject);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // Reset form
      setName("");
      setClient("");
      setHealth(70);
      setStatus("active");
    }
  });

  // Mutation for deleting a project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await ensureSupabase().from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Mutation for updating a project
  const updateProjectMutation = useMutation({
    mutationFn: async (updatedProject: ProjectRecord) => {
      const { error } = await ensureSupabase()
        .from("projects")
        .update({ 
          status: updatedProject.status, 
          health_score: updatedProject.health_score, 
          client: updatedProject.client, 
          name: updatedProject.name 
        })
        .eq("id", updatedProject.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Mutation for assigning a project to a user
  const assignProjectMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: string; userId: string }) => {
      const { error } = await ensureSupabase()
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role: 'member' })
        .select()
        .single();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      
      // Update project members state to reflect the new assignment
      if (selectedProjectId && selectedUserId) {
        const selectedUser = teamMembers.find(user => user.id === selectedUserId);
        console.log('Adding new project member:', selectedUser); // Debug log
        if (selectedUser) {
          setProjectMembers(prev => [
            ...prev,
            {
              id: Date.now().toString(), // Temporary ID until we refetch
              user_id: selectedUser.id,
              email: selectedUser.email || '',
              first_name: selectedUser.first_name || '',
              last_name: selectedUser.last_name || ''
            }
          ]);
        }
      }
      
      setAssignDialogOpen(false);
      setSelectedProjectId(null);
      setSelectedUserId("");
    },
    onError: (error) => {
      console.error('Error assigning project member:', error);
      // Check if it's a unique constraint violation (user already assigned)
      if (error.message.includes('duplicate key value violates unique constraint') || error.message.includes('project_members_project_id_user_id_key')) {
        alert('This user is already assigned to this project.');
      }
    }
  });

  const onCreate = () => {
    if (!name) return;
    createProjectMutation.mutate({
      name,
      client,
      status,
      health_score: health,
    });
  };

  const onDelete = (id: string) => {
    deleteProjectMutation.mutate(id);
  };

  const onUpdate = (project: ProjectRecord) => {
    updateProjectMutation.mutate(project);
  };

  const handleAssignProject = () => {
    if (selectedProjectId && selectedUserId && selectedUserId !== 'error' && selectedUserId !== 'loading' && selectedUserId !== 'no-members') {
      assignProjectMutation.mutate({ projectId: selectedProjectId, userId: selectedUserId });
    }
  };

  const handleDeleteProject = () => {
    if (selectedProjectId) {
      deleteProjectMutation.mutate(selectedProjectId);
      setDeleteDialogOpen(false);
      setSelectedProjectId(null);
    }
  };

  const openAssignDialog = async (projectId: string) => {
    setSelectedProjectId(projectId);
    
    // Fetch current project members
    try {
      console.log('Fetching project members for project:', projectId); // Debug log
      
      // First, get the project members
      const { data: projectMembersData, error: projectMembersError } = await ensureSupabase()
        .from('project_members')
        .select('id, user_id')
        .eq('project_id', projectId);
      
      if (projectMembersError) {
        console.error('Error fetching project members:', projectMembersError);
        throw projectMembersError;
      }
      
      console.log('Project members data:', projectMembersData); // Debug log
      
      if (!projectMembersData || projectMembersData.length === 0) {
        setProjectMembers([]);
        return;
      }
      
      // Extract user IDs to fetch user details
      const userIds = projectMembersData.map(pm => pm.user_id);
      console.log('User IDs to fetch:', userIds); // Debug log
      
      // Then fetch user details separately
      const { data: usersData, error: usersError } = await ensureSupabase()
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching users data:', usersError);
        throw usersError;
      }
      
      console.log('Users data:', usersData); // Debug log
      
      // Combine the data
      const combinedData = projectMembersData.map(pm => {
        const user = usersData?.find(u => u.id === pm.user_id);
        console.log('Mapping user:', pm, 'with user data:', user); // Debug log
        return {
          id: pm.id,
          user_id: pm.user_id,
          email: user?.email || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || ''
        };
      });
      
      console.log('Combined data:', combinedData); // Debug log
      setProjectMembers(combinedData || []);
    } catch (error) {
      console.error('Error fetching project members:', error);
      setProjectMembers([]);
    }
    
    setAssignDialogOpen(true);
  };

  const openDeleteDialog = (projectId: string) => {
    setSelectedProjectId(projectId);
    setDeleteDialogOpen(true);
  };
  
  // Mutation for removing a project member
  const removeProjectMemberMutation = useMutation({
    mutationFn: async ({ projectMemberId, userId }: { projectMemberId: string; userId: string }) => {
      const { error } = await ensureSupabase()
        .from('project_members')
        .delete()
        .eq('id', projectMemberId)
        .eq('user_id', userId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      console.log('Removing project member with ID:', selectedProjectMemberId); // Debug log
      // Update local state
      setProjectMembers(prev => prev.filter(pm => pm.id !== selectedProjectMemberId));
      setSelectedProjectMemberId(null);
    }
  });
  
  const handleRemoveProjectMember = (projectMemberId: string, userId: string) => {
    setSelectedProjectMemberId(projectMemberId);
    removeProjectMemberMutation.mutate({ projectMemberId, userId });
  };

  const filtered = useMemo(() => projects, [projects]);

  return (
    <MainLayout>
      <Header title="Projects" subtitle="Manage all your SEO projects" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="w-64 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        {canCreateEditProjects && (
        <div className="flex items-center gap-3">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
          <input
            type="number"
            className="h-10 w-20 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Health"
            value={health}
            onChange={(e) => setHealth(Number(e.target.value))}
          />
          <Button 
            className="gap-2 rounded-xl" 
            onClick={onCreate}
            disabled={createProjectMutation.isPending}
          >
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
        )}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground mb-4">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-4">Error: {error.message}</p>}
      {createProjectMutation.isError && <p className="text-sm text-destructive mb-4">Error: {createProjectMutation.error.message}</p>}

      <div className="grid grid-cols-2 gap-5">
        {filtered.map((project, index) => (
          <div
            key={project.id}
            className="glass-card p-5 animate-slide-up hover:shadow-card-hover transition-all cursor-pointer group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  {canCreateEditProjects ? (
                    <>
                      <input
                        className="font-semibold bg-transparent outline-none"
                        value={project.name}
                        onChange={(e) => {
                          const updatedProjects = projects.map(p => 
                            p.id === project.id ? { ...p, name: e.target.value } : p
                          );
                          // Optimistic update
                          queryClient.setQueryData(['projects'], updatedProjects);
                        }}
                      />
                      <input
                        className="text-sm text-muted-foreground bg-transparent outline-none"
                        value={project.client ?? ""}
                        onChange={(e) => {
                          const updatedProjects = projects.map(p => 
                            p.id === project.id ? { ...p, client: e.target.value } : p
                          );
                          // Optimistic update
                          queryClient.setQueryData(['projects'], updatedProjects);
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="font-semibold">{project.name}</div>
                      <div className="text-sm text-muted-foreground">{project.client ?? ""}</div>
                    </>
                  )}
                </div>
              </div>
              {canCreateEditProjects && (
              <div className="flex items-center gap-2">
                <select
                  className={cn("chip text-xs capitalize bg-muted text-foreground")}
                  value={project.status ?? "active"}
                  onChange={(e) => {
                    const updatedProjects = projects.map(p => 
                      p.id === project.id ? { ...p, status: e.target.value } : p
                    );
                    // Optimistic update
                    queryClient.setQueryData(['projects'], updatedProjects);
                  }}
                >
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                  <option value="critical">critical</option>
                </select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                      disabled={deleteProjectMutation.isPending}
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => openAssignDialog(project.id)} className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Assign Project
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteDialog(project.id)} className="flex items-center gap-2 text-destructive">
                      <Trash2 className="w-4 h-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              )}
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <input
                  type="number"
                  className="text-sm font-semibold w-20 bg-transparent outline-none"
                  value={project.health_score ?? 0}
                  onChange={(e) => {
                    const updatedProjects = projects.map(p => 
                      p.id === project.id ? { ...p, health_score: Number(e.target.value) } : p
                    );
                    // Optimistic update
                    queryClient.setQueryData(['projects'], updatedProjects);
                  }}
                />
              </div>
              <Progress
                value={project.health_score ?? 0}
                className="h-2"
                indicatorClassName={cn(
                  (project.health_score ?? 0) >= 80 && "bg-success",
                  (project.health_score ?? 0) >= 60 && (project.health_score ?? 0) < 80 && "bg-warning",
                  (project.health_score ?? 0) < 60 && "bg-destructive"
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Keywords</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <p className="text-lg font-semibold">—</p>
                <p className="text-xs text-muted-foreground">Backlinks</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-lg font-semibold">—</p>
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Avg. Pos</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  <Avatar className="w-7 h-7 border-2 border-card">
                    <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" />
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              {canCreateEditProjects && (
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl" 
                onClick={() => onUpdate(project)}
                disabled={updateProjectMutation.isPending}
              >
                Save
              </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Assign Project Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Project</DialogTitle>
            <DialogDescription>
              Select a team member to assign this project to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assign-user">Select Team Member</Label>
              
              {/* Show already assigned members */}
              {projectMembers.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground mb-1">Assigned members:</p>
                  <div className="flex flex-wrap gap-2">
                    {projectMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1 text-sm">
                        <span>
                          {(member.first_name && member.first_name.trim() !== '') || (member.last_name && member.last_name.trim() !== '')
                            ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                            : member.email}
                        </span>
                        <button 
                          type="button" 
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleRemoveProjectMember(member.id, member.user_id)}
                          aria-label="Remove member"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Select value={selectedUserId} onValueChange={(value) => {
                // Only update if the value is a valid user ID (not one of our disabled options)
                if (value !== 'error' && value !== 'loading' && value !== 'no-members') {
                  setSelectedUserId(value);
                }
              }}>
                <SelectTrigger id="assign-user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembersError ? (
                    <SelectItem value="error" disabled>
                      Error loading team members
                    </SelectItem>
                  ) : teamMembersLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading team members...
                    </SelectItem>
                  ) : teamMembers.length > 0 ? (
                    teamMembers
                      .filter(user => !projectMembers.some(pm => pm.user_id === user.id)) // Filter out already assigned users
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.email}
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="no-members" disabled>
                      No team members available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              {/* Show message when all team members are already assigned */}
              {teamMembers.length > 0 && 
                teamMembers.filter(user => !projectMembers.some(pm => pm.user_id === user.id)).length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">All team members are already assigned to this project</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAssignDialogOpen(false);
                setSelectedProjectId(null);
                setSelectedUserId("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignProject} 
              disabled={!selectedUserId || selectedUserId === 'error' || selectedUserId === 'loading' || selectedUserId === 'no-members' || assignProjectMutation.isPending}
            >
              {assignProjectMutation.isPending ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Project Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedProjectId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject} 
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
