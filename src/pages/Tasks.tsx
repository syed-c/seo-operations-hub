import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Filter, MoreHorizontal, Clock, Flag, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-info/10 text-info",
  high: "bg-warning/10 text-warning",
  urgent: "bg-destructive/10 text-destructive",
};

const typeColors = {
  content: "chip-primary",
  technical: "bg-secondary/10 text-secondary",
  backlinks: "chip-success",
  local: "bg-info/10 text-info",
  audit: "bg-muted text-muted-foreground",
  general: "bg-muted text-muted-foreground",
};

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  priority: string | null;
  type: string | null;
  status: string | null;
  due_date: string | null;
  assignee?: {
    id: string;
    name: string;
  } | null;
  task_assignments?: Array<{
    user_id: string;
  }>;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    projectId: "",
    description: "",
    priority: "medium",
    type: "general",
    status: "todo",
    dueDate: "",
    assigneeId: "",
  });
  
  // State for the new task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { teamUser } = useAuth();
  
  // Determine if user has permission to create/edit tasks
  const canCreateEditTasks = teamUser?.role === 'Super Admin' || teamUser?.role === 'Admin' || teamUser?.role === 'SEO Lead' || teamUser?.role === 'Content Lead' || teamUser?.role === 'Backlink Lead' || teamUser?.role === 'Technical SEO';
  
  // Fetch team members to populate assignee dropdown
  const [teamMembers, setTeamMembers] = useState<{id: string, email: string, first_name?: string, last_name?: string, role?: string}[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  
  const loadTeamMembers = async () => {
    if (!canCreateEditTasks) return;
    
    setLoadingTeamMembers(true);
    try {
      // Use admin API to bypass RLS policies
      const adminApiClient = await import('@/lib/adminApiClient');
      const result = await adminApiClient.selectRecords('users', 'id, email, first_name, last_name, role');
      
      if (result?.error) {
        console.error('Error fetching team members:', result.error);
        return;
      }
      
      // Filter out Super Admins to match the same logic as in Projects.tsx
      const allUsers = result.data || [];
      const filteredUsers = allUsers.filter((user: any) => user.role !== 'Super Admin');
      
      setTeamMembers(filteredUsers);
    } catch (error) {
      console.error('Error in loadTeamMembers:', error);
    } finally {
      setLoadingTeamMembers(false);
    }
  };
  
  useEffect(() => {
    if (canCreateEditTasks) {
      loadTeamMembers();
    }
  }, [canCreateEditTasks]);

  const load = async () => {
    setLoading(true);
    try {
      // First, get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      // Check user role
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      
      if (roleError) {
        setError(roleError.message);
        setLoading(false);
        return;
      }
      
      let query;
      
      if (userData?.role === 'Developer') {
        // For developers, fetch only tasks from assigned projects
        // First, get the project IDs assigned to the user
        const { data: projectMemberData, error: projectMemberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (projectMemberError) {
          setError(projectMemberError.message);
          setLoading(false);
          return;
        }
        
        if (!projectMemberData || projectMemberData.length === 0) {
          // No projects assigned to this user
          setTasks([]);
          setLoading(false);
          return;
        }
        
        // Extract project IDs
        const projectIds = projectMemberData.map(pm => pm.project_id);
        
        // Then fetch the tasks for those projects
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            id, 
            title, 
            description, 
            status, 
            priority, 
            type, 
            due_date, 
            project_id, 
            task_assignments(user_id)
          `)
          .in('project_id', projectIds)
          .order('created_at', { ascending: false });
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        
        setTasks(data || []);
      } else {
        // For other roles, fetch all tasks
        const { data, error } = await supabase
          .from('tasks')
          .select('id, title, description, status, priority, type, due_date, project_id, task_assignments(user_id)')
          .order('created_at', { ascending: false });
        
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        
        // Process the tasks data to include assignee information
        const tasksWithAssignees = await Promise.all((data || []).map(async (t) => {
          // Get the assignee user details if assigned
          let assigneeInfo = null;
          if (t.task_assignments && t.task_assignments.length > 0) {
            const assigneeId = t.task_assignments[0]?.user_id;
            if (assigneeId) {
              // Try to find the assignee in teamMembers first
              const localAssignee = teamMembers.find(user => user.id === assigneeId);
              if (localAssignee) {
                assigneeInfo = localAssignee;
              } else {
                // If not found locally, fetch from admin API
                try {
                  const adminApiClient = await import('@/lib/adminApiClient');
                  const result = await adminApiClient.selectRecords('users', 'id, email, first_name, last_name', { id: assigneeId });
                  if (result?.data && result.data.length > 0) {
                    assigneeInfo = result.data[0];
                  }
                } catch (error) {
                  console.error('Error fetching assignee details:', error);
                }
              }
            }
          }
          
          return {
            ...t,
            assignee: assigneeInfo ? {
              id: assigneeInfo.id,
              name: (assigneeInfo.first_name || assigneeInfo.last_name)
                ? `${assigneeInfo.first_name || ''} ${assigneeInfo.last_name || ''}`.trim()
                : assigneeInfo.email
            } : null,
          };
        }));
        
        setTasks(tasksWithAssignees);
      }
      
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    console.log('onCreate called', form); // Debug log
    if (!form.title.trim()) {
      console.log('Task title is required'); // Debug log
      setError('Task title is required');
      return;
    }
    
    // Clear any previous errors
    setError('');
    
    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: form.title,
          project_id: form.projectId || null,
          description: form.description,
          status: form.status,
          priority: form.priority,
          type: form.type,
          due_date: form.dueDate || null,
        })
        .select("id")
        .single();
      
      if (error) {
        console.error('Error creating task:', error); // Debug log
        setError(error.message);
        return;
      }
      
      console.log('Task created successfully:', data); // Debug log
      
      // Create task assignment if an assignee was selected
      if (form.assigneeId && form.assigneeId !== 'unassigned') {
        const assignmentResult = await supabase.from("task_assignments").insert({ 
          task_id: data?.id, 
          user_id: form.assigneeId 
        });
        
        if (assignmentResult.error) {
          console.error('Error creating task assignment:', assignmentResult.error); // Debug log
        }
      } else {
        // Create assignment with null user if no assignee was selected
        const assignmentResult = await supabase.from("task_assignments").insert({ 
          task_id: data?.id, 
          user_id: null 
        });
        
        if (assignmentResult.error) {
          console.error('Error creating task assignment:', assignmentResult.error); // Debug log
        }
      }
      
      setForm({ 
        title: "", 
        projectId: "", 
        description: "", 
        priority: "medium", 
        type: "general", 
        status: "todo", 
        dueDate: "",
        assigneeId: ""
      });
      
      console.log('Form reset and reloading tasks'); // Debug log
      load();
    } catch (err) {
      console.error('Unexpected error in onCreate:', err); // Debug log
      setError(err instanceof Error ? err.message : 'An error occurred while creating the task');
    }
  };

  const onDelete = async (id: string) => {
    await supabase.from("task_assignments").delete().eq("task_id", id);
    await supabase.from("tasks").delete().eq("id", id);
    load();
  };

  const onUpdateStatus = async (task: TaskRecord, status: string) => {
    await supabase.from("tasks").update({ status }).eq("id", task.id);
    load();
  };

  const grouped: Record<string, TaskRecord[]> = {
    todo: [],
    "in-progress": [],
    review: [],
    done: [],
  };
  tasks.forEach((t) => {
    const key = (t.status as string) || "todo";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  return (
    <MainLayout>
      <Header title="Tasks" subtitle="Manage and track all SEO tasks across projects" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-64 h-10 pl-10 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
        {canCreateEditTasks && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Button className="gap-2 rounded-xl" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign New Task</DialogTitle>
              <DialogDescription>Create and assign a new task to a team member</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={form.title ? '' : 'border-destructive'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-project">Project ID</Label>
                <Input
                  id="task-project"
                  placeholder="Enter project ID"
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Input
                  id="task-description"
                  placeholder="Enter task description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-type">Type</Label>
                  <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="content">Content</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="backlinks">Backlinks</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="audit">Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assign To</Label>
                <Select 
                  value={form.assigneeId || 'unassigned'} 
                  onValueChange={(value) => setForm({ ...form, assigneeId: value === 'unassigned' ? '' : value })}
                  disabled={loadingTeamMembers}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a team member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {loadingTeamMembers && (
                      <SelectItem value="loading" disabled>
                        Loading team members...
                      </SelectItem>
                    )}
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {(member.first_name || member.last_name) 
                          ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                          : member.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsModalOpen(false);
                setForm({
                  title: "",
                  projectId: "",
                  description: "",
                  priority: "medium",
                  type: "general",
                  status: "todo",
                  dueDate: "",
                  assigneeId: "",
                });
              }}>
                Cancel
              </Button>
              <Button onClick={onCreate}>Assign Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-3">Loading...</p>}
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid grid-cols-4 gap-5">
        {["todo", "in-progress", "review", "done"].map((col) => {
          const columnTitle =
            col === "todo" ? "To Do" : col === "in-progress" ? "In Progress" : col === "review" ? "In Review" : "Completed";
          const color =
            col === "todo" ? "bg-muted" : col === "in-progress" ? "bg-info" : col === "review" ? "bg-warning" : "bg-success";
          const items = grouped[col] || [];
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", color)} />
                  <h3 className="font-medium">{columnTitle}</h3>
                  <span className="text-sm text-muted-foreground">({items.length})</span>
                </div>
                <button className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-3">
                {items.map((task, index) => (
                  <div
                    key={task.id}
                    className="glass-card p-4 animate-slide-up hover:shadow-card-hover transition-all cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={cn("chip text-xs", typeColors[(task.type as string) || "general"] || "chip")}>
                        {task.type || "general"}
                      </span>
                      <span className={cn("chip text-xs", priorityColors[(task.priority as string) || "medium"] || "chip")}>
                        <Flag className="w-3 h-3" />
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Project: <span className="text-foreground">{task.project_id || "—"}</span>
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">{task.assignee ? task.assignee.name : "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {task.due_date ? task.due_date.slice(0, 10) : "No due date"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {canCreateEditTasks && (
                      <select
                        className="h-9 rounded-xl border border-border bg-card px-2 text-xs"
                        value={task.status || "todo"}
                        onChange={(e) => onUpdateStatus(task, e.target.value)}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                      )}
                      {canCreateEditTasks && (
                      <button
                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
