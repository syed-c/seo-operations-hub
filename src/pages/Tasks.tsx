import { useEffect, useState, useCallback } from "react";
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
  AlertCircle,
  AlertTriangle,
  CheckCircle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { LinkSheetEditor } from "@/components/ui/LinkSheetEditor";
import { Badge } from "@/components/ui/badge";

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
  completion_details?: string | null;
  completion_doc_url?: string | null;
  backlink_summary?: string | null;
  backlink_links_created?: Array<{ url: string }> | null;
  backlink_links_indexed?: Array<{ url: string }> | null;
  backlink_submission_type?: 'create' | 'index' | 'both' | null;
  backlink_report_status?: 'critical' | 'warning' | 'healthy' | null;
  parent_report_id?: string | null;
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

  // State for the review submission modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [taskToReview, setTaskToReview] = useState<TaskRecord | null>(null);
  const [reviewForm, setReviewForm] = useState({
    details: "",
    docUrl: "",
  });

  // State for backlink lead review modal
  const [isBacklinkReviewModalOpen, setIsBacklinkReviewModalOpen] = useState(false);
  const [backlinkReviewForm, setBacklinkReviewForm] = useState({
    summary: "",
    linkTypes: {
      create: false,
      index: false,
    },
    linksCreated: [] as Array<{ id: string; url: string }>,
    linksIndexed: [] as Array<{ id: string; url: string }>,
  });

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

  // Check if user is a backlink lead
  const isBacklinkLead = teamUser?.role === "Backlink Lead";

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

  const loadTeamMembers = useCallback(async () => {
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
      const allUsers = (result.data as { id: string; email: string; first_name?: string; last_name?: string; role?: string; }[]) || [];
      const filteredUsers = allUsers.filter(
        (user) => user.role !== "Super Admin"
      );

      setTeamMembers(filteredUsers);
    } catch (error) {
      console.error("Error in loadTeamMembers:", error);
    } finally {
      setLoadingTeamMembers(false);
    }
  }, [canCreateEditTasks]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Get user role
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

      const userRole = userData?.role;

      // Determine task filtering strategy based on role
      let tasksData;
      let tasksError;

      if (userRole === "Super Admin") {
        // Super Admin sees ALL tasks
        const result = await supabase
          .from("tasks")
          .select("id, title, description, status, priority, type, due_date, project_id")
          .order("created_at", { ascending: false });

        tasksData = result.data;
        tasksError = result.error;
      } else if (userRole === "Admin") {
        // Admin sees tasks from their assigned projects
        const { data: projectMembers } = await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id);

        if (!projectMembers || projectMembers.length === 0) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const projectIds = projectMembers.map(pm => pm.project_id);
        const result = await supabase
          .from("tasks")
          .select("id, title, description, status, priority, type, due_date, project_id")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        tasksData = result.data;
        tasksError = result.error;
      } else {
        // All other roles (Backlink Lead, SEO Lead, Content Lead, etc.) see ONLY their assigned tasks
        // Use adminApiClient to bypass RLS on task_assignments
        const adminApiClient = await import('@/lib/adminApiClient');
        const assignmentsResult = await adminApiClient.selectRecords<{ task_id: string }>(
          "task_assignments",
          "task_id",
          { user_id: user.id }
        );

        if (assignmentsResult?.error) {
          setError(`Failed to fetch task assignments: ${assignmentsResult.error}`);
          setLoading(false);
          return;
        }

        const assignments = assignmentsResult?.data || [];
        if (assignments.length === 0) {
          setTasks([]);
          setLoading(false);
          return;
        }

        const taskIds = assignments.map(a => a.task_id);
        const result = await supabase
          .from("tasks")
          .select("id, title, description, status, priority, type, due_date, project_id")
          .in("id", taskIds)
          .order("created_at", { ascending: false });

        tasksData = result.data;
        tasksError = result.error;
      }

      if (tasksError) {
        setError(tasksError.message);
        setLoading(false);
        return;
      }

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Fetch task assignments for all tasks using adminApiClient to bypass RLS
      const taskIds = tasksData.map(t => t.id);
      const adminApiClient = await import('@/lib/adminApiClient');
      const assignmentsResult = await adminApiClient.selectRecords<{ task_id: string; user_id: string }>(
        'task_assignments',
        'task_id, user_id'
      );

      // Filter assignments for the tasks we actually have
      const taskAssignments = (assignmentsResult?.data || []).filter(a => taskIds.includes(a.task_id));

      // Fetch project names for all unique project IDs
      const projectIds = [...new Set(tasksData.map(t => t.project_id).filter(Boolean))];
      const projectNamesMap = new Map<string, string>();

      if (projectIds.length > 0) {
        try {
          const adminApiClient = await import('@/lib/adminApiClient');
          const result = await adminApiClient.selectRecords<{ id: string; name: string }>('projects', 'id, name');
          if (result?.data) {
            result.data.forEach(p => projectNamesMap.set(p.id, p.name));
          }
        } catch (error) {
          console.error('Error fetching project names:', error);
        }
      }

      // Build assignee info map
      const userIds = [...new Set((taskAssignments || []).map(a => a.user_id).filter(Boolean))];
      const assigneeInfoMap = new Map<string, { id: string; name: string }>();

      // First check teamMembers
      teamMembers.forEach(member => {
        if (userIds.includes(member.id)) {
          assigneeInfoMap.set(member.id, {
            id: member.id,
            name: (member.first_name || member.last_name)
              ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
              : member.email
          });
        }
      });

      // Fetch missing users
      const missingUserIds = userIds.filter(id => !assigneeInfoMap.has(id));
      if (missingUserIds.length > 0) {
        try {
          const adminApiClient = await import('@/lib/adminApiClient');
          const result = await adminApiClient.selectRecords<{ id: string; email: string; first_name: string; last_name: string }>(
            'users',
            'id, email, first_name, last_name'
          );
          if (result?.data) {
            result.data.forEach(user => {
              if (missingUserIds.includes(user.id)) {
                assigneeInfoMap.set(user.id, {
                  id: user.id,
                  name: (user.first_name || user.last_name)
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : user.email
                });
              }
            });
          }
        } catch (error) {
          console.error('Error fetching user details:', error);
        }
      }

      // Build final tasks with details
      const tasksWithDetails = tasksData.map(task => {
        const assignment = (taskAssignments || []).find(a => a.task_id === task.id);
        const assignee = assignment?.user_id ? assigneeInfoMap.get(assignment.user_id) || null : null;
        const projectName = task.project_id ? projectNamesMap.get(task.project_id) || null : null;

        return {
          ...task,
          assignee,
          projectName,
          task_assignments: assignment ? [{ user_id: assignment.user_id }] : [],
        };
      });

      setTasks(tasksWithDetails);
      setLoading(false);
    } catch (err: unknown) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to load tasks";
      setError(errorMessage);
    }
  }, [teamMembers]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time subscriptions for instant updates
  useEffect(() => {
    // Subscribe to tasks table changes
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Tasks table changed:', payload);
          load(); // Reload tasks when any task is created, updated, or deleted
        }
      )
      .subscribe();

    // Subscribe to task_assignments table changes
    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments' },
        (payload) => {
          console.log('Task assignments changed:', payload);
          load(); // Reload tasks when assignments change
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      tasksChannel.unsubscribe();
      assignmentsChannel.unsubscribe();
    };
  }, [load]);

  const onCreate = async () => {
    if (!form.title.trim()) {
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
    // If moving to review status, show appropriate modal based on user role
    if (status === 'review') {
      setTaskToReview(task);

      if (isBacklinkLead) {
        // Show backlink-specific review modal
        setBacklinkReviewForm({
          summary: "",
          linkTypes: { create: false, index: false },
          linksCreated: [],
          linksIndexed: [],
        });
        setIsBacklinkReviewModalOpen(true);
      } else {
        // Show standard review modal
        setReviewForm({ details: "", docUrl: "" });
        setIsReviewModalOpen(true);
      }
      return;
    }

    // If moving to review status (legacy webhook logic - keeping it for reference or other triggers)
    // if (status === 'review' && task.status !== 'review') {
    //   try {
    //     const webhookUrl = import.meta.env.VITE_TASK_REVIEW_WEBHOOK_URL;
    //     if (webhookUrl) {
    //       const response = await fetch(webhookUrl, {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({
    //           taskId: task.id,
    //           title: task.title,
    //           description: task.description,
    //           status: status,
    //           projectId: task.project_id,
    //           assignee: task.assignee,
    //         }),
    //       });

    //       if (!response.ok) {
    //         console.error('Webhook call failed:', response.status, response.statusText);
    //       } else {
    //         console.log('Webhook called successfully for task review');
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error calling webhook:', error);
    //   }
    // }

    await supabase.from("tasks").update({ status }).eq("id", task.id);
    load();
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.details.trim()) {
      setError("Please describe what you actually did (required).");
      return;
    }

    if (!taskToReview) return;

    try {
      const { error: updateError } = await supabase.from("tasks").update({
        status: 'review',
        completion_details: reviewForm.details,
        completion_doc_url: reviewForm.docUrl,
        updated_at: new Date().toISOString()
      }).eq("id", taskToReview.id);

      if (updateError) throw updateError;

      // Webhook call logic (moved here from onUpdateStatus)
      try {
        const webhookUrl = import.meta.env.VITE_TASK_REVIEW_WEBHOOK_URL;
        if (webhookUrl) {
          console.log('Sending webhook with payload:', {
            taskId: taskToReview.id,
            title: taskToReview.title,
            completion_details: reviewForm.details,
            completion_doc_url: reviewForm.docUrl,
          });

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskId: taskToReview.id,
              title: taskToReview.title,
              description: taskToReview.description,
              completion_details: reviewForm.details,
              completion_doc_url: reviewForm.docUrl,
              status: 'review',
              projectId: taskToReview.project_id,
              projectName: taskToReview.projectName,
              assignee: taskToReview.assignee,
              submitted_at: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            console.error('Webhook failed:', response.status, response.statusText);
          }
        } else {
          console.warn('VITE_TASK_REVIEW_WEBHOOK_URL not defined');
        }
      } catch (webhookErr) {
        console.error('Error calling webhook:', webhookErr);
      }

      setIsReviewModalOpen(false);
      setTaskToReview(null);
      setReviewForm({ details: "", docUrl: "" });
      load();
    } catch (err: unknown) {
      console.error("Error submitting review:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit task for review";

      // Specifically handle the missing column error to guide the user
      if (errorMessage.includes("completion_details")) {
        setError("Database schema error: The 'completion_details' column is missing. Please ensure the latest migration has been applied in Supabase.");
      } else {
        setError(errorMessage);
      }
    }
  };

  const handleBacklinkReviewSubmit = async () => {
    // Validation
    if (!backlinkReviewForm.summary.trim()) {
      setError("Please provide a summary of what you did (required).");
      return;
    }

    if (!backlinkReviewForm.linkTypes.create && !backlinkReviewForm.linkTypes.index) {
      setError("Please select at least one link type (Links Created or Links Indexed).");
      return;
    }

    if (backlinkReviewForm.linkTypes.create && backlinkReviewForm.linksCreated.filter(l => l.url.trim()).length === 0) {
      setError("Please add at least one link for 'Links Created'.");
      return;
    }

    if (backlinkReviewForm.linkTypes.index && backlinkReviewForm.linksIndexed.filter(l => l.url.trim()).length === 0) {
      setError("Please add at least one link for 'Links Indexed'.");
      return;
    }

    if (!taskToReview) return;

    try {
      // Determine submission type
      let submissionType: 'create' | 'index' | 'both' = 'create';
      if (backlinkReviewForm.linkTypes.create && backlinkReviewForm.linkTypes.index) {
        submissionType = 'both';
      } else if (backlinkReviewForm.linkTypes.index) {
        submissionType = 'index';
      }

      // Filter out empty URLs
      const linksCreated = backlinkReviewForm.linksCreated
        .filter(l => l.url.trim())
        .map(l => ({ url: l.url.trim() }));

      const linksIndexed = backlinkReviewForm.linksIndexed
        .filter(l => l.url.trim())
        .map(l => ({ url: l.url.trim() }));

      // Update task in database
      const { error: updateError } = await supabase.from("tasks").update({
        status: 'review',
        backlink_summary: backlinkReviewForm.summary,
        backlink_links_created: backlinkReviewForm.linkTypes.create ? linksCreated : null,
        backlink_links_indexed: backlinkReviewForm.linkTypes.index ? linksIndexed : null,
        backlink_submission_type: submissionType,
        updated_at: new Date().toISOString()
      }).eq("id", taskToReview.id);

      if (updateError) throw updateError;

      // Webhook call for backlink leads
      try {
        const webhookUrl = import.meta.env.VITE_BACKLINK_REVIEW_WEBHOOK_URL;
        console.log('=== BACKLINK WEBHOOK DEBUG ===');
        console.log('Webhook URL:', webhookUrl);
        console.log('Webhook URL defined:', !!webhookUrl);

        if (webhookUrl) {
          const payload = {
            taskId: taskToReview.id,
            title: taskToReview.title,
            description: taskToReview.description,
            status: 'review',
            projectId: taskToReview.project_id,
            projectName: taskToReview.projectName,
            assignee: taskToReview.assignee,
            backlink_summary: backlinkReviewForm.summary,
            backlink_links_created: backlinkReviewForm.linkTypes.create ? linksCreated : null,
            backlink_links_indexed: backlinkReviewForm.linkTypes.index ? linksIndexed : null,
            backlink_submission_type: submissionType,
            submitted_at: new Date().toISOString(),
          };

          console.log('Sending backlink webhook with payload:', payload);
          console.log('Payload as JSON string:', JSON.stringify(payload));

          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
          });

          console.log('Webhook response status:', response.status);
          console.log('Webhook response ok:', response.ok);
          console.log('Webhook response headers:', response.headers);

          const responseText = await response.text();
          console.log('Webhook response body:', responseText);

          if (!response.ok) {
            console.error('Backlink webhook failed:', response.status, response.statusText);
            console.error('Response body:', responseText);
          } else {
            console.log('✅ Backlink webhook called successfully!');
            console.log('Response:', responseText);
          }
        } else {
          console.warn('⚠️ VITE_BACKLINK_REVIEW_WEBHOOK_URL not defined');
        }
      } catch (webhookErr) {
        console.error('❌ Error calling backlink webhook:', webhookErr);
        if (webhookErr instanceof Error) {
          console.error('Error message:', webhookErr.message);
          console.error('Error stack:', webhookErr.stack);
        }
      }

      setIsBacklinkReviewModalOpen(false);
      setTaskToReview(null);
      setBacklinkReviewForm({
        summary: "",
        linkTypes: { create: false, index: false },
        linksCreated: [],
        linksIndexed: [],
      });
      load();
    } catch (err: unknown) {
      console.error("Error submitting backlink review:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit task for review";
      setError(errorMessage);
    }
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

        <div className="flex items-center gap-2">
          {canCreateEditTasks && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <Button
                className="gap-2 rounded-xl"
                onClick={() => {
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
                              ? `${member.first_name || ""} ${member.last_name || ""
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

          {/* Task Review Submission Modal */}
          <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Task for Review</DialogTitle>
                <DialogDescription>
                  Please describe the work you've completed for: <strong>{taskToReview?.title}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="review-details">What did you actually do? <span className="text-destructive">*</span></Label>
                  <textarea
                    id="review-details"
                    placeholder="Provide a detailed description of your work..."
                    className="w-full min-h-[120px] p-3 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={reviewForm.details}
                    onChange={(e) => setReviewForm({ ...reviewForm, details: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-doc">Work Document URL (Optional)</Label>
                  <Input
                    id="review-doc"
                    placeholder="https://docs.google.com/..."
                    value={reviewForm.docUrl}
                    onChange={(e) => setReviewForm({ ...reviewForm, docUrl: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setTaskToReview(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleReviewSubmit}>Submit for Review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Backlink Lead Review Submission Modal */}
          <Dialog open={isBacklinkReviewModalOpen} onOpenChange={setIsBacklinkReviewModalOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit Backlink Task for Review</DialogTitle>
                <DialogDescription>
                  Please provide details about your backlink work for: <strong>{taskToReview?.title}</strong>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {/* Summary */}
                <div className="space-y-2">
                  <Label htmlFor="backlink-summary">
                    Summary <span className="text-destructive">*</span>
                  </Label>
                  <textarea
                    id="backlink-summary"
                    placeholder="Describe what you did for this task..."
                    className="w-full min-h-[100px] p-3 rounded-md border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={backlinkReviewForm.summary}
                    onChange={(e) => setBacklinkReviewForm({ ...backlinkReviewForm, summary: e.target.value })}
                  />
                </div>

                {/* Link Type Selection */}
                <div className="space-y-3">
                  <Label>
                    Link Type <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="link-type-create"
                        checked={backlinkReviewForm.linkTypes.create}
                        onCheckedChange={(checked) =>
                          setBacklinkReviewForm({
                            ...backlinkReviewForm,
                            linkTypes: { ...backlinkReviewForm.linkTypes, create: checked as boolean },
                          })
                        }
                      />
                      <label
                        htmlFor="link-type-create"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Links Created
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="link-type-index"
                        checked={backlinkReviewForm.linkTypes.index}
                        onCheckedChange={(checked) =>
                          setBacklinkReviewForm({
                            ...backlinkReviewForm,
                            linkTypes: { ...backlinkReviewForm.linkTypes, index: checked as boolean },
                          })
                        }
                      />
                      <label
                        htmlFor="link-type-index"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Links Indexed
                      </label>
                    </div>
                  </div>
                </div>

                {/* Links Created Table */}
                {backlinkReviewForm.linkTypes.create && (
                  <div className="space-y-2">
                    <Label>Links Created <span className="text-destructive">*</span></Label>
                    <LinkSheetEditor
                      links={backlinkReviewForm.linksCreated}
                      onChange={(links) =>
                        setBacklinkReviewForm({ ...backlinkReviewForm, linksCreated: links })
                      }
                      placeholder="Enter URL where you created a link..."
                    />
                  </div>
                )}

                {/* Links Indexed Table */}
                {backlinkReviewForm.linkTypes.index && (
                  <div className="space-y-2">
                    <Label>Links Indexed <span className="text-destructive">*</span></Label>
                    <LinkSheetEditor
                      links={backlinkReviewForm.linksIndexed}
                      onChange={(links) =>
                        setBacklinkReviewForm({ ...backlinkReviewForm, linksIndexed: links })
                      }
                      placeholder="Enter URL of your blog where links were indexed..."
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsBacklinkReviewModalOpen(false);
                    setTaskToReview(null);
                    setBacklinkReviewForm({
                      summary: "",
                      linkTypes: { create: false, index: false },
                      linksCreated: [],
                      linksIndexed: [],
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleBacklinkReviewSubmit}>Submit for Review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
                    <h4 className="font-medium text-sm mb-1 flex items-center gap-2">
                      {task.title}
                      {task.backlink_report_status && (
                        <Badge 
                          variant="outline"
                          className={cn(
                            "text-xs",
                            task.backlink_report_status === 'critical' && 'bg-destructive/10 text-destructive border-destructive/20',
                            task.backlink_report_status === 'warning' && 'bg-warning/10 text-warning border-warning/20',
                            task.backlink_report_status === 'healthy' && 'bg-success/10 text-success border-success/20'
                          )}
                        >
                          {task.backlink_report_status === 'critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {task.backlink_report_status === 'warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {task.backlink_report_status === 'healthy' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {task.backlink_report_status}
                        </Badge>
                      )}
                    </h4>
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
                          alert(`Task Details:
Title: ${task.title}
Description: ${task.description || "N/A"}
Project: ${task.projectName || task.project_id || "N/A"}
Status: ${task.status || "N/A"}
Priority: ${task.priority || "N/A"}
Due Date: ${task.due_date || "N/A"}
Assigned To: ${task.assignee?.name || "Unassigned"}
Details: ${task.completion_details || "N/A"}
Doc: ${task.completion_doc_url || "N/A"}`);
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
