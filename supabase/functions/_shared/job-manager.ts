
import { createClient } from "@supabase/supabase-js";

export type JobStatus = 'queued' | 'processing' | 'partial' | 'completed' | 'failed';

export class JobManager {
    private supabase;

    constructor() {
        this.supabase = createClient(
            Deno.env.get('VITE_SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
    }

    async getJob(jobId: string) {
        const { data, error } = await this.supabase
            .from('jobs')
            .select('*, job_state(*)')
            .eq('id', jobId)
            .single();
        if (error) throw error;
        return data;
    }

    async updateStatus(jobId: string, status: JobStatus, errorMessage?: string) {
        const update: any = { status };
        if (status === 'processing' && !errorMessage) update.started_at = new Date().toISOString();
        if ((status === 'completed' || status === 'failed' || status === 'partial') && !errorMessage) update.completed_at = new Date().toISOString();
        if (errorMessage) update.error_message = errorMessage;

        const { error } = await this.supabase
            .from('jobs')
            .update(update)
            .eq('id', jobId);
        if (error) console.error("Status update error:", error);
    }

    async updateState(jobId: string, cursor: any, progress: any) {
        const { error } = await this.supabase
            .from('job_state')
            .upsert({
                job_id: jobId,
                cursor,
                batch_progress: progress,
                updated_at: new Date().toISOString()
            });
        if (error) console.error("State update error:", error);
    }

    async log(jobId: string, functionName: string, level: 'info' | 'warn' | 'error', message: string, meta: any = {}) {
        const { error } = await this.supabase
            .from('execution_logs')
            .insert({
                job_id: jobId,
                function_name: functionName,
                level,
                message,
                meta
            });
        if (error) console.error("Logging error:", error);
    }
}

export const jobManager = new JobManager();
