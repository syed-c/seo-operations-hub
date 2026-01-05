import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Clock,
  Flag,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthGate";
import { useProject } from "@/contexts/ProjectContext";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  projectName?: string | null;
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
  const { selectedProject } = useProject();

  // Determine if user has permission to create/edit tasks
  const canCreateEditTasks =
    teamUser?.role === "Super Admin" ||
    teamUser?.role === "Admin" ||
    teamUser?.role === "SEO Lead" ||
    teamUser?.role === "Content Lead" ||
    teamUser?.role === "Backlink Lead" ||
    teamUser?.role === "Technical SEO";

  // Fetch team members to populate assignee dropdown
  const [teamMembers, setTeamMembers] = useState<
    {
      id: string;
      email: string;
      first_name?: string;
      last_name?: string;
      role?: string;
    }[]
  >([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);

  const loadTeamMembers = async () => {
    if (!canCreateEditTasks) return;

    setLoadingTeamMembers(true);
    try {
      // Use admin API to bypass RLS policies
      const adminApiClient = await import("@/lib/adminApiClient");
      const result = await adminApiClient.selectRecords(
        "users",
        "id, email, first_name, last_name, role"
      );

      if (result?.error) {
        console.error("Error fetching team members:", result.error);
        return;
      }

      // Filter out Super Admins to match the same logic as in Projects.tsx
      const allUsers = result.data || [];
      const filteredUsers = allUsers.filter(
        (user: any) => user.role !== "Super Admin"
      );

      setTeamMembers(filteredUsers);
    } catch (error) {
      console.error("Error in loadTeamMembers:", error);
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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("User not authenticated");
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

      if (userData?.role === "Developer") {
        // For developers, fetch only tasks from assigned projects
        // First, get the project IDs assigned to the user
        const { data: projectMemberData, error: projectMemberError } =
          await supabase
            .from("project_members")
            .select("project_id")
            .eq("user_id", user.id);

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
        const projectIds = projectMemberData.map((pm) => pm.project_id);

        // Then fetch the tasks for those projects
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(
            `id, title, description, status, priority, type, due_date, project_id`
          )
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        if (tasksError) {
          setError(tasksError.message);
          setLoading(false);
          return;
        }
        
        // Fetch task assignments separately
        let taskAssignments = [];
        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map(t => t.id);
          console.log('Fetching assignments for task IDs:', taskIds);
          
          // For developers, first try to fetch assignments for their tasks
          // Try with regular supabase client first
          try {
            const { data: assignmentsData, error: assignmentsError } = await supabase
              .from('task_assignments')
              .select('task_id, user_id')
              .in('task_id', taskIds);
            
            if (assignmentsError) {
              console.error('Error fetching task assignments with regular client:', assignmentsError);
            } else {
              taskAssignments = assignmentsData || [];
              console.log('Fetched assignments with regular client:', taskAssignments);
            }
          } catch (error) {
            console.error('Error with regular client for task assignments:', error);
          }
          
          // If no assignments found with regular client, try admin API as fallback
          if (taskAssignments.length === 0) {
            try {
              // Use admin API to fetch task assignments
              const adminApiClient = await import('@/lib/adminApiClient');
              
              // Since adminApiClient.selectRecords might not support .in() syntax,
              // we'll use a different approach - fetch all and filter client-side
              const allAssignmentsResult = await adminApiClient.selectRecords('task_assignments', 'task_id, user_id');
              
              if (allAssignmentsResult?.error) {
                console.error('Error fetching all task assignments:', allAssignmentsResult.error);
              } else {
                // Filter the assignments to only include those for our tasks
                taskAssignments = (allAssignmentsResult.data || []).filter(assignment => 
                  taskIds.includes(assignment.task_id)
                );
                console.log('Fetched assignments with admin API:', taskAssignments);
              }
            } catch (error) {
              console.error('Error in admin API call for task assignments:', error);
              
              // If both fail, assignments remain as empty array
            }
          }
        }
        
        // Process the tasks data to include assignee and project information for developers
        const tasksWithDetails = await Promise.all((tasksData || []).map(async (t) => {
          // Find all assignments for this task
          const taskAssignmentsForTask = taskAssignments.filter(assignment => assignment.task_id === t.id);
          // Use the first assignment if there are any
          const taskAssignment = taskAssignmentsForTask.length > 0 ? taskAssignmentsForTask[0] : null;
          
          console.log('Task:', t.id, 'Assignments found:', taskAssignmentsForTask.length, 'Assignment:', taskAssignment);
          
          // Get the assignee user details if assigned
          let assigneeInfo = null;
          if (taskAssignment && taskAssignment.user_id) {
            // Try to find the assignee in teamMembers first
            const localAssignee = teamMembers.find(user => user.id === taskAssignment.user_id);
            if (localAssignee) {
              assigneeInfo = localAssignee;
            } else {
              // If not found locally, fetch from admin API
              try {
                const adminApiClient = await import('@/lib/adminApiClient');
                const result = await adminApiClient.selectRecords('users', 'id, email, first_name, last_name', { id: taskAssignment.user_id });
                if (result?.data && result.data.length > 0) {
                  assigneeInfo = result.data[0];
                  console.log('Fetched assignee info:', assigneeInfo);
                }
              } catch (error) {
                console.error('Error fetching assignee details:', error);
              }
            }
          }
                  
          // Get project name if project_id exists
          let projectName = null;
          if (t.project_id) {
            try {
              const adminApiClient = await import('@/lib/adminApiClient');
              const result = await adminApiClient.selectRecords('projects', 'name', { id: t.project_id });
              if (result?.data && result.data.length > 0) {
                projectName = result.data[0].name;
              } else {
                console.warn('No project found for ID:', t.project_id);
              }
            } catch (error) {
              console.error('Error fetching project name:', error);
            }
          }
                  
          const assigneeResult = assigneeInfo ? {
            id: assigneeInfo.id,
            name: (assigneeInfo.first_name || assigneeInfo.last_name)
              ? `${assigneeInfo.first_name || ''} ${assigneeInfo.last_name || ''}`.trim()
              : assigneeInfo.email
          } : null;
          
          console.log('Task:', t.id, 'Final assignee result:', assigneeResult);
          
          return {
            ...t,
            assignee: assigneeResult,
            projectName: projectName || null,
            // Add task_assignments for compatibility
            task_assignments: taskAssignment ? [{ user_id: taskAssignment.user_id }] : [],
          };
        }));
                
        setTasks(tasksWithDetails);
      } else {
        // For other roles, fetch all tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select(
            "id, title, description, status, priority, type, due_date, project_id"
          )
          .order("created_at", { ascending: false });

        if (tasksError) {
          setError(tasksError.message);
          setLoading(false);
          return;
        }
        
        // Fetch task assignments separately
        let taskAssignments = [];
        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map(t => t.id);
          console.log('Fetching assignments for task IDs:', taskIds);
          
          try {
            // Use admin API to fetch task assignments
            const adminApiClient = await import('@/lib/adminApiClient');
            
            // Since adminApiClient.selectRecords might not support .in() syntax,
            // we'll use a different approach - fetch all and filter client-side
            const allAssignmentsResult = await adminApiClient.selectRecords('task_assignments', 'task_id, user_id');
            
            if (allAssignmentsResult?.error) {
              console.error('Error fetching all task assignments:', allAssignmentsResult.error);
            } else {
              // Filter the assignments to only include those for our tasks
              taskAssignments = (allAssignmentsResult.data || []).filter(assignment => 
                taskIds.includes(assignment.task_id)
              );
              console.log('Fetched assignments:', taskAssignments);
            }
          } catch (error) {
            console.error('Error in admin API call for task assignments:', error);
            
            // Fallback to regular supabase client if admin API fails
            const { data: assignmentsData, error: assignmentsError } = await supabase
              .from('task_assignments')
              .select('task_id, user_id')
              .in('task_id', taskIds);
            
            if (assignmentsError) {
              console.error('Error fetching task assignments:', assignmentsError);
            } else {
              taskAssignments = assignmentsData || [];
              console.log('Fetched assignments with fallback:', taskAssignments);
            }
          }
        }
        
        // Process the tasks data to include assignee and project information
        const tasksWithDetails = await Promise.all(
          (tasksData || []).map(async (t) => {
            // Find all assignments for this task
            const taskAssignmentsForTask = taskAssignments.filter(assignment => assignment.task_id === t.id);
            // Use the first assignment if there are any
            const taskAssignment = taskAssignmentsForTask.length > 0 ? taskAssignmentsForTask[0] : null;
            
            console.log('Task:', t.id, 'Assignments found:', taskAssignmentsForTask.length, 'Assignment:', taskAssignment);
            
            // Get the assignee user details if assigned
            let assigneeInfo = null;
            if (taskAssignment && taskAssignment.user_id) {
              // Try to find the assignee in teamMembers first
              const localAssignee = teamMembers.find(
                (user) => user.id === taskAssignment.user_id
              );
              if (localAssignee) {
                assigneeInfo = localAssignee;
              } else {
                // If not found locally, fetch from admin API
                try {
                  const adminApiClient = await import("@/lib/adminApiClient");
                  const result = await adminApiClient.selectRecords(
                    "users",
                    "id, email, first_name, last_name",
                    { id: taskAssignment.user_id }
                  );
                  if (result?.data && result.data.length > 0) {
                    assigneeInfo = result.data[0];
                    console.log('Fetched assignee info:', assigneeInfo);
                  }
                } catch (error) {
                  console.error("Error fetching assignee details:", error);
                }
              }
            }

            // Get project name if project_id exists
            let projectName = null;
            if (t.project_id) {
              try {
                const adminApiClient = await import("@/lib/adminApiClient");
                const result = await adminApiClient.selectRecords(
                  "projects",
                  "name",
                  { id: t.project_id }
                );
                if (result?.data && result.data.length > 0) {
                  projectName = result.data[0].name;
                }
              } catch (error) {
                console.error("Error fetching project name:", error);
              }
            }

            const assigneeResult = assigneeInfo
              ? {
                  id: assigneeInfo.id,
                  name:
                    assigneeInfo.first_name || assigneeInfo.last_name
                      ? `${assigneeInfo.first_name || ""} ${
                          assigneeInfo.last_name || ""
                        }`.trim()
                      : assigneeInfo.email,
                }
              : null;
            
            console.log('Task:', t.id, 'Final assignee result:', assigneeResult);
            
            return {
              ...t,
              assignee: assigneeResult,
              projectName: projectName || null,
              // Add task_assignments for compatibility
              task_assignments: taskAssignment ? [{ user_id: taskAssignment.user_id }] : [],
            };
          })
        );

        setTasks(tasksWithDetails);
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
    console.log("onCreate called", form); // Debug log
    if (!form.title.trim()) {
      console.log("Task title is required"); // Debug log
      setError("Task title is required");
      return;
    }

    // Clear any previous errors
    setError("");

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
        console.error("Error creating task:", error); // Debug log
        setError(error.message);
        return;
      }

      console.log("Task created successfully:", data); // Debug log

      // Create task assignment if an assignee was selected
      if (form.assigneeId && form.assigneeId !== "unassigned") {
        // Use admin API to bypass RLS policies
        const adminApiClient = await import("@/lib/adminApiClient");
        const assignmentResult = await adminApiClient.createRecord(
          "task_assignments",
          {
            task_id: data?.id,
            user_id: form.assigneeId,
          }
        );

        if (assignmentResult?.error) {
          console.error(
            "Error creating task assignment:",
            assignmentResult.error
          ); // Debug log
        }
      } else {
        // Create assignment with null user if no assignee was selected
        const adminApiClient = await import("@/lib/adminApiClient");
        const assignmentResult = await adminApiClient.createRecord(
          "task_assignments",
          {
            task_id: data?.id,
            user_id: null,
          }
        );

        if (assignmentResult?.error) {
          console.error(
            "Error creating task assignment:",
            assignmentResult.error
          ); // Debug log
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
        assigneeId: "",
      });

      console.log("Form reset and reloading tasks"); // Debug log

      // Close the modal after successful creation
      setIsModalOpen(false);

      load();
    } catch (err) {
      console.error("Unexpected error in onCreate:", err); // Debug log
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while creating the task"
      );
    }
  };

  const onDelete = async (id: string) => {
    try {
      // Use admin API to bypass RLS policies
      const adminApiClient = await import("@/lib/adminApiClient");
      await adminApiClient.deleteRecords("task_assignments", { task_id: id });
      await adminApiClient.deleteRecords("tasks", { id });
    } catch (error) {
      console.error("Error deleting task:", error);
      // Fallback to regular supabase client if admin API fails
      await supabase.from("task_assignments").delete().eq("task_id", id);
      await supabase.from("tasks").delete().eq("id", id);
    }
    load();
  };

  const onUpdateStatus = async (task: TaskRecord, status: string) => {
    // If moving to review status, call webhook
    if (status === 'review' && task.status !== 'review') {
      try {
        const webhookUrl = import.meta.env.VITE_TASK_REVIEW_WEBHOOK_URL;
        if (webhookUrl) {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId: task.id,
              title: task.title,
              description: task.description,
              status: status,
              projectId: task.project_id,
              assignee: task.assignee,
            }),
          });
          
          if (!response.ok) {
            console.error('Webhook call failed:', response.status, response.statusText);
          } else {
            console.log('Webhook called successfully for task review');
          }
        }
      } catch (error) {
        console.error('Error calling webhook:', error);
      }
    }
    
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
      <Header
        title="Tasks"
        subtitle="Manage and track all SEO tasks across projects"
      />

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
            <Button
              className="gap-2 rounded-xl"
              onClick={() => {
                // Set the selected project ID when opening the modal
                setIsModalOpen(true);
                setForm((prev) => ({
                  ...prev,
                  projectId: selectedProject?.id || "",
                }));
              }}
            >
              <Plus className="w-4 h-4" />
              New Task
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Assign New Task</DialogTitle>
                <DialogDescription>
                  Create and assign a new task to a team member
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    placeholder="Enter task title"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className={form.title ? "" : "border-destructive"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-project">Project ID</Label>
                  <Input
                    id="task-project"
                    placeholder="Auto-filled from selected project"
                    value={form.projectId}
                    onChange={(e) =>
                      setForm({ ...form, projectId: e.target.value })
                    }
                    readOnly
                    className="cursor-not-allowed opacity-75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Description</Label>
                  <Input
                    id="task-description"
                    placeholder="Enter task description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priority</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) =>
                        setForm({ ...form, priority: value })
                      }
                    >
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
                    <Select
                      value={form.type}
                      onValueChange={(value) =>
                        setForm({ ...form, type: value })
                      }
                    >
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
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Assign To</Label>
                  <Select
                    value={form.assigneeId || "unassigned"}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        assigneeId: value === "unassigned" ? "" : value,
                      })
                    }
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
                          {member.first_name || member.last_name
                            ? `${member.first_name || ""} ${
                                member.last_name || ""
                              }`.trim()
                            : member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
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
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={onCreate}>Assign Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground mb-3">Loading...</p>
      )}
      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid grid-cols-4 gap-5">
        {["todo", "in-progress", "review", "done"].map((col) => {
          const columnTitle =
            col === "todo"
              ? "To Do"
              : col === "in-progress"
              ? "In Progress"
              : col === "review"
              ? "In Review"
              : "Completed";
          const color =
            col === "todo"
              ? "bg-muted"
              : col === "in-progress"
              ? "bg-info"
              : col === "review"
              ? "bg-warning"
              : "bg-success";
          const items = grouped[col] || [];
          return (
            <div key={col} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", color)} />
                  <h3 className="font-medium">{columnTitle}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({items.length})
                  </span>
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
                      <span
                        className={cn(
                          "chip text-xs",
                          typeColors[(task.type as string) || "general"] ||
                            "chip"
                        )}
                      >
                        {task.type || "general"}
                      </span>
                      <span
                        className={cn(
                          "chip text-xs",
                          priorityColors[
                            (task.priority as string) || "medium"
                          ] || "chip"
                        )}
                      >
                        <Flag className="w-3 h-3" />
                        {task.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Project:{" "}
                      <span className="text-foreground">
                        {task.projectName || task.project_id || "—"}
                      </span>
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64" />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">
                          {task.assignee ? task.assignee.name : "Unassigned"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {task.due_date
                          ? task.due_date.slice(0, 10)
                          : "No due date"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      {(canCreateEditTasks || (!canCreateEditTasks && task.status !== 'done')) && (
                        <select
                          className="h-9 rounded-xl border border-border bg-card px-2 text-xs"
                          value={task.status || "todo"}
                          onChange={(e) => onUpdateStatus(task, e.target.value)}
                          disabled={task.status === 'review' || task.status === 'done'}
                        >
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done" disabled={task.status !== 'review'}>Done</option>
                        </select>
                      )}
                      {!canCreateEditTasks && task.status === 'done' && (
                        <Button className="h-8 px-3 text-xs" disabled>
                          Completed
                        </Button>
                      )}
                      {!canCreateEditTasks && task.status !== 'done' && (
                        <Button className="h-8 px-3 text-xs" onClick={() => {
                          // Show detailed task info in an alert for now
                          alert(`Task Details:

Title: ${task.title}
Description: ${task.description || "N/A"}
Project: ${task.projectName || task.project_id || "N/A"}
Status: ${task.status || "N/A"}
Priority: ${task.priority || "N/A"}
Due Date: ${task.due_date || "N/A"}
Assigned To: ${task.assignee?.name || "Unassigned"}`);
                        }}>
                          View Details
                        </Button>
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
