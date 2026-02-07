import { supabase } from '@/lib/supabaseClient';
import { BacklinkReportPayload } from '@/types';

export interface DirectBacklinkProcessingData {
  taskId: string;
  projectId: string;
  assigneeId: string;
  backlink_links_created?: Array<{ url: string }>;
  backlink_links_indexed?: Array<{ url: string }>;
  backlink_links_filtered?: Array<{ url: string }>;
  rawReportPayload?: any; // The raw JSON payload from the report
}

export async function processBacklinksDirectly(data: DirectBacklinkProcessingData) {
  try {
    console.log('Processing backlinks directly for task:', data.taskId);
    
    // If we have raw report payload, process it directly
    if (data.rawReportPayload) {
      await processRawReportPayload(data.taskId, data.rawReportPayload);
    }
    
    // If we have link lists, store them in backlinks table
    if (data.backlink_links_created || data.backlink_links_indexed || data.backlink_links_filtered) {
      await storeBacklinkEntries(data);
    }
    
    // Update task status to completed
    const { error: taskUpdateError } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        backlink_report_status: 'healthy',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.taskId);
    
    if (taskUpdateError) {
      console.error('Error updating task status:', taskUpdateError);
      throw new Error(`Failed to update task: ${taskUpdateError.message}`);
    }
    
    console.log('Successfully processed backlinks for task:', data.taskId);
    
    return {
      success: true,
      message: 'Backlinks processed successfully'
    };
    
  } catch (error) {
    console.error('Error in direct backlink processing:', error);
    throw error;
  }
}

async function processRawReportPayload(taskId: string, payload: any) {
  try {
    console.log('Processing raw report payload for task:', taskId);
    console.log('Payload structure:', JSON.stringify(payload, null, 2));
    
    // Extract links from the payload structure
    const linksToUpdate: Array<{url: string, status: string, reason?: string}> = [];
    
    // Process created_links section
    if (payload.created_links) {
      // Process dead links
      if (payload.created_links.dead_list && Array.isArray(payload.created_links.dead_list)) {
        for (const deadLink of payload.created_links.dead_list) {
          linksToUpdate.push({
            url: deadLink.url,
            status: 'dead',
            reason: deadLink.reason || 'Reported as dead'
          });
        }
      }
      
      // Process warning links
      if (payload.created_links.warning_list && Array.isArray(payload.created_links.warning_list)) {
        for (const warningLink of payload.created_links.warning_list) {
          linksToUpdate.push({
            url: warningLink.url,
            status: 'warning',
            reason: warningLink.reason || 'Reported as warning'
          });
        }
      }
      
      // Process working links (implied from total_working count)
      const workingCount = payload.created_links.working || 0;
      if (workingCount > 0) {
        // Get pending links and mark them as working
        const { data: pendingLinks, error: fetchError } = await supabase
          .from('backlinks')
          .select('id, url')
          .eq('task_id', taskId)
          .eq('link_status', 'pending')
          .limit(workingCount);
        
        if (fetchError) {
          console.error('Error fetching pending links:', fetchError);
        } else if (pendingLinks) {
          for (const link of pendingLinks) {
            linksToUpdate.push({
              url: link.url,
              status: 'working',
              reason: 'Confirmed working after report check'
            });
          }
        }
      }
    }
    
    // Process indexed blogs section
    if (payload.indexed_blogs?.blog_details && Array.isArray(payload.indexed_blogs.blog_details)) {
      for (const blog of payload.indexed_blogs.blog_details) {
        if (blog.interlinks && Array.isArray(blog.interlinks)) {
          for (const interlink of blog.interlinks) {
            linksToUpdate.push({
              url: interlink.url,
              status: interlink.status === 'working' ? 'working' : 'dead',
              reason: interlink.issue || `Interlink status: ${interlink.status}`
            });
          }
        }
      }
    }
    
    // Update link statuses in database
    console.log(`Updating ${linksToUpdate.length} links`);
    for (const linkUpdate of linksToUpdate) {
      const { error: updateError } = await supabase
        .from('backlinks')
        .update({
          link_status: linkUpdate.status,
          last_updated_status: new Date().toISOString(),
          last_check_result: {
            status: linkUpdate.status,
            reason: linkUpdate.reason,
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
    }
    
    // Also update filtered links
    const { error: filteredUpdateError } = await supabase
      .from('backlinks')
      .update({
        link_status: 'filtered',
        last_updated_status: new Date().toISOString(),
        last_check_result: {
          status: 'filtered',
          reason: 'Intentionally filtered',
          checked_at: new Date().toISOString()
        }
      })
      .eq('task_id', taskId)
      .eq('link_type', 'filtered');
    
    if (filteredUpdateError) {
      console.error('Error updating filtered links:', filteredUpdateError);
    } else {
      console.log('Updated filtered links to filtered status');
    }
    
  } catch (error) {
    console.error('Error processing raw report payload:', error);
    throw error;
  }
}

async function storeBacklinkEntries(data: DirectBacklinkProcessingData) {
  try {
    const allLinksToInsert = [];
    
    // Add created links
    if (data.backlink_links_created && data.backlink_links_created.length > 0) {
      for (const link of data.backlink_links_created) {
        allLinksToInsert.push({
          url: link.url,
          source_url: link.url,
          target_url: link.url,
          project_id: data.projectId,
          task_id: data.taskId,
          link_type: 'created',
          link_status: 'pending',
          submission_date: new Date().toISOString(),
          first_seen_date: new Date().toISOString(),
          last_updated_status: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Add indexed links
    if (data.backlink_links_indexed && data.backlink_links_indexed.length > 0) {
      for (const link of data.backlink_links_indexed) {
        allLinksToInsert.push({
          url: link.url,
          source_url: link.url,
          target_url: link.url,
          project_id: data.projectId,
          task_id: data.taskId,
          link_type: 'indexed',
          link_status: 'pending',
          submission_date: new Date().toISOString(),
          first_seen_date: new Date().toISOString(),
          last_updated_status: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Add filtered links
    if (data.backlink_links_filtered && data.backlink_links_filtered.length > 0) {
      for (const link of data.backlink_links_filtered) {
        allLinksToInsert.push({
          url: link.url,
          source_url: link.url,
          target_url: link.url,
          project_id: data.projectId,
          task_id: data.taskId,
          link_type: 'filtered',
          link_status: 'pending',
          submission_date: new Date().toISOString(),
          first_seen_date: new Date().toISOString(),
          last_updated_status: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Insert all links
    if (allLinksToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('backlinks')
        .insert(allLinksToInsert);
      
      if (insertError) {
        console.error('Error inserting backlink entries:', insertError);
        throw new Error(`Failed to insert backlink entries: ${insertError.message}`);
      }
      
      console.log(`Inserted ${allLinksToInsert.length} backlink entries`);
    }
    
  } catch (error) {
    console.error('Error storing backlink entries:', error);
    throw error;
  }
}