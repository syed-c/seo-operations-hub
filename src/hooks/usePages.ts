import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Page } from "@/types";

// Fetch all pages
export function usePages() {
  return useQuery<Page[], Error>({
    queryKey: ['pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, url, title, page_type, content_score, technical_score, last_audited, website_id, created_at")
        .order("created_at", { ascending: false });
      
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