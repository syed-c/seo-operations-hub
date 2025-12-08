import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Plus, Search, Filter, MoreHorizontal, Clock, Flag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";

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
  assignee?: string | null;
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
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, description, status, priority, type, due_date, project_id, task_assignments(user_id)")
        .order("created_at", { ascending: false });
      
      setLoading(false);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setTasks(
        (data || []).map((t) => ({
          ...t,
          assignee: t.task_assignments?.[0]?.user_id ?? null,
        }))
      );
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async () => {
    if (!form.title) return;
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
      setError(error.message);
      return;
    }
    setForm({ title: "", projectId: "", description: "", priority: "medium", type: "general", status: "todo", dueDate: "" });
    if (form.projectId) {
      await supabase.from("task_assignments").insert({ task_id: data?.id, user_id: null });
    }
    load();
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
        <div className="flex items-center gap-2">
          <input
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="h-10 w-28 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Project ID"
            value={form.projectId}
            onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          />
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="urgent">urgent</option>
          </select>
          <select
            className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="general">general</option>
            <option value="content">content</option>
            <option value="technical">technical</option>
            <option value="backlinks">backlinks</option>
            <option value="local">local</option>
            <option value="audit">audit</option>
          </select>
          <input
            className="h-10 w-36 rounded-xl border border-border bg-card px-3 text-sm"
            placeholder="Due date (YYYY-MM-DD)"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Button className="gap-2 rounded-xl" onClick={onCreate}>
            <Plus className="w-4 h-4" />
            New Task
          </Button>
        </div>
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
                        <span className="text-xs text-muted-foreground">{task.assignee || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {task.due_date ? task.due_date.slice(0, 10) : "No due date"}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
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
                      <button
                        className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
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
