// Notification service helper functions
import { supabase } from "@/lib/supabaseClient";
import { callAdminFunction } from "@/lib/adminApiClient";

// Types
interface NotificationData {
  user_id: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
}

interface TriggerNotificationParams {
  event_type: string;
  data: {
    title?: string;
    message?: string;
    type?: 'info' | 'warning' | 'success' | 'error';
    [key: string]: unknown;
  };
  user_id?: string;
  project_id?: string;
}

/**
 * Create a notification in the database
 * @param notificationData The notification data
 * @returns The created notification
 */
export async function createNotification(notificationData: NotificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'info',
          is_read: false
        }
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Trigger a notification event that will be sent through all enabled channels
 * @param params The notification parameters
 * @returns The result of the notification trigger
 */
export async function triggerNotification(params: TriggerNotificationParams) {
  try {
    // If user_id is not provided but project_id is, get all users for that project
    let userIds: string[] = [];
    if (params.user_id) {
      userIds = [params.user_id];
    } else if (params.project_id) {
      // Get all users associated with the project
      const { data: projectMembers, error: membersError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', params.project_id);

      if (membersError) {
        throw new Error(`Failed to fetch project members: ${membersError.message}`);
      }

      userIds = projectMembers?.map(member => member.user_id) || [];
    }

    if (userIds.length === 0) {
      throw new Error('No users specified for notification');
    }

    // Create notifications for each user
    const notifications = [];
    for (const userId of userIds) {
      const notification = await createNotification({
        user_id: userId,
        title: params.data.title || 'Notification',
        message: params.data.message || 'You have a new notification',
        type: params.data.type || 'info'
      });
      notifications.push(notification);
    }

    // In a real implementation, you would trigger the Edge Function to send notifications
    // For now, we'll simulate this by logging
    console.log('Triggering notifications for:', notifications);
    console.log('Event type:', params.event_type);
    console.log('Data:', params.data);

    // Example of how you would call the Edge Function in a real implementation:
    /*
    const response = await fetch('/functions/v1/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_ids: notifications.map(n => n.id),
        event_type: params.event_type,
        data: params.data
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to trigger notification: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    */

    // Return simulated success
    return {
      success: true,
      message: `Notifications created for ${notifications.length} user(s)`,
      notifications
    };
  } catch (error) {
    console.error('Error triggering notification:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 * @param notificationId The ID of the notification to mark as read
 * @returns The updated notification
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId The ID of the user
 * @returns The result of the operation
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { error, count } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notifications count for a user
 * @param userId The ID of the user
 * @returns The count of unread notifications
 */
export async function getUnreadNotificationsCount(userId: string) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to get unread notifications count: ${error.message}`);
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    throw error;
  }
}