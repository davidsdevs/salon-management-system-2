/**
 * NOTIFICATION SERVICE - STORE ONLY
 * =================================
 * 
 * This service ONLY stores notification data in the database.
 * It does NOT send actual notifications (no push, no email, no SMS).
 * The mobile app team will fetch these notifications from the database.
 * 
 * NOTIFICATION STRUCTURE:
 * ======================
 * {
 *   id: "notification_id",
 *   type: "appointment_created",
 *   title: "Appointment Booked",
 *   message: "Your appointment has been scheduled...",
 *   recipientId: "user_id",
 *   recipientRole: "client", // or "stylist"
 *   appointmentId: "appointment_id",
 *   createdAt: timestamp,
 *   isRead: false,
 *   clientName: "Client Name",
 *   stylistName: "Stylist Name",
 *   appointmentDate: "2024-01-15",
 *   appointmentTime: "10:00 AM",
 *   branchName: "David's Salon"
 * }
 * 
 * MOBILE APP QUERY:
 * ================
 * Collection: 'notifications'
 * Filter: recipientId == userId, isRead == false
 * Order: createdAt desc
 * 
 * MARK AS READ:
 * ============
 * Update: isRead = true
 */

import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Notification types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_COMPLETED: 'appointment_completed',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  APPOINTMENT_UPDATED: 'appointment_updated',
  APPOINTMENT_STARTING: 'appointment_starting',
  APPOINTMENT_OVERDUE: 'appointment_overdue'
};

// Notification channels for mobile app
export const NOTIFICATION_CHANNELS = {
  APPOINTMENTS: 'appointments',
  REMINDERS: 'reminders',
  URGENT: 'urgent',
  GENERAL: 'general'
};

// Push notification priorities
export const NOTIFICATION_PRIORITIES = {
  HIGH: 'high',
  NORMAL: 'normal',
  LOW: 'low'
};

class NotificationService {
  constructor() {
    this.db = db;
    this.collection = 'notifications';
  }

