import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ROLES } from '../utils/roles';
import { notificationService, NOTIFICATION_TYPES } from './notificationService';

// Appointment status constants
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Appointment status flow
export const STATUS_FLOW = {
  [APPOINTMENT_STATUS.SCHEDULED]: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED],
  [APPOINTMENT_STATUS.CONFIRMED]: [APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.CANCELLED],
  [APPOINTMENT_STATUS.IN_PROGRESS]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED],
  [APPOINTMENT_STATUS.COMPLETED]: [], // Terminal state
  [APPOINTMENT_STATUS.CANCELLED]: [] // Terminal state
};

class AppointmentService {
  constructor() {
    this.db = db;
    this.collection = 'appointments';
  }

  // Create new appointment
  async createAppointment(appointmentData, currentUserRole, currentUserId) {
    try {
      // Validate required fields
      if (!appointmentData.clientId || !appointmentData.branchId || !appointmentData.stylistId || 
          !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
          !appointmentData.serviceIds || appointmentData.serviceIds.length === 0) {
        throw new Error('Missing required appointment fields');
      }

      // Check if user can create appointments
      if (!this.canCreateAppointment(currentUserRole)) {
        throw new Error('Insufficient permissions to create appointments');
      }

      // Validate appointment time and availability
      await this.validateAppointmentTime(
        appointmentData.branchId,
        appointmentData.stylistId,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        appointmentData.serviceIds
      );

      const newAppointment = {
        ...appointmentData,
        status: APPOINTMENT_STATUS.SCHEDULED,
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: [{
          action: 'created',
          by: currentUserId,
          timestamp: serverTimestamp(),
          notes: 'Appointment created'
        }]
      };

      const docRef = await addDoc(collection(this.db, this.collection), newAppointment);
      
      const createdAppointment = {
        id: docRef.id,
        ...newAppointment
      };

      // Send notification to client
      try {
        await notificationService.sendAppointmentNotification(
          NOTIFICATION_TYPES.APPOINTMENT_CREATED,
          createdAppointment,
          appointmentData.clientId,
          'client'
        );
      } catch (notificationError) {
        console.warn('Failed to send appointment notification:', notificationError);
      }

      return createdAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Get appointments with filters
  async getAppointments(filters = {}, currentUserRole, currentUserId, pageSize = 20, lastDoc = null) {
    try {
      let q = query(collection(this.db, this.collection));

      // Apply filters
      if (filters.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
      }
      if (filters.stylistId) {
        q = query(q, where('stylistId', '==', filters.stylistId));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.clientId) {
        q = query(q, where('clientId', '==', filters.clientId));
      }
      if (filters.dateFrom) {
        q = query(q, where('appointmentDate', '>=', filters.dateFrom));
      }
      if (filters.dateTo) {
        q = query(q, where('appointmentDate', '<=', filters.dateTo));
      }

      // Order by appointment date and time
      q = query(q, orderBy('appointmentDate', 'asc'), orderBy('appointmentTime', 'asc'));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      if (pageSize) {
        q = query(q, limit(pageSize));
      }

      const snapshot = await getDocs(q);
      const appointments = [];
      
      snapshot.forEach((doc) => {
        const appointmentData = doc.data();
        
        // Filter based on user permissions
        if (this.canViewAppointment(currentUserRole, appointmentData, currentUserId)) {
          appointments.push({
            id: doc.id,
            ...appointmentData
          });
        }
      });

      return {
        appointments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId, currentUserRole, currentUserId) {
    try {
      const appointmentDoc = await getDoc(doc(this.db, this.collection, appointmentId));
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const appointmentData = appointmentDoc.data();
      
      // Check if user can view this appointment
      if (!this.canViewAppointment(currentUserRole, appointmentData, currentUserId)) {
        throw new Error('Insufficient permissions to view this appointment');
      }

      return {
        id: appointmentDoc.id,
        ...appointmentData
      };
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(appointmentId, updateData, currentUserRole, currentUserId) {
    try {
      const appointmentRef = doc(this.db, this.collection, appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const currentAppointment = appointmentDoc.data();

      // Check if user can update this appointment
      if (!this.canUpdateAppointment(currentUserRole, currentAppointment, currentUserId)) {
        throw new Error('Insufficient permissions to update this appointment');
      }

      // Validate status transition if status is being changed
      if (updateData.status && updateData.status !== currentAppointment.status) {
        if (!this.isValidStatusTransition(currentAppointment.status, updateData.status)) {
          throw new Error(`Invalid status transition from ${currentAppointment.status} to ${updateData.status}`);
        }
      }

      // Validate appointment time if being rescheduled
      if (updateData.appointmentDate || updateData.appointmentTime || updateData.stylistId) {
        await this.validateAppointmentTime(
          updateData.branchId || currentAppointment.branchId,
          updateData.stylistId || currentAppointment.stylistId,
          updateData.appointmentDate || currentAppointment.appointmentDate,
          updateData.appointmentTime || currentAppointment.appointmentTime,
          updateData.serviceIds || currentAppointment.serviceIds,
          appointmentId // Exclude current appointment from conflict check
        );
      }

      // Add to history
      const historyEntry = {
        action: updateData.status ? `status_changed_to_${updateData.status}` : 'updated',
        by: currentUserId,
        timestamp: serverTimestamp(),
        notes: updateData.notes || 'Appointment updated'
      };

      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
        history: [...(currentAppointment.history || []), historyEntry]
      };

      await updateDoc(appointmentRef, updatedData);
      
      const updatedAppointment = {
        id: appointmentId,
        ...currentAppointment,
        ...updatedData
      };

      // Send notifications for status changes
      if (updateData.status && updateData.status !== currentAppointment.status) {
        try {
          let notificationType;
          switch (updateData.status) {
            case APPOINTMENT_STATUS.CONFIRMED:
              notificationType = NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED;
              break;
            case APPOINTMENT_STATUS.CANCELLED:
              notificationType = NOTIFICATION_TYPES.APPOINTMENT_CANCELLED;
              break;
            case APPOINTMENT_STATUS.COMPLETED:
              notificationType = NOTIFICATION_TYPES.APPOINTMENT_COMPLETED;
              break;
            default:
              return updatedAppointment;
          }

          await notificationService.sendAppointmentNotification(
            notificationType,
            updatedAppointment,
            currentAppointment.clientId,
            'client'
          );
        } catch (notificationError) {
          console.warn('Failed to send status change notification:', notificationError);
        }
      }
      
      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, reason, currentUserRole, currentUserId) {
    try {
      return await this.updateAppointment(
        appointmentId,
        {
          status: APPOINTMENT_STATUS.CANCELLED,
          notes: reason || 'Appointment cancelled'
        },
        currentUserRole,
        currentUserId
      );
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // Complete appointment
  async completeAppointment(appointmentId, notes, currentUserRole, currentUserId) {
    try {
      return await this.updateAppointment(
        appointmentId,
        {
          status: APPOINTMENT_STATUS.COMPLETED,
          notes: notes || 'Appointment completed'
        },
        currentUserRole,
        currentUserId
      );
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  // Validate appointment time and availability
  async validateAppointmentTime(branchId, stylistId, appointmentDate, appointmentTime, serviceIds, excludeAppointmentId = null) {
    try {
      // Check if appointment is in the future
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        throw new Error('Appointment must be scheduled in the future');
      }

      // Check branch operating hours (this would need to be implemented with branch service)
      // For now, we'll assume basic validation

      // Check for conflicts with existing appointments
      const conflictsQuery = query(
        collection(this.db, this.collection),
        where('stylistId', '==', stylistId),
        where('appointmentDate', '==', appointmentDate),
        where('status', 'in', [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS])
      );

      const conflictsSnapshot = await getDocs(conflictsQuery);
      
      for (const conflictDoc of conflictsSnapshot.docs) {
        if (excludeAppointmentId && conflictDoc.id === excludeAppointmentId) {
          continue; // Skip the appointment being updated
        }
        
        const conflictData = conflictDoc.data();
        if (conflictData.appointmentTime === appointmentTime) {
          throw new Error('Stylist is already booked at this time');
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating appointment time:', error);
      throw error;
    }
  }

  // Check if user can create appointments
  canCreateAppointment(userRole) {
    return [
      ROLES.SYSTEM_ADMIN,
      ROLES.OPERATIONAL_MANAGER,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_MANAGER,
      ROLES.RECEPTIONIST,
      ROLES.CLIENT
    ].includes(userRole);
  }

  // Check if user can view appointment
  canViewAppointment(userRole, appointmentData, currentUserId) {
    // System admin and operational manager can view all
    if ([ROLES.SYSTEM_ADMIN, ROLES.OPERATIONAL_MANAGER].includes(userRole)) {
      return true;
    }

    // Branch admin and manager can view appointments in their branch
    if ([ROLES.BRANCH_ADMIN, ROLES.BRANCH_MANAGER].includes(userRole)) {
      return true; // Will be filtered by branch in query
    }

    // Receptionist can view appointments in their branch
    if (userRole === ROLES.RECEPTIONIST) {
      return true; // Will be filtered by branch in query
    }

    // Stylist can view their own appointments
    if (userRole === ROLES.STYLIST && appointmentData.stylistId === currentUserId) {
      return true;
    }

    // Client can view their own appointments
    if (userRole === ROLES.CLIENT && appointmentData.clientId === currentUserId) {
      return true;
    }

    return false;
  }

  // Check if user can update appointment
  canUpdateAppointment(userRole, appointmentData, currentUserId) {
    // System admin and operational manager can update all
    if ([ROLES.SYSTEM_ADMIN, ROLES.OPERATIONAL_MANAGER].includes(userRole)) {
      return true;
    }

    // Branch admin and manager can update appointments in their branch
    if ([ROLES.BRANCH_ADMIN, ROLES.BRANCH_MANAGER].includes(userRole)) {
      return true; // Will be filtered by branch
    }

    // Receptionist can update appointments in their branch
    if (userRole === ROLES.RECEPTIONIST) {
      return true; // Will be filtered by branch
    }

    // Stylist can update their own appointments (limited to status changes)
    if (userRole === ROLES.STYLIST && appointmentData.stylistId === currentUserId) {
      return true;
    }

    // Client can update their own appointments (limited to reschedule/cancel)
    if (userRole === ROLES.CLIENT && appointmentData.clientId === currentUserId) {
      return true;
    }

    return false;
  }

  // Check if status transition is valid
  isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  // Get appointment statistics
  async getAppointmentStats(filters = {}, currentUserRole) {
    try {
      const appointments = await this.getAppointments(filters, currentUserRole, null, 1000);
      
      const stats = {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        byBranch: {},
        byStylist: {}
      };

      appointments.appointments.forEach(appointment => {
        stats.total++;
        stats[appointment.status] = (stats[appointment.status] || 0) + 1;
        
        // By branch
        if (!stats.byBranch[appointment.branchId]) {
          stats.byBranch[appointment.branchId] = 0;
        }
        stats.byBranch[appointment.branchId]++;

        // By stylist
        if (!stats.byStylist[appointment.stylistId]) {
          stats.byStylist[appointment.stylistId] = 0;
        }
        stats.byStylist[appointment.stylistId]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      throw error;
    }
  }

  // Search appointments
  async searchAppointments(searchTerm, filters = {}, currentUserRole, currentUserId) {
    try {
      // Get all appointments first, then filter client-side
      const appointments = await this.getAppointments(filters, currentUserRole, currentUserId, 1000);
      
      if (!searchTerm) {
        return appointments.appointments;
      }

      const searchLower = searchTerm.toLowerCase();
      return appointments.appointments.filter(appointment => 
        appointment.clientName?.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower) ||
        appointment.stylistName?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService;
