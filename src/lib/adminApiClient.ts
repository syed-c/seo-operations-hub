// Helper functions to call admin Edge Functions
// This provides a secure way to perform admin operations without exposing service role keys

import { supabase } from './supabaseClient';

/**
 * Call the admin function using Supabase functions.invoke
 * @param action The action to perform (create, update, delete, select)
 * @param table The table to operate on
 * @param data The data for the operation
 * @param filters Optional filters for update/delete/select operations
 * @returns The response from the Edge Function
 */
/**
 * Call the admin function using Supabase functions.invoke
 * @param action The action to perform (create, update, delete, select)
 * @param table The table to operate on
 * @param data The data for the operation
 * @param filters Optional filters for update/delete/select operations
 * @returns The response from the Edge Function
 */
export async function callAdminFunction<T = unknown>(
  action: string,
  table: string,
  data?: unknown,
  filters?: Record<string, unknown>
): Promise<{ data?: T; error?: string; status?: number }> {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log('[adminApiClient] Calling admin-users function:', { action, table, data, filters });

    const { data: result, error } = await supabase.functions.invoke('admin-users', {
      body: { action, table, data, filters }
    });

    console.log('[adminApiClient] Edge function response:', { result, error });

    // Check if there's an error from the Edge Function
    if (error) {
      console.error('[adminApiClient] Error calling admin function:', error);
      if (error?.status === 409 || error?.message?.includes('email_exists')) {
        return { error: error.message || 'A user with this email already exists', status: 409 };
      }
      throw new Error(error.message || 'Admin function call failed');
    }

    // Check if result contains an error from the edge function
    if (result?.error) {
      console.error('[adminApiClient] Edge function returned error:', result.error);
      if (result.error.includes('email_exists') || result.error.includes('A user with this email already exists')) {
        return { error: result.error, status: 409 };
      }
      throw new Error(result.error);
    }

    console.log('[adminApiClient] Returning result:', result);
    return result as { data?: T; error?: string; status?: number };
  } catch (error) {
    console.error('[adminApiClient] Exception in callAdminFunction:', error);
    throw error;
  }
}

/**
 * Create a record (admin operation)
 * @param table The table to create the record in
 * @param data The data to create
 * @returns The created record
 */
export async function createRecord<T = unknown>(table: string, data: unknown) {
  return callAdminFunction<T>('create', table, data);
}

/**
 * Update records (admin operation)
 * @param table The table to update records in
 * @param data The data to update
 * @param filters Filters to identify which records to update
 * @returns The updated records
 */
export async function updateRecords<T = unknown>(table: string, data: unknown, filters: Record<string, unknown>) {
  return callAdminFunction<T>('update', table, data, filters);
}

/**
 * Delete records (admin operation)
 * @param table The table to delete records from
 * @param filters Filters to identify which records to delete
 * @returns The result of the deletion
 */
export async function deleteRecords(table: string, filters: Record<string, unknown>) {
  return callAdminFunction('delete', table, undefined, filters);
}

/**
 * Select records (admin operation)
 * @param table The table to select records from
 * @param select Optional select query
 * @param filters Optional filters for the selection
 * @returns The selected records
 */
export async function selectRecords<T = unknown>(table: string, select?: string, filters?: Record<string, unknown>) {
  return callAdminFunction<T[]>('select', table, { select }, filters);
}

// Legacy user functions for backward compatibility
export async function createUser(userData: Record<string, unknown>) {
  return createRecord('users', userData);
}

export async function updateUser(userData: { id: string;[key: string]: unknown }) {
  return updateRecords('users', userData, { id: userData.id });
}

export async function deleteUser(userId: string) {
  return deleteRecords('users', { id: userId });
}
