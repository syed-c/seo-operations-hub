export interface Project {
  id: string;
  name: string;
  client?: string;
  status?: string;
  health_score?: number;
  created_at?: string;
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