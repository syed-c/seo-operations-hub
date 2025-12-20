import { useState, useEffect } from "react";
import { getRecentTasks, getFilteredTasks, Task } from "@/services/tasks.service";

interface TaskFilters {
  status?: 'todo' | 'in-progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: 'overdue' | 'today' | 'upcoming';
}

export const useRoleTasks = (userRole: string | null, userId: string | null) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!userRole || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let result: Task[];
        
        // If filters are applied, use filtered tasks, otherwise use recent tasks
        if (Object.keys(filters).length > 0) {
          result = await getFilteredTasks(userRole, userId, filters);
        } else {
          result = await getRecentTasks(userRole, userId);
        }
        
        setTasks(result);
      } catch (err) {
        console.error("Error fetching role tasks:", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, userId, filters]);

  const updateFilters = (newFilters: TaskFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  return { 
    tasks, 
    loading, 
    error, 
    filters, 
    updateFilters, 
    clearFilters 
  };
};