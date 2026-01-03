import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Page } from "@/types";

// Fetch pages based on user role
export function usePages() {
  return useQuery<Page[], Error>({
    queryKey: ['pages'],
    queryFn: async () => {
      // First, get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Check user role
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      
      if (roleError) {
        throw new Error(roleError.message);
      }
      
      let query;
      
      if (userData?.role === 'Developer') {
        // For developers, fetch only pages from assigned projects
        // Join pages with websites and project_members to get only assigned project pages
        query = supabase
          .from('pages')
          .select("pages.id, pages.url, pages.title, pages.page_type, pages.content_score, pages.technical_score, pages.last_audited, pages.website_id, pages.created_at")
          .join('websites', 'pages.website_id', 'websites.id')
          .join('project_members', 'websites.project_id', 'project_members.project_id')
          .eq('project_members.user_id', user.id);
      } else {
        // For other roles, fetch all pages
        query = supabase
          .from("pages")
          .select("id, url, title, page_type, content_score, technical_score, last_audited, website_id, created_at")
          .order("created_at", { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    }
  });
}

// Invalidate pages query
export function useInvalidatePages() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['pages'] });
  };
}