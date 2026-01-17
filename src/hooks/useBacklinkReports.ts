import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { BacklinkReport, BacklinkReportStatus } from '@/types';
import { useAuth } from '@/components/AuthGate';

export interface BacklinkReportFilters {
  projectId?: string;
  assigneeId?: string;
  status?: BacklinkReportStatus;
  startDate?: string;
  endDate?: string;
}

export function useBacklinkReports(filters?: BacklinkReportFilters) {
  const { teamUser } = useAuth();
  
  return useQuery({
    queryKey: ['backlink-reports', filters],
    queryFn: async () => {
      let query = supabase
        .from('backlink_reports')
        .select(`
          id,
          task_id,
          project_id,
          assignee_id,
          status,
          submitted_at,
          checked_at,
          total_links_checked,
          total_working,
          total_dead,
          health_percentage,
          created_links_summary,
          indexed_blogs_summary,
          report_payload,
          projects:project_id (id, name),
          users:assignee_id (id, email, first_name, last_name),
          tasks:task_id (id, title, type)
        `)
        .order('submitted_at', { ascending: false });

      // Apply role-based filtering
      if (teamUser?.role === 'Backlink Lead') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.eq('assignee_id', user.id);
        }
      } else if (teamUser?.role === 'Client') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: projectMemberData } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', user.id);
          
          if (projectMemberData && projectMemberData.length > 0) {
            const projectIds = projectMemberData.map(pm => pm.project_id);
            query = query.in('project_id', projectIds);
          }
        }
      }

      // Apply additional filters
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.assigneeId) {
        query = query.eq('assignee_id', filters.assigneeId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('submitted_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('submitted_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as (BacklinkReport & {
        projects: { id: string; name: string } | null;
        users: { id: string; email: string; first_name?: string; last_name?: string } | null;
        tasks: { id: string; title: string; type: string } | null;
      })[];
    },
    enabled: !!teamUser,
  });
}

export function useBacklinkReport(reportId: string) {
  return useQuery({
    queryKey: ['backlink-report', reportId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlink_reports')
        .select(`
          id, task_id, project_id, assignee_id, status,
          submitted_at, checked_at,
          total_links_checked, total_working, total_dead, health_percentage,
          created_links_summary, indexed_blogs_summary, report_payload,
          projects:project_id (id, name),
          users:assignee_id (id, email, first_name, last_name),
          tasks:task_id (id, title, type, status)
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as BacklinkReport & {
        projects: { id: string; name: string } | null;
        users: { id: string; email: string; first_name?: string; last_name?: string } | null;
        tasks: { id: string; title: string; type: string; status: string } | null;
      };
    },
    enabled: !!reportId,
  });
}

export function useBacklinkReportStats() {
  const { teamUser } = useAuth();
  
  return useQuery({
    queryKey: ['backlink-report-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlink_reports')
        .select('id, status, total_links_checked, total_working, total_dead, health_percentage, submitted_at, project_id, assignee_id, created_links_summary, indexed_blogs_summary');

      if (error) throw error;

      const reports = data || [];
      
      // Calculate statistics
      const total = reports.length;
      const critical = reports.filter(r => r.status === 'critical').length;
      const warning = reports.filter(r => r.status === 'warning').length;
      const healthy = reports.filter(r => r.status === 'healthy').length;

      // Calculate link metrics from actual data
      let totalDeadLinks = 0;
      let totalWorkingLinks = 0;
      let totalDeadInterlinks = 0;
      let totalWorkingInterlinks = 0;

      reports.forEach(r => {
        totalDeadLinks += r.total_dead || 0;
        totalWorkingLinks += r.total_working || 0;
        
        const indexedBlogs = r.indexed_blogs_summary as { interlinks_summary?: { dead?: number; working?: number } } | null;
        if (indexedBlogs?.interlinks_summary) {
          totalDeadInterlinks += indexedBlogs.interlinks_summary.dead || 0;
          totalWorkingInterlinks += indexedBlogs.interlinks_summary.working || 0;
        }
      });

      // Top failing projects
      const projectCounts: Record<string, { total: number; critical: number; warning: number }> = {};
      reports.forEach(r => {
        if (!projectCounts[r.project_id]) {
          projectCounts[r.project_id] = { total: 0, critical: 0, warning: 0 };
        }
        projectCounts[r.project_id].total++;
        if (r.status === 'critical') projectCounts[r.project_id].critical++;
        if (r.status === 'warning') projectCounts[r.project_id].warning++;
      });

      const topFailingProjects = Object.entries(projectCounts)
        .map(([projectId, counts]) => ({ projectId, ...counts }))
        .sort((a, b) => (b.critical + b.warning) - (a.critical + a.warning))
        .slice(0, 5);

      // Top assignees with critical issues
      const assigneeCounts: Record<string, { total: number; critical: number }> = {};
      reports.forEach(r => {
        if (!assigneeCounts[r.assignee_id]) {
          assigneeCounts[r.assignee_id] = { total: 0, critical: 0 };
        }
        assigneeCounts[r.assignee_id].total++;
        if (r.status === 'critical') assigneeCounts[r.assignee_id].critical++;
      });

      const topAssigneesWithCritical = Object.entries(assigneeCounts)
        .map(([assigneeId, counts]) => ({ assigneeId, ...counts }))
        .filter(a => a.critical > 0)
        .sort((a, b) => b.critical - a.critical)
        .slice(0, 5);

      // Weekly and monthly trends
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weeklyReports = reports.filter(r => new Date(r.submitted_at) >= weekAgo);
      const monthlyReports = reports.filter(r => new Date(r.submitted_at) >= monthAgo);

      return {
        total,
        byStatus: { critical, warning, healthy },
        linkMetrics: {
          totalDeadLinks,
          totalWorkingLinks,
          totalDeadInterlinks,
          totalWorkingInterlinks,
          deadLinkRate: totalWorkingLinks + totalDeadLinks > 0 
            ? (totalDeadLinks / (totalWorkingLinks + totalDeadLinks) * 100).toFixed(1)
            : '0',
        },
        topFailingProjects,
        topAssigneesWithCritical,
        trends: {
          weekly: weeklyReports.length,
          monthly: monthlyReports.length,
          weeklyCritical: weeklyReports.filter(r => r.status === 'critical').length,
          monthlyCritical: monthlyReports.filter(r => r.status === 'critical').length,
        },
      };
    },
    enabled: !!teamUser && ['Super Admin', 'Admin', 'Manager'].includes(teamUser.role || ''),
  });
}

// Realtime subscription hook
export function useBacklinkReportsRealtime(onNewReport?: (report: BacklinkReport) => void) {
  const queryClient = useQueryClient();

  const subscribe = () => {
    const channel = supabase
      .channel('backlink_reports_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'backlink_reports',
        },
        (payload) => {
          console.log('New backlink report:', payload.new);
          queryClient.invalidateQueries({ queryKey: ['backlink-reports'] });
          queryClient.invalidateQueries({ queryKey: ['backlink-report-stats'] });
          if (onNewReport) {
            onNewReport(payload.new as BacklinkReport);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'backlink_reports',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['backlink-reports'] });
          queryClient.invalidateQueries({ queryKey: ['backlink-report-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribe };
}
