const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Appointment status constants
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Create appointment
exports.createAppointment = functions.https.onCall(async (data, context) => {
  // Verify the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentData } = data;
  const currentUserId = context.auth.uid;

  try {
    // Validate required fields
    if (!appointmentData.branchId || !appointmentData.stylistId || 
        !appointmentData.appointmentDate || !appointmentData.appointmentTime || 
        !appointmentData.serviceIds || appointmentData.serviceIds.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required appointment fields');
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

    // Validate appointment time and availability
    await validateAppointmentTime(
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      history: [{
        action: 'created',
        by: currentUserId,
        timestamp: new Date().toISOString(),
        notes: 'Appointment created'
      }]
    };

    const docRef = await admin.firestore().collection('appointments').add(newAppointment);
    
    const createdAppointment = {
      id: docRef.id,
      ...newAppointment
    };

    // Send notification to client (only if clientId is not temporary)
    if (clientId && !clientId.startsWith('temp_')) {
      try {
        await sendAppointmentNotification(
          'appointment_created',
          createdAppointment,
          clientId
        );
      } catch (notificationError) {
        console.warn('Failed to send appointment notification:', notificationError);
      }
    }

    return { success: true, appointment: createdAppointment };
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Update appointment
exports.updateAppointment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentId, updateData } = data;
  const currentUserId = context.auth.uid;

  try {
    const appointmentRef = admin.firestore().collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Appointment not found');
    }

    const currentAppointment = appointmentDoc.data();

    // Validate status transition if status is being changed
    if (updateData.status && updateData.status !== currentAppointment.status) {
      if (!isValidStatusTransition(currentAppointment.status, updateData.status)) {
        throw new functions.https.HttpsError('invalid-argument', 
          `Invalid status transition from ${currentAppointment.status} to ${updateData.status}`);
      }
    }

    // Validate appointment time if being rescheduled
    if (updateData.appointmentDate || updateData.appointmentTime || updateData.stylistId) {
      await validateAppointmentTime(
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      history: [...(currentAppointment.history || []), historyEntry]
    };

    await appointmentRef.update(updatedData);
    
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
            notificationType = 'appointment_confirmed';
            break;
          case APPOINTMENT_STATUS.CANCELLED:
            notificationType = 'appointment_cancelled';
            break;
          case APPOINTMENT_STATUS.COMPLETED:
            notificationType = 'appointment_completed';
            break;
          default:
            return { success: true, appointment: updatedAppointment };
        }

        await sendAppointmentNotification(
          notificationType,
          updatedAppointment,
          currentAppointment.clientId
        );
      } catch (notificationError) {
        console.warn('Failed to send status change notification:', notificationError);
      }
    }
    
    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Get appointments
exports.getAppointments = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { filters = {}, pageSize = 20, lastDocId = null } = data;
  const currentUserId = context.auth.uid;

  try {
    let query = admin.firestore().collection('appointments');

    // Apply filters
    if (filters.branchId) {
      query = query.where('branchId', '==', filters.branchId);
    }
    if (filters.stylistId) {
      query = query.where('stylistId', '==', filters.stylistId);
    }
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    if (filters.clientId) {
      query = query.where('clientId', '==', filters.clientId);
    }
    if (filters.dateFrom) {
      query = query.where('appointmentDate', '>=', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.where('appointmentDate', '<=', filters.dateTo);
    }

    // Order by appointment date
    query = query.orderBy('appointmentDate', 'asc');

    if (lastDocId) {
      const lastDoc = await admin.firestore().collection('appointments').doc(lastDocId).get();
      query = query.startAfter(lastDoc);
    }
    if (pageSize) {
      query = query.limit(pageSize);
    }

    const snapshot = await query.get();
    const appointments = [];
    
    snapshot.forEach((doc) => {
      const appointmentData = doc.data();
      appointments.push({
        id: doc.id,
        ...appointmentData
      });
    });

    return {
      success: true,
      appointments,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Get appointment by ID
exports.getAppointmentById = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentId } = data;

  try {
    const appointmentDoc = await admin.firestore().collection('appointments').doc(appointmentId).get();
    
    if (!appointmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Appointment not found');
    }

    const appointmentData = appointmentDoc.data();

    return {
      success: true,
      appointment: {
        id: appointmentDoc.id,
        ...appointmentData
      }
    };
  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Cancel appointment
exports.cancelAppointment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentId, reason } = data;
  const currentUserId = context.auth.uid;

  try {
    const appointmentRef = admin.firestore().collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Appointment not found');
    }

    const currentAppointment = appointmentDoc.data();

    // Add to history
    const historyEntry = {
      action: 'status_changed_to_cancelled',
      by: currentUserId,
      timestamp: new Date().toISOString(),
      notes: reason || 'Appointment cancelled'
    };

    const updateData = {
      status: APPOINTMENT_STATUS.CANCELLED,
      notes: reason || 'Appointment cancelled',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      history: [...(currentAppointment.history || []), historyEntry]
    };

    await appointmentRef.update(updateData);

    const updatedAppointment = {
      id: appointmentId,
      ...currentAppointment,
      ...updateData
    };

    // Send cancellation notification
    try {
      await sendAppointmentNotification(
        'appointment_cancelled',
        updatedAppointment,
        currentAppointment.clientId
      );
    } catch (notificationError) {
      console.warn('Failed to send cancellation notification:', notificationError);
    }

    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Complete appointment
exports.completeAppointment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentId, notes } = data;
  const currentUserId = context.auth.uid;

  try {
    const appointmentRef = admin.firestore().collection('appointments').doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();
    
    if (!appointmentDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Appointment not found');
    }

    const currentAppointment = appointmentDoc.data();

    // Add to history
    const historyEntry = {
      action: 'status_changed_to_completed',
      by: currentUserId,
      timestamp: new Date().toISOString(),
      notes: notes || 'Appointment completed'
    };

    const updateData = {
      status: APPOINTMENT_STATUS.COMPLETED,
      notes: notes || 'Appointment completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      history: [...(currentAppointment.history || []), historyEntry]
    };

    await appointmentRef.update(updateData);

    const updatedAppointment = {
      id: appointmentId,
      ...currentAppointment,
      ...updateData
    };

    // Send completion notification
    try {
      await sendAppointmentNotification(
        'appointment_completed',
        updatedAppointment,
        currentAppointment.clientId
      );
    } catch (notificationError) {
      console.warn('Failed to send completion notification:', notificationError);
    }

    return { success: true, appointment: updatedAppointment };
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to validate appointment time
async function validateAppointmentTime(branchId, stylistId, appointmentDate, appointmentTime, serviceIds, excludeAppointmentId = null) {
  try {
    // Check if appointment is in the future
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const now = new Date();
    
    if (appointmentDateTime <= now) {
      throw new Error('Appointment must be scheduled in the future');
    }

    // Check for conflicts with existing appointments
    let conflictsQuery = admin.firestore()
      .collection('appointments')
      .where('stylistId', '==', stylistId)
      .where('appointmentDate', '==', appointmentDate)
      .where('status', 'in', [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS]);

    const conflictsSnapshot = await conflictsQuery.get();
    
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

// Helper function to check status transition validity
function isValidStatusTransition(currentStatus, newStatus) {
  const STATUS_FLOW = {
    [APPOINTMENT_STATUS.SCHEDULED]: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.CONFIRMED]: [APPOINTMENT_STATUS.IN_PROGRESS, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.IN_PROGRESS]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED],
    [APPOINTMENT_STATUS.COMPLETED]: [], // Terminal state
    [APPOINTMENT_STATUS.CANCELLED]: [] // Terminal state
  };

  const allowedTransitions = STATUS_FLOW[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// Helper function to send appointment notifications
async function sendAppointmentNotification(notificationType, appointment, clientId) {
  try {
    // This would integrate with your notification service
    // For now, we'll just log the notification
    console.log(`Sending ${notificationType} notification for appointment ${appointment.id} to client ${clientId}`);
    
    // You could integrate with email service, push notifications, etc.
    // Example: await sendEmailNotification(clientId, notificationType, appointment);
    
    return true;
  } catch (error) {
    console.error('Error sending appointment notification:', error);
    throw error;
  }
}
