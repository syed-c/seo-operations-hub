/**
 * Safe query helper that catches all Supabase errors and never throws
 * @param promise - The Supabase query promise
 * @returns Object with data or null and error or null
 */
export async function safeQuery<T>(promise: Promise<any>): Promise<{ data: T | null; error: any | null }> {
  try {
    const result = await promise;
    if (result.error) {
      console.error('Supabase query error:', result.error);
      return { data: null, error: result.error };
    }
    return { data: result.data as T, error: null };
  } catch (error) {
    console.error('Unexpected error in safeQuery:', error);
    return { data: null, error };
  }
}