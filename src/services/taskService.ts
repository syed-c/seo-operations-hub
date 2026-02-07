import { supabase } from '@/lib/supabaseClient';
import { BacklinkReportPayload } from '@/types';

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

    // If this is a backlink task, trigger the backlink report processing
    if (data.backlink_links_created || data.backlink_links_indexed || data.backlink_links_filtered) {
      // Call the Supabase function to process backlinks
      const { data: result, error: functionError } = await supabase
        .functions
        .invoke('process-backlink-report', {
          body: {
            direct_submission: true,
            taskId: data.taskId,
            projectId: data.projectId,
            assigneeId: data.assigneeId,
            backlink_links_created: data.backlink_links_created || [],
            backlink_links_indexed: data.backlink_links_indexed || [],
            backlink_links_filtered: data.backlink_links_filtered || [],
            backlink_submission_type: data.backlink_submission_type,
          }
        });

      if (functionError) {
        console.error('Error calling process-backlink-report function:', functionError);
        throw new Error(`Failed to process backlinks: ${functionError.message}`);
      }

      return {
        success: true,
        taskUpdated: true,
        backlinkProcessingResult: result
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