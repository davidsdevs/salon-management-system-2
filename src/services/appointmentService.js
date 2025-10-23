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
      if (!appointmentData.branchId || !appointmentData.stylistId || 
          !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
          !appointmentData.serviceIds || appointmentData.serviceIds.length === 0) {
        throw new Error('Missing required appointment fields');
      }

      // Handle client information - support both existing clients and new clients
      let clientId = appointmentData.clientId;
      let clientInfo = appointmentData.clientInfo || {};
      let isNewClient = appointmentData.isNewClient || false;
      let clientName = appointmentData.clientName || '';

      // If it's a new client, generate a temporary clientId or use the provided one
      if (isNewClient && !clientId) {
        clientId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      // Ensure clientInfo has required fields
      if (!clientInfo.name && clientName) {
        clientInfo.name = clientName;
      }
      if (!clientInfo.id && clientId) {
        clientInfo.id = clientId;
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
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        branchId: appointmentData.branchId,
        clientId: clientId,
        clientInfo: clientInfo,
        isNewClient: isNewClient,
        newClientName: appointmentData.newClientName || '',
        notes: appointmentData.notes || '',
        serviceIds: appointmentData.serviceIds,
        status: APPOINTMENT_STATUS.SCHEDULED,
        stylistId: appointmentData.stylistId,
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: [{
          action: 'created',
          by: currentUserId,
          timestamp: new Date().toISOString(),
          notes: 'Appointment created'
        }]
      };

      const docRef = await addDoc(collection(this.db, this.collection), newAppointment);
      
      const createdAppointment = {
        id: docRef.id,
        ...newAppointment
      };

      // Send notification to client (only if clientId is not temporary)
      if (clientId && !clientId.startsWith('temp_')) {
        try {
          await notificationService.sendAppointmentNotification(
            NOTIFICATION_TYPES.APPOINTMENT_CREATED,
            createdAppointment,
            clientId,
            'client'
          );
        } catch (notificationError) {
          console.warn('Failed to send appointment notification:', notificationError);
        }
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
      console.log('Getting appointments with filters:', { filters, currentUserRole, currentUserId });
      
      let q = query(collection(this.db, this.collection));

      // Apply filters
      if (filters.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
        console.log('Added branchId filter:', filters.branchId);
      } else {
        console.log('✅ NO BRANCH ID FILTER - FETCHING ALL APPOINTMENTS');
      }
      if (filters.stylistId) {
        q = query(q, where('stylistId', '==', filters.stylistId));
      }
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
        console.log('Added status filter:', filters.status);
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

      // Order by appointment date only (simpler index requirement)
      q = query(q, orderBy('appointmentDate', 'asc'));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      if (pageSize) {
        q = query(q, limit(pageSize));
      }

      console.log('🔍 EXECUTING FIRESTORE QUERY...');
      console.log('Query filters applied:', {
        branchId: filters.branchId,
        stylistId: filters.stylistId,
        status: filters.status,
        clientId: filters.clientId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo
      });
      
      const snapshot = await getDocs(q);
      console.log('📊 QUERY RESULTS:');
      console.log('Total documents found:', snapshot.docs.length);
      console.log('Query executed successfully');
      
      const appointments = [];
      
      console.log('📋 PROCESSING EACH DOCUMENT:');
      snapshot.forEach((doc, index) => {
        const appointmentData = doc.data();
        console.log(`\n📄 Document ${index + 1}/${snapshot.docs.length}:`);
        console.log('Document ID:', doc.id);
        console.log('Raw appointment data:', appointmentData);
        console.log('Key fields:', {
          branchId: appointmentData.branchId,
          status: appointmentData.status,
          clientName: appointmentData.clientName || appointmentData.clientInfo?.name,
          appointmentDate: appointmentData.appointmentDate,
          appointmentTime: appointmentData.appointmentTime,
          serviceStylistPairs: appointmentData.serviceStylistPairs
        });
        
        // Check permission
        const canView = this.canViewAppointment(currentUserRole, appointmentData, currentUserId);
        console.log('Can view appointment?', canView);
        console.log('Permission check details:', {
          userRole: currentUserRole,
          appointmentBranchId: appointmentData.branchId,
          filterBranchId: filters.branchId,
          branchIdMatch: appointmentData.branchId === filters.branchId
        });
        
        if (canView) {
          console.log('✅ Appointment APPROVED for viewing');
          appointments.push({
            id: doc.id,
            ...appointmentData
          });
        } else {
          console.log('❌ Appointment REJECTED due to permissions');
        }
      });

      console.log('Final appointments array length:', appointments.length);
      console.log('Final appointments array:', appointments);
      console.log('📊 FINAL RESULT SUMMARY:');
      console.log('Total documents found:', snapshot.docs.length);
      console.log('Appointments approved for viewing:', appointments.length);
      console.log('Appointments details:', appointments.map((apt, index) => ({
        index,
        id: apt.id,
        clientName: apt.clientName || apt.clientInfo?.name,
        branchId: apt.branchId,
        status: apt.status
      })));
      
      return {
        appointments,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting appointments:', error);
      
      // If it's an index error, provide helpful message
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        throw new Error('Database index is being created. Please wait a few minutes and try again.');
      }
      
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

  // Update appointment status only (simpler method for status changes)
  async updateAppointmentStatus(appointmentId, newStatus, notes = '', currentUserRole, currentUserId) {
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

      // Validate status transition
      if (newStatus !== currentAppointment.status) {
        if (!this.isValidStatusTransition(currentAppointment.status, newStatus)) {
          throw new Error(`Invalid status transition from ${currentAppointment.status} to ${newStatus}`);
        }
      }

      // Add to history
      const historyEntry = {
        action: `status_changed_to_${newStatus}`,
        by: currentUserId,
        timestamp: new Date().toISOString(),
        notes: notes || `Appointment status changed to ${newStatus}`
      };

      const updatedData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        history: [...(currentAppointment.history || []), historyEntry]
      };

      await updateDoc(appointmentRef, updatedData);
      
      const updatedAppointment = {
        id: appointmentId,
        ...currentAppointment,
        ...updatedData
      };

      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment status:', error);
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
        timestamp: new Date().toISOString(),
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

  // Check if user can create appointments (for staff)
  canCreateAppointment(userRole) {
    return [
      ROLES.SYSTEM_ADMIN,
      ROLES.OPERATIONAL_MANAGER,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_MANAGER,
      ROLES.RECEPTIONIST
    ].includes(userRole);
  }

  // Check if user can book appointments (for clients)
  canBookAppointment(userRole) {
    return userRole === ROLES.CLIENT;
  }

  // Check if user can modify appointments
  canModifyAppointment(userRole) {
    return [
      ROLES.SYSTEM_ADMIN,
      ROLES.OPERATIONAL_MANAGER,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_MANAGER,
      ROLES.RECEPTIONIST
    ].includes(userRole);
  }

  // Check if user can confirm appointments
  canConfirmAppointment(userRole) {
    return [
      ROLES.SYSTEM_ADMIN,
      ROLES.OPERATIONAL_MANAGER,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_MANAGER,
      ROLES.RECEPTIONIST
    ].includes(userRole);
  }

  // Check if user can mark appointments as completed
  canCompleteAppointment(userRole) {
    return [
      ROLES.SYSTEM_ADMIN,
      ROLES.OPERATIONAL_MANAGER,
      ROLES.BRANCH_ADMIN,
      ROLES.BRANCH_MANAGER,
      ROLES.STYLIST
    ].includes(userRole);
  }

  // Check if user can view appointment
  canViewAppointment(userRole, appointmentData, currentUserId) {
    console.log('Checking view permissions:', { userRole, appointmentData, currentUserId });
    
    // System admin and operational manager can view all (read-only for reporting)
    if ([ROLES.SYSTEM_ADMIN, ROLES.OPERATIONAL_MANAGER].includes(userRole)) {
      console.log('✅ System admin/operational manager - can view all');
      return true;
    }

    // Branch admin and manager can view ALL appointments (regardless of branch or who created them)
    if ([ROLES.BRANCH_ADMIN, ROLES.BRANCH_MANAGER].includes(userRole)) {
      console.log('✅ Branch admin/manager - can view ALL appointments (no restrictions)');
      return true; // No restrictions for branch managers
    }

    // Receptionist can view ALL appointments in their branch
    if (userRole === ROLES.RECEPTIONIST) {
      console.log('✅ Receptionist - can view all appointments in their branch');
      return true; // Will be filtered by branch in query
    }

    // Stylist can view their assigned appointments only
    if (userRole === ROLES.STYLIST && appointmentData.stylistId === currentUserId) {
      console.log('✅ Stylist - can view their assigned appointments');
      return true;
    }

    // Client can view their own appointments only
    if (userRole === ROLES.CLIENT && appointmentData.clientId === currentUserId) {
      console.log('✅ Client - can view their own appointments');
      return true;
    }

    console.log('❌ No permission to view this appointment');
    return false;
  }

  // Check if user can update appointment
  canUpdateAppointment(userRole, appointmentData, currentUserId) {
    // System admin can update all
    if (userRole === ROLES.SYSTEM_ADMIN) {
      return true;
    }

    // Operational manager has read-only access for reporting
    if (userRole === ROLES.OPERATIONAL_MANAGER) {
      return false; // Read-only for reporting
    }

    // Branch admin and manager can update appointments in their branch
    if ([ROLES.BRANCH_ADMIN, ROLES.BRANCH_MANAGER].includes(userRole)) {
      return true; // Will be filtered by branch
    }

    // Receptionist can update appointments in their branch
    if (userRole === ROLES.RECEPTIONIST) {
      return true; // Will be filtered by branch
    }

    // Stylist can only mark their assigned appointments as completed
    if (userRole === ROLES.STYLIST && appointmentData.stylistId === currentUserId) {
      return true; // Limited to status changes
    }

    // Client can only reschedule/cancel their own appointments
    if (userRole === ROLES.CLIENT && appointmentData.clientId === currentUserId) {
      return true; // Limited to reschedule/cancel
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
        appointment.clientInfo?.name?.toLowerCase().includes(searchLower) ||
        appointment.clientName?.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower) ||
        appointment.stylistName?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw error;
    }
  }

  // Create new client and update appointment
  async createNewClientAndUpdateAppointment(appointmentId, clientData, currentUserRole, currentUserId) {
    try {
      // This would typically create a new user account
      // For now, we'll update the appointment with the new client information
      const clientInfo = {
        id: clientData.id || `client_${Date.now()}`,
        name: clientData.name,
        phone: clientData.phone || '',
        email: clientData.email || '',
        address: clientData.address || ''
      };

      const updateData = {
        clientId: clientInfo.id,
        clientInfo: clientInfo,
        isNewClient: false,
        newClientName: '',
        updatedAt: serverTimestamp()
      };

      // Add to history
      const historyEntry = {
        action: 'client_created',
        by: currentUserId,
        timestamp: new Date().toISOString(),
        notes: `New client created: ${clientInfo.name}`
      };

      const appointmentRef = doc(this.db, this.collection, appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const currentAppointment = appointmentDoc.data();
      updateData.history = [...(currentAppointment.history || []), historyEntry];

      await updateDoc(appointmentRef, updateData);

      return {
        id: appointmentId,
        ...currentAppointment,
        ...updateData
      };
    } catch (error) {
      console.error('Error creating new client and updating appointment:', error);
      throw error;
    }
  }

  // Update client information in appointment
  async updateClientInfo(appointmentId, clientInfo, currentUserRole, currentUserId) {
    try {
      const updateData = {
        clientInfo: clientInfo,
        updatedAt: serverTimestamp()
      };

      // Add to history
      const historyEntry = {
        action: 'client_info_updated',
        by: currentUserId,
        timestamp: new Date().toISOString(),
        notes: `Client information updated for ${clientInfo.name}`
      };

      const appointmentRef = doc(this.db, this.collection, appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const currentAppointment = appointmentDoc.data();
      updateData.history = [...(currentAppointment.history || []), historyEntry];

      await updateDoc(appointmentRef, updateData);

      return {
        id: appointmentId,
        ...currentAppointment,
        ...updateData
      };
    } catch (error) {
      console.error('Error updating client info:', error);
      throw error;
    }
  }

  // Get appointments by client ID
  async getAppointmentsByClientId(clientId, currentUserRole, currentUserId) {
    try {
      const filters = { clientId };
      return await this.getAppointments(filters, currentUserRole, currentUserId, 100);
    } catch (error) {
      console.error('Error getting appointments by client ID:', error);
      throw error;
    }
  }

  // Get appointments by stylist ID
  async getAppointmentsByStylistId(stylistId, currentUserRole, currentUserId) {
    try {
      const filters = { stylistId };
      return await this.getAppointments(filters, currentUserRole, currentUserId, 100);
    } catch (error) {
      console.error('Error getting appointments by stylist ID:', error);
      throw error;
    }
  }

  // Get appointments by date range
  async getAppointmentsByDateRange(startDate, endDate, branchId = null, currentUserRole, currentUserId) {
    try {
      const filters = {
        dateFrom: startDate,
        dateTo: endDate,
        ...(branchId && { branchId })
      };
      return await this.getAppointments(filters, currentUserRole, currentUserId, 100);
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService;
