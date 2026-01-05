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
        // First, get the project IDs assigned to the user
        const { data: projectMemberData, error: projectMemberError } = await supabase
          .from('project_members')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (projectMemberError) {
          throw new Error(projectMemberError.message);
        }
        
        if (!projectMemberData || projectMemberData.length === 0) {
          // No projects assigned to this user
          return [];
        }
        
        // Extract project IDs
        const projectIds = projectMemberData.map(pm => pm.project_id);
        
        // Then get websites associated with those projects
        const { data: websitesData, error: websitesError } = await supabase
          .from('websites')
          .select('id')
          .in('project_id', projectIds);
        
        if (websitesError) {
          throw new Error(websitesError.message);
        }
        
        if (!websitesData || websitesData.length === 0) {
          // No websites in assigned projects
          return [];
        }
        
        // Extract website IDs
        const websiteIds = websitesData.map(website => website.id);
        
        // Finally, fetch the pages from those websites
        const { data, error } = await supabase
          .from('pages')
          .select('id, url, title, page_type, content_score, technical_score, last_audited, website_id, created_at')
          .in('website_id', websiteIds);
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data || [];
      } else {
        // For other roles, fetch all pages
        const { data, error } = await supabase
          .from('pages')
          .select('id, url, title, page_type, content_score, technical_score, last_audited, website_id, created_at')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(error.message);
        }
        
        return data || [];
      }
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