export interface Project {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
  user_id?: string;
}

export interface Page {
  id: string;
  url: string;
  title?: string;
  page_type?: string;
  content_score?: number;
  technical_score?: number;
  last_audited?: string;
  website_id?: string;
  created_at?: string;
}

// Backlink Report Types
export type BacklinkReportStatus = 'critical' | 'warning' | 'healthy';

export interface BacklinkReportSummary {
  total_created_links: number;
  working_links: number;
  dead_links: number;
  total_indexed_blogs: number;
  indexed_count: number;
  not_indexed_count: number;
  total_interlinks: number;
  working_interlinks: number;
  dead_interlinks: number;
}

export interface BacklinkReportIssue {
  type: 'dead_link' | 'not_indexed' | 'dead_interlink' | 'low_interlinks' | 'irrelevant_link';
  severity: 'critical' | 'warning';
  url?: string;
  blog_url?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface BacklinkReportPayload {
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
  issues: BacklinkReportIssue[];
  requires_attention: BacklinkReportIssue[];
  summary: BacklinkReportSummary;
}

export interface BacklinkReport {
  id: string;
  task_id: string;
  project_id: string;
  assignee_id: string;
  status: BacklinkReportStatus;
  summary: BacklinkReportSummary;
  payload: BacklinkReportPayload;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  follow_up_tasks_created?: boolean;
}

export interface TeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}