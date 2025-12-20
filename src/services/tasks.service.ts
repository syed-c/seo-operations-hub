import { supabase } from "@/lib/supabaseClient";
import { safeQuery } from "@/lib/safeQuery";

// Type for task data based on the actual table structure
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  project_id: string | null;
  due_date: string | null; // DATE type in PostgreSQL
  created_at: string; // TIMESTAMP WITH TIME ZONE
  updated_at: string; // TIMESTAMP WITH TIME ZONE
  type: 'content' | 'technical' | 'backlinks' | 'local' | 'audit' | 'general' | null;
}

// Helper function to get project IDs for a user based on their role
const getUserProjectIds = async (userRole: string, userId: string): Promise<string[]> => {
  // Super Admin can see all tasks
  if (userRole === 'Super Admin') {
    const { data, error } = await safeQuery<{ id: string }[]>(
      supabase.from('projects').select('id')
    );
    
    if (error) {
      console.error('Error fetching all project IDs for Super Admin:', error);
      return [];
    }
    
    return data?.map(project => project.id) || [];
  }
  
  // For other roles, get projects they're assigned to
  const { data, error } = await safeQuery<{ project_id: string }[]>(
    supabase.from('project_members').select('project_id').eq('user_id', userId)
  );
  
  if (error) {
    console.error('Error fetching project IDs for user:', error);
    return [];
  }
  
  return data?.map(member => member.project_id) || [];
};

// Get recent tasks based on user role
export const getRecentTasks = async (
  userRole: string, 
  userId: string, 
  limit: number = 10
): Promise<Task[]> => {
  try {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply role-based filtering
    if (userRole === 'Super Admin') {
      // Super Admin sees all tasks - no filtering needed
    } else if (userRole === 'Admin') {
      // Admin sees tasks from projects they're assigned to
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length === 0) {
        return []; // No projects assigned
      }
      query = query.in('project_id', projectIds);
    } else {
      // Regular members see tasks assigned to them
      // We need to join with task_assignments table
      const { data: assignedTasks, error } = await safeQuery<{ task_id: string }[]>(
        supabase
          .from('task_assignments')
          .select('task_id')
          .eq('user_id', userId)
      );
      
      if (error) {
        console.error('Error fetching assigned tasks:', error);
        return [];
      }
      
      const taskIds = assignedTasks?.map(assignment => assignment.task_id) || [];
      if (taskIds.length === 0) {
        return []; // No tasks assigned
      }
      
      query = query.in('id', taskIds);
    }
    
    const { data, error } = await safeQuery<Task[]>(query);
    
    if (error) {
      console.error('Error fetching recent tasks:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getRecentTasks:', error);
    return [];
  }
};

// Get filtered tasks based on various criteria
export const getFilteredTasks = async (
  userRole: string,
  userId: string,
  filters: {
    status?: 'todo' | 'in-progress' | 'review' | 'done';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: 'overdue' | 'today' | 'upcoming';
  }
): Promise<Task[]> => {
  try {
    let query = supabase.from('tasks').select('*');
    
    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    // Apply priority filter
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    
    // Apply due date filter
    if (filters.dueDate) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dueDate) {
        case 'overdue':
          // Tasks with due date before today and not done
          query = query.lt('due_date', today.toISOString().split('T')[0])
                       .neq('status', 'done');
          break;
        case 'today':
          // Tasks with due date today
          query = query.eq('due_date', today.toISOString().split('T')[0]);
          break;
        case 'upcoming':
          // Tasks with due date after today
          query = query.gt('due_date', today.toISOString().split('T')[0]);
          break;
      }
    }
    
    // Apply role-based filtering
    if (userRole === 'Super Admin') {
      // Super Admin sees all tasks - no filtering needed
    } else if (userRole === 'Admin') {
      // Admin sees tasks from projects they're assigned to
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length === 0) {
        return []; // No projects assigned
      }
      query = query.in('project_id', projectIds);
    } else {
      // Regular members see tasks assigned to them
      const { data: assignedTasks, error } = await safeQuery<{ task_id: string }[]>(
        supabase
          .from('task_assignments')
          .select('task_id')
          .eq('user_id', userId)
      );
      
      if (error) {
        console.error('Error fetching assigned tasks:', error);
        return [];
      }
      
      const taskIds = assignedTasks?.map(assignment => assignment.task_id) || [];
      if (taskIds.length === 0) {
        return []; // No tasks assigned
      }
      
      query = query.in('id', taskIds);
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await safeQuery<Task[]>(query);
    
    if (error) {
      console.error('Error fetching filtered tasks:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getFilteredTasks:', error);
    return [];
  }
};

// Get task count for statistics
export const getTaskCount = async (userRole: string, userId: string): Promise<number> => {
  try {
    let query = supabase.from('tasks').select('*', { count: 'exact', head: true });
    
    // Apply role-based filtering
    if (userRole === 'Super Admin') {
      // Super Admin sees all tasks - no filtering needed
    } else if (userRole === 'Admin') {
      // Admin sees tasks from projects they're assigned to
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length > 0) {
        query = query.in('project_id', projectIds);
      } else {
        // No projects assigned, return 0 count
        return 0;
      }
    } else {
      // Regular members see tasks assigned to them
      const { data: assignedTasks, error } = await safeQuery<{ task_id: string }[]>(
        supabase
          .from('task_assignments')
          .select('task_id')
          .eq('user_id', userId)
      );
      
      if (error) {
        console.error('Error fetching assigned tasks:', error);
        return 0;
      }
      
      const taskIds = assignedTasks?.map(assignment => assignment.task_id) || [];
      if (taskIds.length === 0) {
        return 0; // No tasks assigned
      }
      
      query = query.in('id', taskIds);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error counting tasks:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error in getTaskCount:', error);
    return 0;
  }
};