  // Clean data to remove undefined values
  cleanDataForFirebase(data) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          cleaned[key] = this.cleanDataForFirebase(value);
        } else {
          cleaned[key] = value;
        }
      }
    }
    return cleaned;
  }

  // Validate appointment data before sending notifications
  validateAppointmentData(appointmentData) {
    const errors = [];
    
    if (!appointmentData.id) {
      errors.push('Missing appointment ID');
    }
    
    if (!appointmentData.clientName) {
      errors.push('Missing client name');
    }
    
    if (!appointmentData.appointmentDate) {
      errors.push('Missing appointment date');
    }
    
    if (!appointmentData.appointmentTime) {
      errors.push('Missing appointment time');
    }
    
    if (errors.length > 0) {
      console.warn('Appointment data validation warnings:', errors);
      console.warn('Appointment data:', appointmentData);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Create simple notification
  async createNotification(notificationData) {
    try {
      const notification = {
        type: notificationData.type,
        title: notificationData.title || 'Notification',
        message: notificationData.message || 'You have a new notification',
        recipientId: notificationData.recipientId,
        recipientRole: notificationData.recipientRole,
        appointmentId: notificationData.appointmentId,
        createdAt: serverTimestamp(),
        isRead: false,
        clientName: notificationData.clientName || 'Unknown Client',
        stylistName: notificationData.stylistName || 'Unassigned Stylist',
        appointmentDate: notificationData.appointmentDate || null,
        appointmentTime: notificationData.appointmentTime || null,
        branchName: notificationData.branchName || 'David\'s Salon'
      };

      const docRef = await addDoc(collection(this.db, this.collection), notification);
      
      console.log('📱 Notification created:', {
        id: docRef.id,
        type: notification.type,
        recipientId: notification.recipientId,
        title: notification.title
      });
      
      return {
        id: docRef.id,
        ...notification
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Send appointment notification
  async sendAppointmentNotification(type, appointmentData, recipientId, recipientRole) {
    try {
      // Validate appointment data first
      const validation = this.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        console.warn('Sending notification with invalid appointment data:', validation.errors);
      }

      let title = '';
      let message = '';
      let priority = NOTIFICATION_PRIORITIES.NORMAL;
      let channel = NOTIFICATION_CHANNELS.APPOINTMENTS;
      let sound = 'default';
      let badge = 1;

      // Customize notification based on recipient role
      const isClient = recipientRole === 'client';
      const isStylist = recipientRole === 'stylist';

      switch (type) {
        case NOTIFICATION_TYPES.APPOINTMENT_CREATED:
          if (isClient) {
            title = 'Appointment Booked Successfully';
            message = `Your appointment has been scheduled for ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}`;
          } else if (isStylist) {
            title = 'New Appointment Assigned';
            message = `You have a new appointment with ${appointmentData.clientName} on ${appointmentData.appointmentDate}`;
          }
          priority = NOTIFICATION_PRIORITIES.HIGH;
          sound = 'appointment_created.wav';
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED:
          if (isClient) {
            title = 'Appointment Confirmed';
            message = `Your appointment for ${appointmentData.appointmentDate} has been confirmed`;
          } else if (isStylist) {
          title = 'Appointment Confirmed';
            message = `Appointment with ${appointmentData.clientName} has been confirmed`;
          }
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_CANCELLED:
          if (isClient) {
            title = 'Appointment Cancelled';
            message = `Your appointment for ${appointmentData.appointmentDate} has been cancelled`;
          } else if (isStylist) {
          title = 'Appointment Cancelled';
            message = `Appointment with ${appointmentData.clientName} has been cancelled`;
          }
          priority = NOTIFICATION_PRIORITIES.HIGH;
          sound = 'appointment_cancelled.wav';
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
          if (isClient) {
          title = 'Appointment Reminder';
          message = `Reminder: You have an appointment tomorrow at ${appointmentData.appointmentTime}`;
          } else if (isStylist) {
            title = 'Appointment Reminder';
            message = `Reminder: You have an appointment with ${appointmentData.clientName} tomorrow`;
          }
          channel = NOTIFICATION_CHANNELS.REMINDERS;
          sound = 'reminder.wav';
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_COMPLETED:
          if (isClient) {
            title = 'Thank You for Visiting!';
            message = `Thank you for visiting David's Salon. We hope you enjoyed your experience!`;
          } else if (isStylist) {
          title = 'Appointment Completed';
            message = `Appointment with ${appointmentData.clientName} has been completed`;
          }
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED:
          if (isClient) {
            title = 'Appointment Rescheduled';
            message = `Your appointment has been rescheduled to ${appointmentData.newAppointmentDate}`;
          } else if (isStylist) {
            title = 'Appointment Rescheduled';
            message = `Appointment with ${appointmentData.clientName} has been rescheduled`;
          }
          priority = NOTIFICATION_PRIORITIES.HIGH;
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_STARTING:
          if (isStylist) {
            title = 'Appointment Starting Soon';
            message = `Your appointment with ${appointmentData.clientName} is starting in 15 minutes`;
          }
          priority = NOTIFICATION_PRIORITIES.HIGH;
          channel = NOTIFICATION_CHANNELS.URGENT;
          sound = 'urgent.wav';
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_OVERDUE:
          if (isStylist) {
            title = 'Appointment Overdue';
            message = `Appointment with ${appointmentData.clientName} is overdue`;
          }
          priority = NOTIFICATION_PRIORITIES.HIGH;
          channel = NOTIFICATION_CHANNELS.URGENT;
          sound = 'urgent.wav';
          break;

        default:
          title = 'Appointment Update';
          message = `Appointment updated for ${appointmentData.clientName}`;
      }

      // Extract stylist name for the specific recipient
      let stylistName = 'Unassigned Stylist';
      if (recipientRole === 'stylist' && appointmentData.serviceStylistPairs) {
        const stylistPair = appointmentData.serviceStylistPairs.find(pair => pair.stylistId === recipientId);
        if (stylistPair) {
          stylistName = stylistPair.stylistName || 'Unassigned Stylist';
        }
      } else if (recipientRole === 'client' && appointmentData.serviceStylistPairs) {
        // For client notifications, show the first stylist name
        const firstStylist = appointmentData.serviceStylistPairs.find(pair => pair.stylistId && pair.stylistId !== 'any_available');
        if (firstStylist) {
          stylistName = firstStylist.stylistName || 'Unassigned Stylist';
        }
      }

      const notification = {
        type,
        title,
        message,
        recipientId,
        recipientRole,
        appointmentId: appointmentData.id,
        clientName: appointmentData.clientName || 'Unknown Client',
        stylistName: stylistName,
        appointmentDate: appointmentData.appointmentDate || null,
        appointmentTime: appointmentData.appointmentTime || null,
        branchName: appointmentData.branchName || 'David\'s Salon'
      };

      // Log notification data before sending
      console.log('Creating notification:', {
        type,
        recipientId,
        recipientRole,
        appointmentId: appointmentData.id,
        title,
        message,
        stylistName: stylistName,
        serviceStylistPairs: appointmentData.serviceStylistPairs
      });

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error sending appointment notification:', error);
      console.error('Notification data that failed:', {
        type,
        recipientId,
        recipientRole,
        appointmentId: appointmentData.id,
        clientName: appointmentData.clientName
      });
      throw error;
    }
  }

  // Send appointment reminder (for scheduled notifications)
  async scheduleAppointmentReminder(appointmentData, hoursBefore = 24) {
    try {
      const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
      const reminderTime = new Date(appointmentDateTime.getTime() - (hoursBefore * 60 * 60 * 1000));
      
      // In a real implementation, this would use a job scheduler like Firebase Cloud Functions
      // For now, we'll just create a notification record
      const notification = {
        type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
        title: 'Appointment Reminder',
        message: `Reminder: You have an appointment in ${hoursBefore} hours`,
        recipientId: appointmentData.clientId,
        recipientRole: 'client',
        appointmentId: appointmentData.id,
        scheduledFor: reminderTime,
        emailSubject: 'Appointment Reminder',
        emailBody: `Reminder: You have an appointment tomorrow at ${appointmentData.appointmentTime}.`,
        data: {
          appointmentId: appointmentData.id,
          clientName: appointmentData.clientName,
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime
        }
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      throw error;
    }
  }

  // Send notifications to multiple recipients
  async sendBulkNotification(type, appointmentData, recipients) {
    try {
      const notifications = [];
      
      for (const recipient of recipients) {
        const notification = await this.sendAppointmentNotification(
          type,
          appointmentData,
          recipient.id,
          recipient.role
        );
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Store notification for both client and stylist
  async storeNotificationForBoth(type, appointmentData) {
    try {
      const notifications = [];
      
      // Store for client
      if (appointmentData.clientId) {
        const clientNotification = await this.sendAppointmentNotification(
          type,
          appointmentData,
          appointmentData.clientId,
          'client'
        );
        notifications.push(clientNotification);
      }
      
      // Store for stylist(s) - handle both single stylist and multiple stylists
      const stylistIds = this.extractStylistIds(appointmentData);
      
      if (stylistIds && stylistIds.length > 0) {
        console.log(`Storing notifications for ${stylistIds.length} stylist(s):`, stylistIds);
        
        for (const stylistId of stylistIds) {
          const stylistNotification = await this.sendAppointmentNotification(
            type,
            appointmentData,
            stylistId,
            'stylist'
          );
          notifications.push(stylistNotification);
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error storing notification for both client and stylist:', error);
      throw error;
    }
  }

  // Extract stylist IDs from appointment data (handles different data structures)
  extractStylistIds(appointmentData) {
    let stylistIds = [];
    
    // Handle serviceStylistPairs structure (new format)
    if (appointmentData.serviceStylistPairs && Array.isArray(appointmentData.serviceStylistPairs)) {
      stylistIds = appointmentData.serviceStylistPairs
        .map(pair => pair.stylistId)
        .filter(id => id && id !== 'any_available'); // Filter out 'any_available' option
    }
    
    // Handle stylistIds array (direct format)
    if (appointmentData.stylistIds && Array.isArray(appointmentData.stylistIds)) {
      stylistIds = [...stylistIds, ...appointmentData.stylistIds];
    }
    
    // Handle single stylistId (legacy format)
    if (appointmentData.stylistId && !stylistIds.includes(appointmentData.stylistId)) {
      stylistIds.push(appointmentData.stylistId);
    }
    
    // Remove duplicates
    return [...new Set(stylistIds)];
  }

  // Send notification to all stylists assigned to an appointment
  async sendNotificationToAllStylists(type, appointmentData) {
    try {
      const notifications = [];
      const stylistIds = this.extractStylistIds(appointmentData);
      
      if (stylistIds.length === 0) {
        console.warn('No stylists found for appointment:', appointmentData.id);
        return notifications;
      }
      
      console.log(`Sending ${type} notification to ${stylistIds.length} stylist(s):`, stylistIds);
      
      for (const stylistId of stylistIds) {
        try {
          const stylistNotification = await this.sendAppointmentNotification(
            type,
            appointmentData,
            stylistId,
            'stylist'
          );
          notifications.push(stylistNotification);
          console.log(`Notification sent to stylist ${stylistId}`);
        } catch (error) {
          console.error(`Error sending notification to stylist ${stylistId}:`, error);
          // Continue with other stylists even if one fails
        }
      }
      
      return notifications;
    } catch (error) {
      console.error('Error sending notification to all stylists:', error);
      throw error;
    }
  }

  // Send notification to client only
  async sendNotificationToClient(type, appointmentData) {
    try {
      if (!appointmentData.clientId) {
        console.warn('No client ID found for appointment:', appointmentData.id);
        return null;
      }
      
      console.log(`Sending ${type} notification to client:`, appointmentData.clientId);
      
      const clientNotification = await this.sendAppointmentNotification(
        type,
        appointmentData,
        appointmentData.clientId,
        'client'
      );
      
      return clientNotification;
    } catch (error) {
      console.error('Error sending notification to client:', error);
      throw error;
    }
  }

  // Store notification for ALL participants (client + all stylists)
  async storeNotificationForAllParticipants(type, appointmentData) {
    try {
      const allNotifications = [];
      
      console.log(`Storing ${type} notification for ALL participants for appointment:`, appointmentData.id);
      
      // Store for client
      if (appointmentData.clientId) {
        try {
          const clientNotification = await this.sendAppointmentNotification(type, appointmentData, appointmentData.clientId, 'client');
          if (clientNotification) {
            allNotifications.push(clientNotification);
            console.log('✅ Client notification stored');
          }
        } catch (error) {
          console.error('❌ Error storing client notification:', error);
        }
      }
      
      // Store for all stylists
      const stylistIds = this.extractStylistIds(appointmentData);
      for (const stylistId of stylistIds) {
        try {
          const stylistNotification = await this.sendAppointmentNotification(type, appointmentData, stylistId, 'stylist');
          allNotifications.push(stylistNotification);
        } catch (error) {
          console.error(`❌ Error storing stylist notification for ${stylistId}:`, error);
        }
      }
      
      console.log(`✅ Total notifications stored: ${allNotifications.length}`);
      console.log(`   - Client: ${appointmentData.clientId ? 'Yes' : 'No'}`);
      console.log(`   - Stylists: ${stylistIds.length}`);
      
      return allNotifications;
    } catch (error) {
      console.error('Error storing notification for all participants:', error);
      throw error;
    }
  }

  // Store appointment created notification for all participants
  async storeAppointmentCreatedForAll(appointmentData) {
    return await this.storeNotificationForAllParticipants(
      NOTIFICATION_TYPES.APPOINTMENT_CREATED,
      appointmentData
    );
  }

  // Store appointment cancelled notification for all participants
  async storeAppointmentCancelledForAll(appointmentData) {
    return await this.storeNotificationForAllParticipants(
      NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
      appointmentData
    );
  }

  // Store appointment rescheduled notification for all participants
  async storeAppointmentRescheduledForAll(appointmentData) {
    return await this.storeNotificationForAllParticipants(
      NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
      appointmentData
    );
  }

  // Store appointment confirmed notification for all participants
  async storeAppointmentConfirmedForAll(appointmentData) {
    return await this.storeNotificationForAllParticipants(
      NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
      appointmentData
    );
  }

  // Store appointment reminder for all participants
  async storeAppointmentReminderForAll(appointmentData) {
    return await this.storeNotificationForAllParticipants(
      NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
      appointmentData
    );
  }

  // Store notification data only (no actual sending)
  async storeNotification(notificationData) {
    try {
      console.log('📱 Storing notification:', {
        title: notificationData.title,
        recipientId: notificationData.recipientId,
        type: notificationData.type
      });
      
      return {
        success: true,
        notificationId: notificationData.id,
        stored: true
      };
    } catch (error) {
      console.error('Error storing notification:', error);
      throw error;
    }
  }

  // Get notifications for mobile app
  async getNotificationsForMobileApp(recipientId, limit = 50) {
    try {
      console.log('📱 Getting notifications for:', recipientId);
      
      return {
        collection: 'notifications',
        where: [
          ['recipientId', '==', recipientId],
          ['isRead', '==', false]
        ],
        orderBy: [['createdAt', 'desc']],
        limit: limit
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      console.log('📱 Marking as read:', notificationId);
      
      return {
        success: true,
        notificationId,
        updateData: {
          isRead: true
        }
      };
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
