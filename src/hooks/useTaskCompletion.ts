import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/AuthGate';

interface TaskCompletionData {
  taskId: string;
  projectId: string;
  assigneeId: string;
  details: string;
  docUrl?: string;
  backlinkSummary?: string;
  backlinkLinksCreated?: Array<{ url: string }>;
  backlinkLinksIndexed?: Array<{ url: string }>;
  backlinkLinksFiltered?: Array<{ url: string }>;
  backlinkSubmissionType?: 'create' | 'index' | 'both' | 'filtered';
}

export function useTaskCompletion() {
  const queryClient = useQueryClient();
  const { teamUser } = useAuth();

  const completeTask = useMutation({
    mutationFn: async (data: TaskCompletionData) => {
      // First, update the task status to 'completed'
      const { error: taskUpdateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completion_details: data.details,
          completion_doc_url: data.docUrl || null,
          backlink_summary: data.backlinkSummary || null,
          backlink_links_created: data.backlinkLinksCreated || null,
          backlink_links_indexed: data.backlinkLinksIndexed || null,
          backlink_links_filtered: data.backlinkLinksFiltered || null,
          backlink_submission_type: data.backlinkSubmissionType || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.taskId);

      if (taskUpdateError) {
        throw new Error(`Failed to update task: ${taskUpdateError.message}`);
      }

      // If this is a backlink task, trigger the backlink report processing
      if (data.backlinkLinksCreated || data.backlinkLinksIndexed || data.backlinkLinksFiltered) {
        try {
          // Call the process-backlink-report function
          const { data: responseData, error: functionError } = await supabase.functions.invoke('process-backlink-report', {
            body: {
              direct_submission: true,
              taskId: data.taskId,
              projectId: data.projectId,
              assigneeId: data.assigneeId,
              backlink_links_created: data.backlinkLinksCreated || [],
              backlink_links_indexed: data.backlinkLinksIndexed || [],
              backlink_links_filtered: data.backlinkLinksFiltered || [],
              backlink_submission_type: data.backlinkSubmissionType,
            },
          });

          if (functionError) {
            console.error('Error calling process-backlink-report function:', functionError);
            // Don't throw here as the task is already completed successfully
            // The backlink processing can be handled separately
          } else {
            console.log('Backlink report processing triggered successfully:', responseData);
          }
        } catch (error) {
          console.error('Error triggering backlink report processing:', error);
          // Continue as the task completion was successful
        }
      }

      return { success: true, taskId: data.taskId };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['backlinks'] });
      queryClient.invalidateQueries({ queryKey: ['backlink-reports'] });
      
      // If this was a backlink task, also refresh backlink-related data
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['backlinks', data.taskId] });
        queryClient.invalidateQueries({ queryKey: ['backlink-reports-by-task', data.taskId] });
      }
    },
  });

  return {
    completeTask: completeTask.mutate,
    isCompleting: completeTask.isPending,
    completionError: completeTask.error,
    completionSuccess: completeTask.isSuccess,
  };
}