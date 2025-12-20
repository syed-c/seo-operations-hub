import { supabase } from "@/lib/supabaseClient";
import { safeQuery } from "@/lib/safeQuery";

// Types for our analytics data
export interface ProjectStatusMetrics {
  total: number;
  active: number;
  paused: number;
  completed: number;
  critical: number;
}

export interface UserDistributionMetrics {
  total: number;
  superAdmins: number;
  admins: number;
  members: number;
  clients: number;
}

export interface TaskHealthMetrics {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  overdue: number;
}

export interface RoleAnalyticsData {
  projects: ProjectStatusMetrics;
  users: UserDistributionMetrics;
  tasks: TaskHealthMetrics;
}

// Helper function to get project IDs for a user based on their role
const getUserProjectIds = async (userRole: string, userId: string): Promise<string[]> => {
  // Super Admin can see all projects
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

// Get projects by status metrics
export const getProjectStatusMetrics = async (userRole: string, userId: string): Promise<ProjectStatusMetrics> => {
  try {
    let query = supabase.from('projects').select('*', { count: 'exact', head: true });
    
    // Filter by user's projects if not Super Admin
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length === 0) {
        // User has no projects assigned
        return {
          total: 0,
          active: 0,
          paused: 0,
          completed: 0,
          critical: 0
        };
      }
      query = query.in('id', projectIds);
    }
    
    // Get total count
    const { count: totalCount, error: countError } = await query;
    if (countError) {
      console.error('Error counting total projects:', countError);
    }
    
    // Get active projects
    let activeQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active');
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length > 0) {
        activeQuery = activeQuery.in('id', projectIds);
      } else {
        activeQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible condition
      }
    }
    const { count: activeCount } = await activeQuery;
    
    // Get paused projects
    let pausedQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'paused');
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length > 0) {
        pausedQuery = pausedQuery.in('id', projectIds);
      } else {
        pausedQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible condition
      }
    }
    const { count: pausedCount } = await pausedQuery;
    
    // Get completed projects
    let completedQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length > 0) {
        completedQuery = completedQuery.in('id', projectIds);
      } else {
        completedQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible condition
      }
    }
    const { count: completedCount } = await completedQuery;
    
    // Get critical projects
    let criticalQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'critical');
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length > 0) {
        criticalQuery = criticalQuery.in('id', projectIds);
      } else {
        criticalQuery = supabase.from('projects').select('*', { count: 'exact', head: true }).eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible condition
      }
    }
    const { count: criticalCount } = await criticalQuery;
    
    return {
      total: totalCount || 0,
      active: activeCount || 0,
      paused: pausedCount || 0,
      completed: completedCount || 0,
      critical: criticalCount || 0
    };
  } catch (error) {
    console.error('Error in getProjectStatusMetrics:', error);
    return {
      total: 0,
      active: 0,
      paused: 0,
      completed: 0,
      critical: 0
    };
  }
};

// Get user distribution metrics
export const getUserDistributionMetrics = async (userRole: string, userId: string): Promise<UserDistributionMetrics> => {
  try {
    // For simplicity, we'll count all users regardless of role filtering
    // In a real app, you might want to filter by organization or other criteria
    
    const { data: usersData, error: usersError } = await safeQuery<{ role: string }[]>(
      supabase.from('users').select('role')
    );
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return {
        total: 0,
        superAdmins: 0,
        admins: 0,
        members: 0,
        clients: 0
      };
    }
    
    if (!usersData) {
      return {
        total: 0,
        superAdmins: 0,
        admins: 0,
        members: 0,
        clients: 0
      };
    }
    
    const total = usersData.length;
    const superAdmins = usersData.filter(user => user.role === 'Super Admin').length;
    const admins = usersData.filter(user => user.role === 'Admin').length;
    const members = usersData.filter(user => user.role === 'Member').length;
    const clients = usersData.filter(user => user.role === 'Client').length;
    
    return {
      total,
      superAdmins,
      admins,
      members,
      clients
    };
  } catch (error) {
    console.error('Error in getUserDistributionMetrics:', error);
    return {
      total: 0,
      superAdmins: 0,
      admins: 0,
      members: 0,
      clients: 0
    };
  }
};

// Get task health metrics
export const getTaskHealthMetrics = async (userRole: string, userId: string, daysBack?: number): Promise<TaskHealthMetrics> => {
  try {
    let query = supabase.from('tasks').select('*');
    
    // Apply date filter if specified
    if (daysBack) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      query = query.gte('created_at', cutoffDate.toISOString());
    }
    
    // Filter by user's projects if not Super Admin
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userRole, userId);
      if (projectIds.length === 0) {
        // User has no projects assigned
        return {
          total: 0,
          todo: 0,
          inProgress: 0,
          review: 0,
          done: 0,
          overdue: 0
        };
      }
      query = query.in('project_id', projectIds);
    }
    
    const { data: tasksData, error: tasksError } = await safeQuery<{
      status: string;
      due_date: string | null;
    }[]>(query);
    
    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        overdue: 0
      };
    }
    
    if (!tasksData) {
      return {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        overdue: 0
      };
    }
    
    const total = tasksData.length;
    const todo = tasksData.filter(task => task.status === 'todo').length;
    const inProgress = tasksData.filter(task => task.status === 'in-progress').length;
    const review = tasksData.filter(task => task.status === 'review').length;
    const done = tasksData.filter(task => task.status === 'done').length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdue = tasksData.filter(task => {
      if (task.status === 'done') return false; // Done tasks aren't overdue
      if (!task.due_date) return false; // No due date means not overdue
      const dueDate = new Date(task.due_date);
      return dueDate < now;
    }).length;
    
    return {
      total,
      todo,
      inProgress,
      review,
      done,
      overdue
    };
  } catch (error) {
    console.error('Error in getTaskHealthMetrics:', error);
    return {
      total: 0,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
      overdue: 0
    };
  }
};

// Main function to get all role analytics data
export const getRoleAnalyticsData = async (
  userRole: string, 
  userId: string,
  timeFilter?: '7d' | '30d' | '90d'
): Promise<RoleAnalyticsData> => {
  try {
    // Convert time filter to days
    let daysBack: number | undefined;
    if (timeFilter === '7d') daysBack = 7;
    else if (timeFilter === '30d') daysBack = 30;
    else if (timeFilter === '90d') daysBack = 90;
    
    // Fetch all metrics in parallel
    const [projects, users, tasks] = await Promise.all([
      getProjectStatusMetrics(userRole, userId),
      getUserDistributionMetrics(userRole, userId),
      getTaskHealthMetrics(userRole, userId, daysBack)
    ]);
    
    return {
      projects,
      users,
      tasks
    };
  } catch (error) {
    console.error('Error in getRoleAnalyticsData:', error);
    return {
      projects: {
        total: 0,
        active: 0,
        paused: 0,
        completed: 0,
        critical: 0
      },
      users: {
        total: 0,
        superAdmins: 0,
        admins: 0,
        members: 0,
        clients: 0
      },
      tasks: {
        total: 0,
        todo: 0,
        inProgress: 0,
        review: 0,
        done: 0,
        overdue: 0
      }
    };
  }
};