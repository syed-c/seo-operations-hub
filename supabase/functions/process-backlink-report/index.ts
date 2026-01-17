import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

console.log("Process Backlink Report function started");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface BacklinkReportPayload {
  created_links: Array<{
    url: string;
    status: 'working' | 'dead';
    anchor_text?: string;
    target_url?: string;
  }>;
  indexed_blogs: Array<{
    blog_url: string;
    is_indexed: boolean;
    interlink_count: number;
    interlinks: Array<{
      url: string;
      status: 'working' | 'dead';
    }>;
  }>;
  issues: Array<{
    type: string;
    severity: 'critical' | 'warning';
    url?: string;
    message: string;
  }>;
  requires_attention: Array<{
    type: string;
    severity: 'critical' | 'warning';
    url?: string;
    message: string;
  }>;
  summary: {
    total_created_links: number;
    working_links: number;
    dead_links: number;
    total_indexed_blogs: number;
    indexed_count: number;
    not_indexed_count: number;
    total_interlinks: number;
    working_interlinks: number;
    dead_interlinks: number;
  };
}

interface FollowUpTask {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'backlinks';
}

function determineFollowUpTasks(payload: BacklinkReportPayload, status: string): FollowUpTask[] {
  const tasks: FollowUpTask[] = [];

  if (status === 'critical') {
    // Dead created links
    if (payload.summary.dead_links > 0) {
      tasks.push({
        title: 'Fix dead backlink URLs',
        description: `${payload.summary.dead_links} created backlinks are returning dead/404 status. Please verify and fix these URLs.`,
        priority: 'high',
        type: 'backlinks',
      });
    }

    // Critical blogs (not indexed with dead interlinks)
    const criticalBlogs = payload.indexed_blogs.filter(
      b => !b.is_indexed || b.interlinks.some(i => i.status === 'dead')
    );
    if (criticalBlogs.length > 0) {
      tasks.push({
        title: 'Fix critical blog interlinks',
        description: `${criticalBlogs.length} blogs have critical issues with indexing or dead interlinks.`,
        priority: 'high',
        type: 'backlinks',
      });
    }

    // Dead interlinks
    if (payload.summary.dead_interlinks > 0) {
      tasks.push({
        title: 'Replace dead interlinks',
        description: `${payload.summary.dead_interlinks} interlinks within blog posts are dead and need replacement.`,
        priority: 'high',
        type: 'backlinks',
      });
    }
  }

  if (status === 'warning') {
    // Low interlink count
    const lowInterlinkBlogs = payload.indexed_blogs.filter(b => b.interlink_count < 3);
    if (lowInterlinkBlogs.length > 0) {
      tasks.push({
        title: 'Improve interlinking',
        description: `${lowInterlinkBlogs.length} blogs have fewer than 3 interlinks. Consider adding more internal links.`,
        priority: 'medium',
        type: 'backlinks',
      });
    }

    // Irrelevant links (from issues)
    const irrelevantLinkIssues = payload.issues.filter(i => i.type === 'irrelevant_link');
    if (irrelevantLinkIssues.length > 0) {
      tasks.push({
        title: 'Improve link relevance',
        description: `${irrelevantLinkIssues.length} links have been flagged as potentially irrelevant. Review and improve anchor text relevance.`,
        priority: 'medium',
        type: 'backlinks',
      });
    }
  }

  return tasks;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // Parse the incoming report data
    const body = await req.json();
    console.log('Received backlink report data:', JSON.stringify(body).substring(0, 500));

    const { 
      task_id, 
      project_id, 
      assignee_id, 
      status, 
      summary, 
      payload 
    } = body;

    if (!task_id || !project_id || !assignee_id || !status || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: task_id, project_id, assignee_id, status, payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Insert the backlink report
    const { data: reportData, error: reportError } = await supabaseAdmin
      .from('backlink_reports')
      .insert({
        task_id,
        project_id,
        assignee_id,
        status,
        summary: summary || payload.summary,
        payload,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (reportError) {
      console.error('Error inserting report:', reportError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert report', details: reportError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Report inserted:', reportData.id);

    // 2. Update the original task status from 'review' to 'completed'
    const { error: taskUpdateError } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'completed',
        backlink_report_status: status, // Store the report status for badge display
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id);

    if (taskUpdateError) {
      console.error('Error updating task:', taskUpdateError);
      // Continue even if task update fails
    } else {
      console.log('Task updated to completed with status badge:', status);
    }

    // 3. Generate follow-up tasks if status is critical or warning
    let followUpTasksCreated = 0;
    if (status === 'critical' || status === 'warning') {
      const followUpTasks = determineFollowUpTasks(payload as BacklinkReportPayload, status);

      for (const task of followUpTasks) {
        const { error: createTaskError } = await supabaseAdmin
          .from('tasks')
          .insert({
            title: task.title,
            description: task.description,
            project_id,
            assignee_id,
            priority: task.priority,
            type: task.type,
            status: 'todo',
            parent_report_id: reportData.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createTaskError) {
          console.error('Error creating follow-up task:', createTaskError);
        } else {
          followUpTasksCreated++;
          console.log('Created follow-up task:', task.title);
        }
      }

      // Update report to mark that follow-up tasks were created
      if (followUpTasksCreated > 0) {
        await supabaseAdmin
          .from('backlink_reports')
          .update({ follow_up_tasks_created: true })
          .eq('id', reportData.id);
      }
    }

    // 4. Create notifications
    const notifications = [];

    // Notification for assignee
    notifications.push({
      user_id: assignee_id,
      type: 'backlink_report',
      title: `Backlink Report Generated: ${status.toUpperCase()}`,
      message: status === 'critical' 
        ? `Your backlink report has critical issues. ${followUpTasksCreated} follow-up tasks have been created.`
        : status === 'warning'
        ? `Your backlink report has warnings. ${followUpTasksCreated} follow-up tasks have been created.`
        : 'Your backlink report shows all links are healthy!',
      data: { report_id: reportData.id, status },
      read: false,
      created_at: new Date().toISOString(),
    });

    // Get project managers and super admins to notify
    const { data: managersData } = await supabaseAdmin
      .from('project_members')
      .select('user_id, users:user_id (role)')
      .eq('project_id', project_id)
      .in('role', ['manager', 'admin']);

    const { data: superAdminsData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'Super Admin');

    // Add notifications for managers
    if (managersData) {
      for (const manager of managersData) {
        if (manager.user_id !== assignee_id) {
          notifications.push({
            user_id: manager.user_id,
            type: 'backlink_report',
            title: `New Backlink Report: ${status.toUpperCase()}`,
            message: `A ${status} backlink report has been generated for your project.`,
            data: { report_id: reportData.id, status, project_id },
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Add notifications for super admins (only for critical)
    if (superAdminsData && status === 'critical') {
      for (const admin of superAdminsData) {
        if (admin.id !== assignee_id) {
          notifications.push({
            user_id: admin.id,
            type: 'backlink_report',
            title: `Critical Backlink Report Alert`,
            message: `A critical backlink report has been generated and requires attention.`,
            data: { report_id: reportData.id, status, project_id },
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error inserting notifications:', notifError);
      } else {
        console.log(`Created ${notifications.length} notifications`);
      }
    }

    // 5. Emit realtime event (Supabase handles this automatically via postgres_changes)
    // The frontend will pick this up via the useBacklinkReportsRealtime hook

    return new Response(
      JSON.stringify({
        success: true,
        report_id: reportData.id,
        task_updated: !taskUpdateError,
        follow_up_tasks_created: followUpTasksCreated,
        notifications_sent: notifications.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
