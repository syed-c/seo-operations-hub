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
export async function callAdminFunction(action: string, table: string, data?: any, filters?: Record<string, any>) {
  try {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const { data: result, error } = await supabase.functions.invoke('admin-users', {
      body: { action, table, data, filters }
    });

    // Check if there's an error from the Edge Function
    // Note: The Edge Function returns 409 for duplicate emails, which Supabase treats as an error
    if (error) {
      console.error('Error calling admin function:', error);
      // Check if this is a 409 conflict error (duplicate email)
      if (error?.status === 409 || error?.message?.includes('email_exists')) {
        // Return the error as part of the response instead of throwing it
        return { error: error.message || 'A user with this email already exists', status: 409 };
      }
      throw new Error(error.message || 'Admin function call failed');
    }
    
    // Check if result contains an error from the edge function
    if (result?.error) {
      // Check if this is a duplicate email error
      if (result.error.includes('email_exists') || result.error.includes('A user with this email already exists')) {
        return { error: result.error, status: 409 };
      }
      throw new Error(result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error calling admin function:', error);
    throw error;
  }
}

/**
 * Create a record (admin operation)
 * @param table The table to create the record in
 * @param data The data to create
 * @returns The created record
 */
export async function createRecord(table: string, data: any) {
  return callAdminFunction('create', table, data);
}

/**
 * Update records (admin operation)
 * @param table The table to update records in
 * @param data The data to update
 * @param filters Filters to identify which records to update
 * @returns The updated records
 */
export async function updateRecords(table: string, data: any, filters: Record<string, any>) {
  return callAdminFunction('update', table, data, filters);
}

/**
 * Delete records (admin operation)
 * @param table The table to delete records from
 * @param filters Filters to identify which records to delete
 * @returns The result of the deletion
 */
export async function deleteRecords(table: string, filters: Record<string, any>) {
  return callAdminFunction('delete', table, undefined, filters);
}

/**
 * Select records (admin operation)
 * @param table The table to select records from
 * @param select Optional select query
 * @param filters Optional filters for the selection
 * @returns The selected records
 */
export async function selectRecords(table: string, select?: string, filters?: Record<string, any>) {
  return callAdminFunction('select', table, { select }, filters);
}

// Legacy user functions for backward compatibility
export async function createUser(userData: any) {
  return createRecord('users', userData);
}

export async function updateUser(userData: any) {
  return updateRecords('users', userData, { id: userData.id });
}

export async function deleteUser(userId: string) {
  return deleteRecords('users', { id: userId });
}
