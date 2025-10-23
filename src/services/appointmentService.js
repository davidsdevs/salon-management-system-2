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
      // Validate required fields based on client type
      const isNewClient = appointmentData.clientInfo?.isNewClient;
      
      if (isNewClient) {
        // For new clients, validate client info instead of clientId
        const hasServiceStylistPairs = appointmentData.serviceStylistPairs && 
          appointmentData.serviceStylistPairs.length > 0 && 
          appointmentData.serviceStylistPairs.every(pair => pair.serviceId && pair.stylistId);
        
        if (!appointmentData.clientInfo?.name || !appointmentData.clientInfo?.phone || 
            !appointmentData.branchId || 
            !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
            !hasServiceStylistPairs) {
          throw new Error('Missing required appointment fields for new client');
        }
      } else {
        // For existing clients, validate clientId
        const hasServiceStylistPairs = appointmentData.serviceStylistPairs && 
          appointmentData.serviceStylistPairs.length > 0 && 
          appointmentData.serviceStylistPairs.every(pair => pair.serviceId && pair.stylistId);
        
        if (!appointmentData.clientId || !appointmentData.branchId || 
          !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
            !hasServiceStylistPairs) {
        throw new Error('Missing required appointment fields');
        }
      }

      // Check if user can create appointments
      if (!this.canCreateAppointment(currentUserRole)) {
        throw new Error('Insufficient permissions to create appointments');
      }

      // Extract serviceIds from serviceStylistPairs
      const serviceIds = appointmentData.serviceStylistPairs.map(pair => pair.serviceId);

      // Validate appointment time and availability
      // Use the first stylist for validation (since we have multiple stylists now)
      const firstStylistId = appointmentData.serviceStylistPairs[0].stylistId;
      await this.validateAppointmentTime(
        appointmentData.branchId,
        firstStylistId,
        appointmentData.appointmentDate,
        appointmentData.appointmentTime,
        serviceIds
      );

      let clientId = appointmentData.clientId;
      let clientName = '';
      let clientPhone = '';
      let clientEmail = '';
      
      // If it's a new client, create a client record first
      if (isNewClient) {
        const clientData = {
          name: appointmentData.clientInfo.name,
          phone: appointmentData.clientInfo.phone,
          email: appointmentData.clientInfo.email || '',
          isRegistered: false, // Non-registered client
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const clientRef = await addDoc(collection(this.db, 'clients'), clientData);
        clientId = clientRef.id;
        clientName = appointmentData.clientInfo.name;
        clientPhone = appointmentData.clientInfo.phone;
        clientEmail = appointmentData.clientInfo.email || '';
      } else {
        // For existing clients, fetch their details from users collection
        try {
          const userDoc = await getDoc(doc(this.db, 'users', appointmentData.clientId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            clientName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.name || 'Unknown';
            clientPhone = userData.phone || '';
            clientEmail = userData.email || '';
          }
        } catch (error) {
          console.error('Error fetching client details:', error);
          clientName = 'Unknown Client';
        }
      }

      // Fetch service and stylist names with prices
      const serviceStylistPairsWithNames = [];
      for (const pair of appointmentData.serviceStylistPairs) {
        try {
          // Fetch service details (name and price)
          const serviceDoc = await getDoc(doc(this.db, 'services', pair.serviceId));
          const serviceData = serviceDoc.exists() ? serviceDoc.data() : null;
          const serviceName = serviceData ? serviceData.name : `Service ${pair.serviceId}`;
          
          // Get price for this branch
          let servicePrice = 0;
          if (serviceData && serviceData.prices && serviceData.branches) {
            const branchIndex = serviceData.branches.indexOf(appointmentData.branchId);
            if (branchIndex !== -1 && serviceData.prices[branchIndex] !== undefined) {
              servicePrice = parseFloat(serviceData.prices[branchIndex]);
            } else if (serviceData.prices.length > 0) {
              servicePrice = parseFloat(serviceData.prices[0]); // Fallback to first price
            }
          }
          
          // Fetch stylist name
          const stylistDoc = await getDoc(doc(this.db, 'users', pair.stylistId));
          const stylistData = stylistDoc.exists() ? stylistDoc.data() : null;
          const stylistName = stylistData ? 
            `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || 
            stylistData.name || 
            `Stylist ${pair.stylistId}` : 
            `Stylist ${pair.stylistId}`;
          
          serviceStylistPairsWithNames.push({
            serviceId: pair.serviceId,
            serviceName: serviceName,
            servicePrice: servicePrice,
            stylistId: pair.stylistId,
            stylistName: stylistName
          });
        } catch (error) {
          console.error('Error fetching service/stylist details:', error);
          // Fallback to IDs if fetching fails
          serviceStylistPairsWithNames.push({
            serviceId: pair.serviceId,
            serviceName: `Service ${pair.serviceId}`,
            servicePrice: 0,
            stylistId: pair.stylistId,
            stylistName: `Stylist ${pair.stylistId}`
          });
        }
      }

      // Calculate total price
      const totalPrice = serviceStylistPairsWithNames.reduce((total, pair) => total + (pair.servicePrice || 0), 0);

      const newAppointment = {
        // Core appointment data
        clientId: clientId,
        clientName: clientName,
        clientPhone: clientPhone,
        clientEmail: clientEmail,
        branchId: appointmentData.branchId,
        appointmentDate: appointmentData.appointmentDate,
        appointmentTime: appointmentData.appointmentTime,
        serviceStylistPairs: serviceStylistPairsWithNames,
        totalPrice: totalPrice,
        notes: appointmentData.notes || '',
        status: APPOINTMENT_STATUS.SCHEDULED,
        
        // System fields
        createdBy: currentUserId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: [{
          action: 'created',
          by: currentUserId,
          timestamp: new Date().toISOString(),
          notes: isNewClient ? 'Appointment created for new client' : 'Appointment created'
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
      
<<<<<<< HEAD
      const appointments = [];
      
      console.log('📋 PROCESSING EACH DOCUMENT:');
      snapshot.forEach((doc, index) => {
=======
      // Process appointments with async operations
      const appointmentPromises = snapshot.docs.map(async (doc) => {
>>>>>>> origin/main
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
        
<<<<<<< HEAD
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
=======
        // Filter based on user permissions
        if (this.canViewAppointment(currentUserRole, appointmentData, currentUserId)) {
          console.log('Appointment approved for viewing');
          
          // Process serviceStylistPairs to extract service and stylist names
          let processedAppointment = {
>>>>>>> origin/main
            id: doc.id,
            ...appointmentData
          };
          
          // If appointment has serviceStylistPairs, process them
          if (appointmentData.serviceStylistPairs && appointmentData.serviceStylistPairs.length > 0) {
            // Use stored names if available, otherwise fetch them
            const serviceNames = [];
            const stylistNames = [];
            
            for (const pair of appointmentData.serviceStylistPairs) {
              if (pair.serviceName && pair.stylistName) {
                // Use stored names and prices
                serviceNames.push(pair.serviceName);
                stylistNames.push(pair.stylistName);
              } else {
                // Fallback: fetch names from database
                try {
                  const serviceDoc = await getDoc(doc(this.db, 'services', pair.serviceId));
                  const serviceName = serviceDoc.exists() ? serviceDoc.data().name : `Service ${pair.serviceId}`;
                  serviceNames.push(serviceName);
                  
                  const stylistDoc = await getDoc(doc(this.db, 'users', pair.stylistId));
                  const stylistData = stylistDoc.exists() ? stylistDoc.data() : null;
                  const stylistName = stylistData ? 
                    `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || 
                    stylistData.name || 
                    `Stylist ${pair.stylistId}` : 
                    `Stylist ${pair.stylistId}`;
                  stylistNames.push(stylistName);
                } catch (error) {
                  console.error('Error fetching service/stylist names:', error);
                  serviceNames.push(`Service ${pair.serviceId}`);
                  stylistNames.push(`Stylist ${pair.stylistId}`);
                }
              }
            }
            
            processedAppointment.serviceName = serviceNames.join(', ');
            processedAppointment.stylistName = stylistNames.join(', ');
            processedAppointment.serviceCount = appointmentData.serviceStylistPairs.length;
          } else if (appointmentData.serviceIds && appointmentData.serviceIds.length > 0) {
            // Handle old structure for backward compatibility
            processedAppointment.serviceName = `Service ${appointmentData.serviceIds.join(', ')}`;
            processedAppointment.stylistName = appointmentData.stylistName || `Stylist ${appointmentData.stylistId}`;
            processedAppointment.serviceCount = appointmentData.serviceIds.length;
          }
          
          return processedAppointment;
        } else {
<<<<<<< HEAD
          console.log('❌ Appointment REJECTED due to permissions');
=======
          console.log('Appointment rejected due to permissions');
          return null;
>>>>>>> origin/main
        }
      });
      
      // Wait for all appointments to be processed
      const appointmentResults = await Promise.all(appointmentPromises);
      const appointments = appointmentResults.filter(appointment => appointment !== null);

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

      // Process serviceStylistPairs to extract service and stylist names
      let processedAppointment = {
        id: appointmentDoc.id,
        ...appointmentData
      };
      
      // If appointment has serviceStylistPairs, process them
      if (appointmentData.serviceStylistPairs && appointmentData.serviceStylistPairs.length > 0) {
        // Use stored names if available, otherwise fetch them
        const serviceNames = [];
        const stylistNames = [];
        
        for (const pair of appointmentData.serviceStylistPairs) {
          if (pair.serviceName && pair.stylistName) {
            // Use stored names and prices
            serviceNames.push(pair.serviceName);
            stylistNames.push(pair.stylistName);
          } else {
            // Fallback: fetch names from database
            try {
              const serviceDoc = await getDoc(doc(this.db, 'services', pair.serviceId));
              const serviceName = serviceDoc.exists() ? serviceDoc.data().name : `Service ${pair.serviceId}`;
              serviceNames.push(serviceName);
              
              const stylistDoc = await getDoc(doc(this.db, 'users', pair.stylistId));
              const stylistData = stylistDoc.exists() ? stylistDoc.data() : null;
              const stylistName = stylistData ? 
                `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || 
                stylistData.name || 
                `Stylist ${pair.stylistId}` : 
                `Stylist ${pair.stylistId}`;
              stylistNames.push(stylistName);
            } catch (error) {
              console.error('Error fetching service/stylist names:', error);
              serviceNames.push(`Service ${pair.serviceId}`);
              stylistNames.push(`Stylist ${pair.stylistId}`);
            }
          }
        }
        
        processedAppointment.serviceName = serviceNames.join(', ');
        processedAppointment.stylistName = stylistNames.join(', ');
        processedAppointment.serviceCount = appointmentData.serviceStylistPairs.length;
      } else if (appointmentData.serviceIds && appointmentData.serviceIds.length > 0) {
        // Handle old structure for backward compatibility
        processedAppointment.serviceName = `Service ${appointmentData.serviceIds.join(', ')}`;
        processedAppointment.stylistName = appointmentData.stylistName || `Stylist ${appointmentData.stylistId}`;
        processedAppointment.serviceCount = appointmentData.serviceIds.length;
      }
      
      return processedAppointment;
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
      if (updateData.appointmentDate || updateData.appointmentTime || updateData.serviceStylistPairs) {
        // Extract serviceIds from serviceStylistPairs or use existing serviceIds
        const serviceIds = updateData.serviceStylistPairs ? 
          updateData.serviceStylistPairs.map(pair => pair.serviceId) : 
          updateData.serviceIds || currentAppointment.serviceIds || [];
        
        // Use first stylist from serviceStylistPairs or fallback to stylistId
        const stylistId = updateData.serviceStylistPairs && updateData.serviceStylistPairs.length > 0 ?
          updateData.serviceStylistPairs[0].stylistId :
          updateData.stylistId || currentAppointment.stylistId;
        
        await this.validateAppointmentTime(
          updateData.branchId || currentAppointment.branchId,
          stylistId,
          updateData.appointmentDate || currentAppointment.appointmentDate,
          updateData.appointmentTime || currentAppointment.appointmentTime,
          serviceIds,
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

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newDate, newTime, currentUserRole, currentUserId, reason) {
    try {
      const appointmentRef = doc(this.db, this.collection, appointmentId);
      const appointmentDoc = await getDoc(appointmentRef);
      
      if (!appointmentDoc.exists()) {
        throw new Error('Appointment not found');
      }

      const currentAppointment = appointmentDoc.data();

      // Check if user can reschedule this appointment
      if (!this.canUpdateAppointment(currentUserRole, currentAppointment, currentUserId)) {
        throw new Error('Insufficient permissions to reschedule this appointment');
      }

      // Check if appointment can be rescheduled (not completed or cancelled)
      if (currentAppointment.status === APPOINTMENT_STATUS.COMPLETED || 
          currentAppointment.status === APPOINTMENT_STATUS.CANCELLED) {
        throw new Error('Cannot reschedule completed or cancelled appointments');
      }

      // Validate new appointment time
      const serviceIds = currentAppointment.serviceStylistPairs ? 
        currentAppointment.serviceStylistPairs.map(pair => pair.serviceId) : 
        currentAppointment.serviceIds || [];
      
      const stylistId = currentAppointment.serviceStylistPairs && currentAppointment.serviceStylistPairs.length > 0 ?
        currentAppointment.serviceStylistPairs[0].stylistId :
        currentAppointment.stylistId;

      await this.validateAppointmentTime(
        currentAppointment.branchId,
        stylistId,
        newDate,
        newTime,
        serviceIds,
        appointmentId // Exclude current appointment from conflict check
      );

      // Add to history
      const historyEntry = {
        action: 'rescheduled',
        by: currentUserId,
        timestamp: new Date().toISOString(),
        reason: reason || 'No reason provided',
        details: {
          oldDate: currentAppointment.appointmentDate,
          oldTime: currentAppointment.appointmentTime,
          newDate: newDate,
          newTime: newTime
        }
      };

      const updatedData = {
        appointmentDate: newDate,
        appointmentTime: newTime,
          rescheduleReason: reason || 'No reason provided',
        updatedAt: serverTimestamp(),
        history: [...(currentAppointment.history || []), historyEntry]
      };

      await updateDoc(appointmentRef, updatedData);
      
      const rescheduledAppointment = {
        id: appointmentId,
        ...currentAppointment,
        ...updatedData
      };

      // Send reschedule notification
      try {
        await notificationService.sendAppointmentNotification(
          NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
          rescheduledAppointment,
          currentAppointment.clientId,
          'client'
        );
      } catch (notificationError) {
        console.warn('Failed to send reschedule notification:', notificationError);
      }
      
      return rescheduledAppointment;
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
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
          cancelReason: reason || 'No reason provided',
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
        appointment.clientName?.toLowerCase().includes(searchLower) ||
        appointment.notes?.toLowerCase().includes(searchLower) ||
        appointment.stylistName?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw error;
    }
  }

  // Get all clients (for dropdowns, etc.) - includes both registered and non-registered
  async getClients() {
    try {
      const clientsRef = collection(this.db, 'clients');
      const snapshot = await getDocs(clientsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Get registered clients only (users with accounts)
  async getRegisteredClients() {
    try {
      const clientsRef = collection(this.db, 'clients');
      const q = query(clientsRef, where('isRegistered', '==', true));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching registered clients:', error);
      throw error;
    }
  }

  // Get non-registered clients only (walk-in clients)
  async getNonRegisteredClients() {
    try {
      const clientsRef = collection(this.db, 'clients');
      const q = query(clientsRef, where('isRegistered', '==', false));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching non-registered clients:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const appointmentService = new AppointmentService();
export default appointmentService;
