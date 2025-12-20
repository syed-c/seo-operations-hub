import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Define the data structure for role dashboard metrics
export interface RoleDashboardData {
  totalProjects: number;
  activeClients: number;
  teamMembers: number;
  revenue: number;
  avgProjectHealth: number;
  completionRate: number;
  supportTickets: number;
  clientSatisfaction: number;
}

// Define the default state
const defaultData: RoleDashboardData = {
  totalProjects: 0,
  activeClients: 0,
  teamMembers: 0,
  revenue: 0,
  avgProjectHealth: 0,
  completionRate: 0,
  supportTickets: 0,
  clientSatisfaction: 4.8 // Static placeholder as requested
};

export const useRoleDashboardData = (userRole: string | null, userId: string | null) => {
  const [data, setData] = useState<RoleDashboardData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userRole || !userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel with individual error handling
        const [
          projectsResult,
          membersResult,
          tasksResult
        ] = await Promise.allSettled([
          fetchProjects(userRole, userId),
          fetchMembers(userRole, userId),
          fetchTasks(userRole, userId)
        ]);

        // Process results with safe fallbacks
        const totalProjects = projectsResult.status === 'fulfilled' ? projectsResult.value.totalProjects : 0;
        const activeClients = membersResult.status === 'fulfilled' ? membersResult.value.activeClients : 0;
        const teamMembers = membersResult.status === 'fulfilled' ? membersResult.value.teamMembers : 0;
        const { totalTasks, completedTasks, supportTickets } = tasksResult.status === 'fulfilled' 
          ? tasksResult.value 
          : { totalTasks: 0, completedTasks: 0, supportTickets: 0 };

        // Calculate derived metrics with safe division
        const completionRate = totalTasks > 0 
          ? Math.round((completedTasks / totalTasks) * 10000) / 100 
          : 0;
          
        const avgProjectHealth = projectsResult.status === 'fulfilled' 
          ? projectsResult.value.avgHealth 
          : 0;

        // Update state with fetched data
        setData({
          totalProjects,
          activeClients,
          teamMembers,
          revenue: 0, // Placeholder as requested
          avgProjectHealth,
          completionRate,
          supportTickets,
          clientSatisfaction: 4.8 // Static placeholder as requested
        });
      } catch (err) {
        console.error("Unexpected error in dashboard data fetching:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole, userId]);

  return { data, loading, error };
};

// Helper function to fetch projects data
const fetchProjects = async (userRole: string, userId: string) => {
  try {
    let query = supabase.from('projects').select('id, health_score, status');
    
    // Role-based filtering
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userId);
      query = query.in('id', projectIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
    
    const totalProjects = data?.length || 0;
    
    // Calculate average health score safely
    const validHealthScores = data?.map(p => p.health_score).filter(score => score !== null) || [];
    const avgHealth = validHealthScores.length > 0 
      ? Math.round(validHealthScores.reduce((sum, score) => sum + (score || 0), 0) / validHealthScores.length)
      : 0;
    
    return {
      totalProjects,
      avgHealth
    };
  } catch (error) {
    console.error("Error in fetchProjects:", error);
    return { totalProjects: 0, avgHealth: 0 };
  }
};

// Helper function to fetch members data
const fetchMembers = async (userRole: string, userId: string) => {
  try {
    let query = supabase.from('project_members').select('user_id, role');
    
    // Role-based filtering
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userId);
      query = query.in('project_id', projectIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching members:", error);
      throw error;
    }
    
    // Count unique users to avoid duplicates
    const uniqueUsers = new Set(data?.map(member => member.user_id) || []);
    const membersWithRoles = data || [];
    
    // Count active clients (assuming 'client' role) and team members
    const activeClients = membersWithRoles.filter(member => 
      member.role && member.role.toLowerCase().includes('client')
    ).length;
    
    const teamMembers = membersWithRoles.filter(member => 
      member.role && !member.role.toLowerCase().includes('client')
    ).length;
    
    return {
      activeClients,
      teamMembers
    };
  } catch (error) {
    console.error("Error in fetchMembers:", error);
    return { activeClients: 0, teamMembers: 0 };
  }
};

// Helper function to fetch tasks data
const fetchTasks = async (userRole: string, userId: string) => {
  try {
    let query = supabase.from('tasks').select('id, status, type');
    
    // Role-based filtering
    if (userRole !== 'Super Admin') {
      const projectIds = await getUserProjectIds(userId);
      query = query.in('project_id', projectIds);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
    
    const tasks = data || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    // Count support tickets (tasks with type 'support' that are not closed)
    const supportTickets = tasks.filter(task => 
      task.type === 'support' && task.status !== 'done'
    ).length;
    
    return {
      totalTasks,
      completedTasks,
      supportTickets
    };
  } catch (error) {
    console.error("Error in fetchTasks:", error);
    return { totalTasks: 0, completedTasks: 0, supportTickets: 0 };
  }
};

// Helper function to get project IDs for a user
const getUserProjectIds = async (userId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId);
      
    if (error) {
      console.error("Error fetching user projects:", error);
      return [];
    }
    
    return data?.map(item => item.project_id) || [];
  } catch (error) {
    console.error("Error in getUserProjectIds:", error);
    return [];
  }
};