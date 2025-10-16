import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Notification types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_COMPLETED: 'appointment_completed'
};

class NotificationService {
  constructor() {
    this.db = db;
    this.collection = 'notifications';
  }

  // Create notification
  async createNotification(notificationData) {
    try {
      const notification = {
        ...notificationData,
        createdAt: serverTimestamp(),
        isRead: false
      };

      const docRef = await addDoc(collection(this.db, this.collection), notification);
      
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
      let title = '';
      let message = '';
      let emailSubject = '';
      let emailBody = '';

      switch (type) {
        case NOTIFICATION_TYPES.APPOINTMENT_CREATED:
          title = 'New Appointment Created';
          message = `Appointment created for ${appointmentData.clientName} on ${appointmentData.appointmentDate}`;
          emailSubject = 'Appointment Confirmation';
          emailBody = `Your appointment has been scheduled for ${appointmentData.appointmentDate} at ${appointmentData.appointmentTime}.`;
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED:
          title = 'Appointment Confirmed';
          message = `Appointment confirmed for ${appointmentData.clientName}`;
          emailSubject = 'Appointment Confirmed';
          emailBody = `Your appointment for ${appointmentData.appointmentDate} has been confirmed.`;
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_CANCELLED:
          title = 'Appointment Cancelled';
          message = `Appointment cancelled for ${appointmentData.clientName}`;
          emailSubject = 'Appointment Cancelled';
          emailBody = `Your appointment for ${appointmentData.appointmentDate} has been cancelled.`;
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
          title = 'Appointment Reminder';
          message = `Reminder: You have an appointment tomorrow at ${appointmentData.appointmentTime}`;
          emailSubject = 'Appointment Reminder';
          emailBody = `Reminder: You have an appointment tomorrow at ${appointmentData.appointmentTime}.`;
          break;

        case NOTIFICATION_TYPES.APPOINTMENT_COMPLETED:
          title = 'Appointment Completed';
          message = `Appointment completed for ${appointmentData.clientName}`;
          emailSubject = 'Appointment Completed';
          emailBody = `Your appointment has been completed. Thank you for visiting us!`;
          break;

        default:
          title = 'Appointment Update';
          message = `Appointment updated for ${appointmentData.clientName}`;
          emailSubject = 'Appointment Update';
          emailBody = `Your appointment has been updated.`;
      }

      const notification = {
        type,
        title,
        message,
        recipientId,
        recipientRole,
        appointmentId: appointmentData.id,
        emailSubject,
        emailBody,
        data: {
          appointmentId: appointmentData.id,
          clientName: appointmentData.clientName,
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime
        }
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error sending appointment notification:', error);
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
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
