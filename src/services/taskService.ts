import { supabase } from '@/lib/supabaseClient';
import { BacklinkReportPayload } from '@/types';
import { processBacklinkReportDirectly } from './directBacklinkProcessor';

export interface TaskCompletionData {
  taskId: string;
  projectId: string;
  assigneeId: string;
  backlink_links_created?: Array<{ url: string }>;
  backlink_links_indexed?: Array<{ url: string }>;
  backlink_links_filtered?: Array<{ url: string }>;
  backlink_submission_type?: 'create' | 'index' | 'both' | 'filtered' | null;
  completion_details: string;
  completion_doc_url?: string;
  backlink_summary?: string;
}

export async function completeTaskAndProcessBacklinks(data: TaskCompletionData) {
  try {
    // First, update the task status to 'completed'
    const { error: taskUpdateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completion_details: data.completion_details,
        completion_doc_url: data.completion_doc_url,
        backlink_summary: data.backlink_summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.taskId);

    if (taskUpdateError) {
      throw new Error(`Failed to update task: ${taskUpdateError.message}`);
    }

    // If this is a backlink task, create a backlink report record to trigger webhook processing
    if (data.backlink_links_created || data.backlink_links_indexed || data.backlink_links_filtered) {
      // Create a backlink report record which should trigger the webhook
      const { data: reportData, error: reportError } = await supabase
        .from('backlink_reports')
        .insert({
          task_id: data.taskId,
          project_id: data.projectId,
          assignee_id: data.assigneeId,
          status: 'warning', // Default status, will be updated by webhook processing
          report_payload: {
            created_links: {
              dead: 0,
              total: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0),
              warning: 0,
              working: 0,
              dead_list: data.backlink_links_created?.filter(link => link.url.includes('dead')) || [],
              warning_list: data.backlink_links_created?.filter(link => link.url.includes('warning')) || []
            },
            indexed_blogs: null,
            overall_summary: {
              total_dead: 0,
              total_warning: 0,
              total_working: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0),
              health_percentage: 100,
              total_links_checked: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0)
            },
            submission_type: data.backlink_submission_type || 'create'
          },
          created_links_summary: {
            dead: 0,
            total: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0),
            warning: 0,
            working: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0),
            dead_list: [],
            warning_list: []
          },
          indexed_blogs_summary: null,
          summary: {
            total_dead: 0,
            total_warning: 0,
            total_working: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0),
            health_percentage: 100,
            total_links_checked: (data.backlink_links_created?.length || 0) + (data.backlink_links_indexed?.length || 0)
          }
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error creating backlink report:', reportError);
        throw new Error(`Failed to create backlink report: ${reportError.message}`);
      }

      console.log('Created backlink report for webhook processing:', reportData?.id);

      return {
        success: true,
        taskUpdated: true,
        backlinkProcessingResult: reportData
      };
    }

    return {
      success: true,
      taskUpdated: true,
      backlinkProcessingResult: null
    };

  } catch (error) {
    console.error('Error completing task:', error);
    throw error;
  }
}

export async function getTaskBacklinkReport(taskId: string) {
  try {
    const { data, error } = await supabase
      .from('backlink_reports')
      .select('*')
      .eq('task_id', taskId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No report found
        return null;
      }
      throw new Error(`Failed to fetch backlink report: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching task backlink report:', error);
    throw error;
  }
}

export async function updateBacklinkStatusesFromReport(taskId: string, reportPayload: BacklinkReportPayload) {
  try {
    // Extract URLs and their statuses from the report
    const linkUpdates = [];
    
    // Process dead links from created_links
    if (reportPayload.dead_list && Array.isArray(reportPayload.dead_list)) {
      for (const deadLink of reportPayload.dead_list) {
        linkUpdates.push({
          url: deadLink.url,
          status: 'dead',
          reason: deadLink.reason || 'Reported as dead',
          confidence: deadLink.confidence || 0
        });
      }
    }

    // Process warning links from created_links.warning_list
    if (reportPayload.created_links?.warning_list && Array.isArray(reportPayload.created_links.warning_list)) {
      for (const warningLink of reportPayload.created_links.warning_list) {
        linkUpdates.push({
          url: warningLink.url,
          status: 'warning',
          reason: warningLink.reason || 'Reported as warning',
          confidence: warningLink.confidence || 0
        });
      }
    }

    // Process working links (implied from total_working count)
    // This would require more detailed report structure to identify specific working links

    // Update backlink statuses in the database
    const updatePromises = linkUpdates.map(async (linkUpdate) => {
      const { error: updateError } = await supabase
        .from('backlinks')
        .update({
          link_status: linkUpdate.status,
          last_updated_status: new Date().toISOString(),
          last_check_result: {
            status: linkUpdate.status,
            reason: linkUpdate.reason,
            confidence: linkUpdate.confidence,
            checked_at: new Date().toISOString()
          }
        })
        .eq('task_id', taskId)
        .eq('url', linkUpdate.url);

      if (updateError) {
        console.error(`Error updating link ${linkUpdate.url}:`, updateError);
      } else {
        console.log(`Updated link ${linkUpdate.url} to status: ${linkUpdate.status}`);
      }
    });

    await Promise.all(updatePromises);

    return {
      success: true,
      updatedLinks: linkUpdates.length
    };

  } catch (error) {
    console.error('Error updating backlink statuses:', error);
    throw error;
  }
}