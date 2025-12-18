// Custom hooks for consistent Supabase + React Query usage
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// Generic hook for fetching data
export function useSupabaseQuery<T>(
  queryKey: string | string[],
  table: string,
  selectQuery: string = "*",
  filters: Record<string, any> = {}
) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      let query = supabase.from(table).select(selectQuery);
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data as T[];
    }
  });
}

// Generic hook for creating records
export function useCreateRecord(table: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newRecord: Record<string, any>) => {
      const { error } = await supabase.from(table).insert(newRecord);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries related to this table
      queryClient.invalidateQueries({ queryKey: [table] });
    }
  });
}

// Generic hook for updating records
export function useUpdateRecord(table: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase.from(table).update(updates).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries related to this table
      queryClient.invalidateQueries({ queryKey: [table] });
    }
  });
}

// Generic hook for deleting records
export function useDeleteRecord(table: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      // Invalidate queries related to this table
      queryClient.invalidateQueries({ queryKey: [table] });
    }
  });
}