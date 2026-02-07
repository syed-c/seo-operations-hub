import { createClient } from "@supabase/supabase-js";
import { serveWithNotification } from "../_shared/wrapper.ts";
import { corsHeaders } from "../_shared/cors.ts";

serveWithNotification('process-backlink-report', async (req) => {

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

    // Dead created links
    if (payload.summary.dead_links > 0) {
      tasks.push({
        title: 'Fix Dead Backlinks',
        description: `${payload.summary.dead_links} created backlinks are returning dead/404 status. Please verify and fix these URLs.`,
        priority: 'high',
        type: 'backlinks',
      });
    }

    // No interlinks (Critical)
    const blogsWithNoInterlinks = payload.indexed_blogs.filter(b => b.interlinks.length === 0);
    if (blogsWithNoInterlinks.length > 0) {
      tasks.push({
        title: 'Add Interlinks',
        description: `${blogsWithNoInterlinks.length} blogs have ZERO interlinks. Please add internal links immediately.`,
        priority: 'high',
        type: 'backlinks',
      });
    }

    // Critical blogs (not indexed with dead interlinks) - Keeping as a catch-all high priority, or merging?
    // User didn't ask for "Fix critical blog interlinks", but implied "Fix Dead Backlinks" (which might cover dead interlinks too?).
    // User requested: "dead links -> task: Fix Dead Backlinks".
    // I will include dead interlinks under "Fix Dead Backlinks" or separate "Fix Dead Interlinks"?
    // User said "dead links -> task: Fix Dead Backlinks". This usually implies external backlinks created.
    // I'll keep my "Replace dead interlinks" logic but maybe rename it or just keep it as valuable extra.
    // Actually, "Fix Dead Backlinks" is good for created links.
    // For dead interlinks, I'll use "Fix Dead Interlinks" to be specific, or map to "Fix Dead Backlinks" if I must.
    // Let's keep it specific: "Fix Dead Interlinks" (User didn't explicitly forbid extra tasks).

    // Dead interlinks
    if (payload.summary.dead_interlinks > 0) {
      tasks.push({
        title: 'Fix Dead Interlinks',
        description: `${payload.summary.dead_interlinks} interlinks within blog posts are dead and need replacement.`,
        priority: 'high',
        type: 'backlinks',
      });
    }
    if (status === 'warning' || status === 'critical') {
      // Check for low link count (assuming interlinks < 3 but > 0)
      const lowInterlinkBlogs = payload.indexed_blogs.filter(b => b.interlink_count > 0 && b.interlink_count < 3);
      if (lowInterlinkBlogs.length > 0) {
        tasks.push({
          title: 'Fix Link Count',
          description: `${lowInterlinkBlogs.length} blogs have fewer than 3 interlinks. Consider adding more internal links.`,
          priority: 'medium',
          type: 'backlinks',
        });
      }

      // Irrelevant links (from issues)
      const irrelevantLinkIssues = payload.issues.filter(i => i.type === 'irrelevant_link');
      if (irrelevantLinkIssues.length > 0) {
        tasks.push({
          title: 'Fix Relevance Issues',
          description: `${irrelevantLinkIssues.length} links have been flagged as potentially irrelevant. Review and improve anchor text relevance.`,
          priority: 'medium',
          type: 'backlinks',
        });
      }
    }

    return tasks;
  }

  try {
    // Edge functions use SUPABASE_URL, not VITE_SUPABASE_URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing environment variables:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseServiceRoleKey });
      throw new Error('Missing environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Parse the incoming request
    const body = await req.json();
    console.log('Received payload:', JSON.stringify(body).substring(0, 500));

    // Determine if this is a direct call or a webhook
    let reportData: any;
    let isWebhook = false;

    console.log('Checking body.type:', body.type);
    console.log('Checking body.direct_submission:', body.direct_submission);

    if (body.type === 'INSERT' && body.table === 'backlink_reports' && body.record) {
      // Database Webhook
      isWebhook = true;
      reportData = body.record;
      console.log('Processing Webhook Insert for Report:', reportData.id);
    } else if (body.direct_submission) {
      // Direct call from the frontend
      console.log('Processing Direct Submission for Task:', body.taskId);
      console.log('Full body received:', JSON.stringify(body, null, 2));

      const { 
        taskId, 
        projectId, 
        assigneeId, 
        backlink_links_created = [], 
        backlink_links_indexed = [],
        backlink_links_filtered = [],
        backlink_submission_type,
        batch_info
      } = body;
      
      if (!taskId || !projectId || !assigneeId) {
        console.error('Missing required fields:', { taskId, projectId, assigneeId });
        return new Response(
          JSON.stringify({ error: 'Missing required fields: taskId, projectId, or assigneeId' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store submitted links in backlinks table
      const allLinksToInsert = [];

      // Add created links to storage
      if (backlink_links_created && backlink_links_created.length > 0) {
        for (const link of backlink_links_created) {
          allLinksToInsert.push({
            url: link.url,
            source_url: link.url, // Initially same as URL
            target_url: link.url, // Initially same as URL
            project_id: projectId,
            task_id: taskId,
            link_type: 'created',
            link_status: 'pending', // Status will be updated when report comes in
            submission_date: new Date().toISOString(),
            first_seen_date: new Date().toISOString(),
            last_updated_status: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }

      // Add indexed links to storage
      if (backlink_links_indexed && backlink_links_indexed.length > 0) {
        for (const link of backlink_links_indexed) {
          allLinksToInsert.push({
            url: link.url,
            source_url: link.url,
            target_url: link.url,
            project_id: projectId,
            task_id: taskId,
            link_type: 'indexed',
            link_status: 'pending', // Status will be updated when report comes in
            submission_date: new Date().toISOString(),
            first_seen_date: new Date().toISOString(),
            last_updated_status: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }

      // Add filtered links to storage
      if (backlink_links_filtered && backlink_links_filtered.length > 0) {
        for (const link of backlink_links_filtered) {
          allLinksToInsert.push({
            url: link.url,
            source_url: link.url,
            target_url: link.url,
            project_id: projectId,
            task_id: taskId,
            link_type: 'filtered',
            link_status: 'pending', // Status will be updated when report comes in
            submission_date: new Date().toISOString(),
            first_seen_date: new Date().toISOString(),
            last_updated_status: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }

      // Insert all links into backlinks table
      if (allLinksToInsert.length > 0) {
        const { error: linksInsertError } = await supabaseAdmin
          .from('backlinks')
          .insert(allLinksToInsert);
        
        if (linksInsertError) {
          console.error('Error inserting links to backlinks table:', linksInsertError);
          // Continue anyway since this is not critical for the report
        } else {
          console.log(`Inserted ${allLinksToInsert.length} links to backlinks table`);
        }
      }

      // Perform Mini-Audit on the submitted links
      const auditedCreated = await Promise.all(backlink_links_created.map(async (link: { url: string }) => {
        try {
          const res = await fetch(link.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          return { url: link.url, status: res.ok ? 'working' : 'dead' as const };
        } catch {
          return { url: link.url, status: 'dead' as const };
        }
      }));

      const auditedIndexed = await Promise.all(backlink_links_indexed.map(async (link: { url: string }) => {
        try {
          const res = await fetch(link.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          return { blog_url: link.url, is_indexed: true, interlinks: [], interlink_count: 0 }; // Simplified
        } catch {
          return { blog_url: link.url, is_indexed: false, interlinks: [], interlink_count: 0 };
        }
      }));

      const deadCount = auditedCreated.filter(l => l.status === 'dead').length;
      const workingCount = auditedCreated.length - deadCount;

      const status = deadCount > 0 ? 'critical' : (auditedCreated.length === 0 ? 'healthy' : 'healthy');

      const payload: BacklinkReportPayload = {
        created_links: auditedCreated,
        indexed_blogs: auditedIndexed.map(b => ({
          blog_url: b.blog_url,
          is_indexed: b.is_indexed,
          interlink_count: 0,
          interlinks: []
        })),
        issues: [],
        requires_attention: [],
        summary: {
          total_created_links: auditedCreated.length,
          working_links: workingCount,
          dead_links: deadCount,
          total_indexed_blogs: auditedIndexed.length,
          indexed_count: auditedIndexed.filter(b => b.is_indexed).length,
          not_indexed_count: auditedIndexed.filter(b => !b.is_indexed).length,
          total_interlinks: 0,
          working_interlinks: 0,
          dead_interlinks: 0
        }
      };

      // Create the backlink_report record
      const { data: newReport, error: insertError } = await supabaseAdmin
        .from('backlink_reports')
        .insert({
          task_id: taskId,
          project_id: projectId,
          assignee_id: assigneeId,
          status,
          payload,
          summary: payload.summary
        })
        .select()
        .single();

      if (insertError) throw insertError;
      console.log('Successfully created backlink report:', newReport?.id);
      reportData = newReport;
    } else {
      console.error('Request did not match webhook or direct_submission pattern');
      console.error('body.type:', body.type);
      console.error('body.direct_submission:', body.direct_submission);
      return new Response(
        JSON.stringify({ error: 'This function now expects a Supabase Database Webhook or direct_submission payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      id: reportId,
      task_id,
      project_id,
      assignee_id,
      status,
      // Handle both new and legacy schema
      payload: rawPayload,
      report_payload: legacyPayload,
      // Handle both summary locations
      summary: rawSummary,
      created_links_summary,
      indexed_blogs_summary
    } = reportData;

    // Normalize Payload
    let payload: BacklinkReportPayload;

    // Check if we have the new standard payload
    if (rawPayload && Object.keys(rawPayload).length > 0) {
      payload = rawPayload;
    }
    // Fallback to legacy structure
    else if (legacyPayload && Object.keys(legacyPayload).length > 0) {
      const p = legacyPayload;
      payload = {
        created_links: p.created_links?.dead_list ? p.created_links.dead_list.map((l: any) => ({ ...l, status: 'dead' })) : [], // Partial mapping
        indexed_blogs: p.indexed_blogs?.blog_details ? p.indexed_blogs.blog_details.map((b: any) => ({
          blog_url: b.blog_url,
          is_indexed: false, // Default or derived
          interlink_count: b.total_interlinks || 0,
          interlinks: b.interlinks || []
        })) : [],
        issues: p.requires_attention ? p.requires_attention.map((url: string) => ({ type: 'attention', severity: 'warning', url, message: 'Requires attention' })) : [],
        requires_attention: [],
        summary: {
          total_created_links: p.overall_summary?.total_links_checked || 0,
          working_links: p.overall_summary?.total_working || 0,
          dead_links: p.overall_summary?.total_dead || 0,
          total_indexed_blogs: p.indexed_blogs?.total_blogs || 0,
          indexed_count: 0,
          not_indexed_count: 0,
          total_interlinks: p.overall_summary?.total_interlinks || 0,
          working_interlinks: 0,
          dead_interlinks: 0
        }
      };

      // Attempt to clean up summary if generic summary exists
      if (p.summary) {
        payload.summary = { ...payload.summary, ...p.summary };
      }
    } else {
      // Empty default
      payload = {
        created_links: [],
        indexed_blogs: [],
        issues: [],
        requires_attention: [],
        summary: {
          total_created_links: 0, working_links: 0, dead_links: 0,
          total_indexed_blogs: 0, indexed_count: 0, not_indexed_count: 0,
          total_interlinks: 0, working_interlinks: 0, dead_interlinks: 0
        }
      };
    }

    if (!reportId || !task_id || !project_id || !assignee_id || !status) {
      console.error('Missing fields in record:', reportData);
      return new Response(
        JSON.stringify({ error: 'Missing required fields in record' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Update the original task status
    // Move to 'completed' and set badge
    const { error: taskUpdateError } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'completed',
        backlink_report_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task_id);

    if (taskUpdateError) {
      console.error('Error updating task:', taskUpdateError);
      // We continue automation even if task update fails, but log it.
    } else {
      console.log(`Task ${task_id} updated to completed with status ${status}`);
    }

    // 1.5 Update link statuses based on the report data
    try {
      // Extract all URLs from the report payload to update their statuses
      const createdLinkUrls = payload.created_links.map(cl => cl.url);
      const indexedBlogUrls = payload.indexed_blogs.map(ib => ib.blog_url);
      
      // Update created links status
      if (createdLinkUrls.length > 0) {
        for (const linkUrl of createdLinkUrls) {
          const linkEntry = payload.created_links.find(cl => cl.url === linkUrl);
          const linkStatus = linkEntry?.status || 'dead';
          
          // First get the backlink ID to properly track in history
          const { data: backlinkData, error: fetchError } = await supabaseAdmin
            .from('backlinks')
            .select('id, link_status')
            .eq('url', linkUrl)
            .eq('task_id', task_id)
            .eq('link_type', 'created')
            .maybeSingle();
          
          if (fetchError) {
            console.error('Error fetching backlink for history:', fetchError);
          } else if (backlinkData) {
            // Update the backlink status
            const { error: linkUpdateError } = await supabaseAdmin
              .from('backlinks')
              .update({
                link_status: linkStatus,
                last_updated_status: new Date().toISOString(),
                last_check_result: { 
                  status: linkStatus, 
                  checked_at: new Date().toISOString(),
                  original_status_from_report: linkEntry
                },
                report_id: reportId
              })
              .eq('id', backlinkData.id);
            
            if (linkUpdateError) {
              console.error('Error updating created link status:', linkUpdateError);
            } else {
              console.log(`Updated created link ${linkUrl} status to ${linkStatus}`);
              
              // Add to status history
              const { error: historyError } = await supabaseAdmin
                .from('backlink_status_history')
                .insert({
                  backlink_id: backlinkData.id,
                  old_status: backlinkData.link_status || 'pending',
                  new_status: linkStatus,
                  change_reason: 'Report check',
                  changed_at: new Date().toISOString(),
                  report_id: reportId
                });
              
              if (historyError) {
                console.error('Error inserting status history:', historyError);
              }
            }
          }
        }
      }

      // Update indexed links status
      if (indexedBlogUrls.length > 0) {
        for (const linkUrl of indexedBlogUrls) {
          const blogEntry = payload.indexed_blogs.find(ib => ib.blog_url === linkUrl);
          const linkStatus = blogEntry?.is_indexed ? 'working' : 'dead';
          
          // First get the backlink ID to properly track in history
          const { data: backlinkData, error: fetchError } = await supabaseAdmin
            .from('backlinks')
            .select('id, link_status')
            .eq('url', linkUrl)
            .eq('task_id', task_id)
            .eq('link_type', 'indexed')
            .maybeSingle();
          
          if (fetchError) {
            console.error('Error fetching indexed backlink for history:', fetchError);
          } else if (backlinkData) {
            const { error: linkUpdateError } = await supabaseAdmin
              .from('backlinks')
              .update({
                link_status: linkStatus,
                last_updated_status: new Date().toISOString(),
                last_check_result: { 
                  status: linkStatus, 
                  is_indexed: blogEntry?.is_indexed, 
                  checked_at: new Date().toISOString(),
                  original_entry_from_report: blogEntry
                },
                report_id: reportId
              })
              .eq('id', backlinkData.id);
            
            if (linkUpdateError) {
              console.error('Error updating indexed link status:', linkUpdateError);
            } else {
              console.log(`Updated indexed link ${linkUrl} status to ${linkStatus}`);
              
              // Add to status history
              const { error: historyError } = await supabaseAdmin
                .from('backlink_status_history')
                .insert({
                  backlink_id: backlinkData.id,
                  old_status: backlinkData.link_status || 'pending',
                  new_status: linkStatus,
                  change_reason: 'Report check',
                  changed_at: new Date().toISOString(),
                  report_id: reportId
                });
              
              if (historyError) {
                console.error('Error inserting indexed status history:', historyError);
              }
            }
          }
        }
      }

      // For filtered links, we assume they are intentionally filtered out, so we mark them as 'filtered'
      const { data: filteredLinksData, error: filteredFetchError } = await supabaseAdmin
        .from('backlinks')
        .select('id, link_status')
        .eq('task_id', task_id)
        .eq('link_type', 'filtered');
      
      if (filteredFetchError) {
        console.error('Error fetching filtered links:', filteredFetchError);
      } else if (filteredLinksData) {
        for (const filteredLink of filteredLinksData) {
          const { error: filteredUpdateError } = await supabaseAdmin
            .from('backlinks')
            .update({
              link_status: 'filtered',
              last_updated_status: new Date().toISOString(),
              last_check_result: { 
                status: 'filtered', 
                reason: 'Intentionally filtered', 
                checked_at: new Date().toISOString() 
              },
              report_id: reportId
            })
            .eq('id', filteredLink.id);
          
          if (filteredUpdateError) {
            console.error('Error updating filtered link status:', filteredUpdateError);
          } else {
            console.log(`Updated filtered link ${filteredLink.id} status to 'filtered'`);
            
            // Add to status history
            const { error: historyError } = await supabaseAdmin
              .from('backlink_status_history')
              .insert({
                backlink_id: filteredLink.id,
                old_status: filteredLink.link_status || 'pending',
                new_status: 'filtered',
                change_reason: 'Intentionally filtered',
                changed_at: new Date().toISOString(),
                report_id: reportId
              });
            
            if (historyError) {
              console.error('Error inserting filtered status history:', historyError);
            }
          }
        }
      }

    } catch (linkUpdateError) {
      console.error('Error updating link statuses:', linkUpdateError);
    }

    // 2. Generate Follow-up Tasks
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
            parent_report_id: reportId,
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

      // Update report to indicate follow-up tasks were created
      if (followUpTasksCreated > 0) {
        await supabaseAdmin
          .from('backlink_reports')
          .update({ follow_up_tasks_created: true })
          .eq('id', reportId);
      }
    }

    // 3. Create Notifications
    const notifications = [];

    // Assignee Notification
    notifications.push({
      user_id: assignee_id,
      type: 'backlink_report',
      title: `Backlink Report Generated: ${status.toUpperCase()}`,
      message: status === 'critical'
        ? `Your backlink report has critical issues. ${followUpTasksCreated} follow-up tasks have been created.`
        : status === 'warning'
          ? `Your backlink report has warnings. ${followUpTasksCreated} follow-up tasks have been created.`
          : 'Your backlink report shows all links are healthy!',
      data: { report_id: reportId, status },
      read: false,
    });

    // Notify Managers
    const { data: managersData } = await supabaseAdmin
      .from('project_members')
      .select('user_id, users:user_id (role)')
      .eq('project_id', project_id)
      .in('role', ['manager', 'admin']); // Assuming 'role' is stored in project_members or joined. 
    // NOTE: In the provided DB schema, project_members only has role if it has a role column, 
    // or we might need to check the users table. 
    // The schema shows: project_members(user_id, project_id, role).

    // However, existing code used: .select('user_id, users:user_id (role)'). 
    // If project_members has 'role', we can filter by it directly. 
    // If not, we rely on users table role.
    // Let's assume the previous code was roughly correct but verify if 'admin' is a valid role in project_members.
    // The snippet shows `.in('role', ['manager', 'admin'])`. 
    // I'll keep this logic but handle potential empty results gracefully.

    if (managersData) {
      for (const manager of managersData) {
        if (manager.user_id !== assignee_id) {
          notifications.push({
            user_id: manager.user_id,
            type: 'backlink_report',
            title: `New Backlink Report: ${status.toUpperCase()}`,
            message: `A ${status} backlink report has been generated for your project.`,
            data: { report_id: reportId, status, project_id },
            read: false,
          });
        }
      }
    }

    // Notify Super Admins (Critical only)
    if (status === 'critical') {
      const { data: superAdminsData } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'Super Admin');

      if (superAdminsData) {
        for (const admin of superAdminsData) {
          if (admin.id !== assignee_id) {
            notifications.push({
              user_id: admin.id,
              type: 'backlink_report',
              title: `Critical Backlink Report Alert`,
              message: `A critical backlink report has been generated and requires attention.`,
              data: { report_id: reportId, status, project_id },
              read: false,
            });
          }
        }
      }
    }

    // Insert Notifications
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

    return new Response(
      JSON.stringify({
        success: true,
        report_id: reportId,
        task_updated: !taskUpdateError,
        follow_up_tasks_created: followUpTasksCreated,
        notifications_sent: notifications.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
