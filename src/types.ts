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

// Backlink Report Types - Matches actual DB schema
export type BacklinkReportStatus = 'critical' | 'warning' | 'healthy';

export interface CreatedLinksSummary {
  dead: number;
  total: number;
  working: number;
  dead_list?: Array<{
    url: string;
    reason: string;
    status: number;
  }>;
}

export interface BlogInterlink {
  url: string;
  issue: string | null;
  title: string;
  anchor: string;
  status: 'working' | 'dead';
  is_relevant: boolean;
  relevance_score: number;
}

export interface BlogDetail {
  issues: string[];
  blog_url: string;
  blog_title: string;
  interlinks: BlogInterlink[];
  blog_status: 'critical' | 'warning' | 'healthy';
  dead_interlinks: number;
  total_interlinks: number;
  working_interlinks: number;
  irrelevant_interlinks: number;
}

export interface IndexedBlogsSummary {
  total_blogs: number;
  blog_details: BlogDetail[];
  healthy_blogs: number;
  warning_blogs: number;
  critical_blogs: number;
  interlinks_summary: {
    dead: number;
    working: number;
    irrelevant: number;
    total_interlinks: number;
  };
  requires_attention: string[];
}

export interface BacklinkReportPayload {
  id: string;
  status: BacklinkReportStatus;
  taskId: string;
  projectId: string;
  assigneeId: string;
  checked_at: string;
  projectName: string;
  submittedAt: string;
  assigneeName: string;
  created_links: CreatedLinksSummary;
  indexed_blogs: IndexedBlogsSummary;
  overall_summary: {
    total_dead: number;
    total_working: number;
    health_percentage: number;
    total_links_checked: number;
  };
}

export interface BacklinkReport {
  id: string;
  task_id: string | null;
  project_id: string;
  assignee_id: string;
  status: BacklinkReportStatus;
  submitted_at: string;
  checked_at: string | null;
  total_links_checked: number;
  total_working: number;
  total_dead: number;
  health_percentage: number;
  created_links_summary: CreatedLinksSummary;
  indexed_blogs_summary: IndexedBlogsSummary;
  report_payload: BacklinkReportPayload;
}

export interface TeamMember {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}