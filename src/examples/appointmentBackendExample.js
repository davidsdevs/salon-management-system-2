// Example usage of the appointment backend with your exact data structure
import { appointmentApiService } from '../services/appointmentApiService';
import { AppointmentModel } from '../models/AppointmentModel';
import { AppointmentValidationService } from '../services/appointmentValidationService';

// Example: Create appointment with your exact data structure
export async function createAppointmentExample() {
  try {
    // Your exact data structure
    const appointmentData = {
      appointmentDate: "2025-10-17",
      appointmentTime: "18:00",
      branchId: "KYiL9JprSX3LBOYzrF6e",
      clientId: "",
      clientInfo: {
        id: "5",
        isNewClient: false,
        name: "Sarah Lee",
        clientName: "Sarah Lee"
      },
      createdAt: new Date("October 17, 2025 at 1:53:17 PM UTC+8"),
      createdBy: "S3h78a8XP6YkUgjOmaO1h1mq5kq2",
      history: [
        {
          action: "created",
          by: "S3h78a8XP6YkUgjOmaO1h1mq5kq2",
          notes: "Appointment created",
          timestamp: "2025-10-17T05:53:17.542Z"
        },
        {
          action: "status_changed_to_confirmed",
          by: "3xwdBFLGmEQOIfWyqKLaOK3mRG93",
          notes: "Appointment updated",
          timestamp: "2025-10-18T12:47:29.208Z"
        }
      ],
      isNewClient: false,
      newClientName: "",
      notes: "chemical",
      serviceIds: ["1", "2"],
      status: "confirmed",
      stylistId: "1",
      updatedAt: new Date("October 18, 2025 at 8:47:28 PM UTC+8")
    };

    // Validate the data
    const validation = AppointmentValidationService.validateAppointmentData(appointmentData);
    console.log('Validation result:', validation);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create appointment using the API service
    const createdAppointment = await appointmentApiService.createAppointmentFromStructure(appointmentData);
    console.log('Created appointment:', createdAppointment);

    return createdAppointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

// Example: Update appointment status
export async function updateAppointmentStatusExample(appointmentId) {
  try {
    // Confirm appointment
    const confirmedAppointment = await appointmentApiService.confirmAppointment(
      appointmentId,
      'Appointment confirmed by receptionist'
    );
    console.log('Confirmed appointment:', confirmedAppointment);

    // Start appointment
    const startedAppointment = await appointmentApiService.startAppointment(
      appointmentId,
      'Appointment started by stylist'
    );
    console.log('Started appointment:', startedAppointment);

    // Complete appointment
    const completedAppointment = await appointmentApiService.completeAppointment(
      appointmentId,
      'Appointment completed successfully'
    );
    console.log('Completed appointment:', completedAppointment);

    return completedAppointment;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
}

// Example: Get appointments with filters
export async function getAppointmentsExample() {
  try {
    // Get all appointments
    const allAppointments = await appointmentApiService.getAppointments();
    console.log('All appointments:', allAppointments);

    // Get appointments by status
    const confirmedAppointments = await appointmentApiService.getAppointmentsByStatus('confirmed');
    console.log('Confirmed appointments:', confirmedAppointments);

    // Get appointments by date range
    const dateRangeAppointments = await appointmentApiService.getAppointmentsByDateRange(
      '2025-10-01',
      '2025-10-31'
    );
    console.log('October appointments:', dateRangeAppointments);

    // Get appointments by client
    const clientAppointments = await appointmentApiService.getAppointmentsByClientId('client123');
    console.log('Client appointments:', clientAppointments);

    // Get appointments by stylist
    const stylistAppointments = await appointmentApiService.getAppointmentsByStylistId('stylist1');
    console.log('Stylist appointments:', stylistAppointments);

    return {
      all: allAppointments,
      confirmed: confirmedAppointments,
      dateRange: dateRangeAppointments,
      client: clientAppointments,
      stylist: stylistAppointments
    };
  } catch (error) {
    console.error('Error getting appointments:', error);
    throw error;
  }
}

// Example: Search appointments
export async function searchAppointmentsExample() {
  try {
    // Search by client name
    const clientSearch = await appointmentApiService.searchAppointments('Sarah');
    console.log('Search results for Sarah:', clientSearch);

    // Search by date
    const dateSearch = await appointmentApiService.searchAppointments('2025-10-17');
    console.log('Search results for date:', dateSearch);

    // Search with filters
    const filteredSearch = await appointmentApiService.searchAppointments('chemical', {
      status: 'confirmed',
      branchId: 'KYiL9JprSX3LBOYzrF6e'
    });
    console.log('Filtered search results:', filteredSearch);

    return {
      client: clientSearch,
      date: dateSearch,
      filtered: filteredSearch
    };
  } catch (error) {
    console.error('Error searching appointments:', error);
    throw error;
  }
}

// Example: Update client information
export async function updateClientInfoExample(appointmentId) {
  try {
    const updatedClientInfo = {
      id: "5",
      name: "Sarah Lee",
      phone: "+1234567890",
      email: "sarah.lee@email.com",
      address: "123 Main St, City, State"
    };

    const updatedAppointment = await appointmentApiService.updateClientInfo(
      appointmentId,
      updatedClientInfo
    );
    console.log('Updated appointment with client info:', updatedAppointment);

    return updatedAppointment;
  } catch (error) {
    console.error('Error updating client info:', error);
    throw error;
  }
}

// Example: Get appointment statistics
export async function getAppointmentStatsExample() {
  try {
    // Get overall stats
    const overallStats = await appointmentApiService.getAppointmentStats();
    console.log('Overall stats:', overallStats);

    // Get stats for specific branch
    const branchStats = await appointmentApiService.getAppointmentStats({
      branchId: 'KYiL9JprSX3LBOYzrF6e'
    });
    console.log('Branch stats:', branchStats);

    // Get stats for date range
    const dateRangeStats = await appointmentApiService.getAppointmentStats({
      dateFrom: '2025-10-01',
      dateTo: '2025-10-31'
    });
    console.log('Date range stats:', dateRangeStats);

    return {
      overall: overallStats,
      branch: branchStats,
      dateRange: dateRangeStats
    };
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    throw error;
  }
}

// Example: Cancel appointment
export async function cancelAppointmentExample(appointmentId) {
  try {
    const cancelledAppointment = await appointmentApiService.cancelAppointment(
      appointmentId,
      'Client requested cancellation'
    );
    console.log('Cancelled appointment:', cancelledAppointment);

    return cancelledAppointment;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
}

// Example: Reschedule appointment
export async function rescheduleAppointmentExample(appointmentId) {
  try {
    const rescheduledAppointment = await appointmentApiService.rescheduleAppointment(
      appointmentId,
      '2025-10-20',
      '14:00',
      'Rescheduled to accommodate client request'
    );
    console.log('Rescheduled appointment:', rescheduledAppointment);

    return rescheduledAppointment;
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    throw error;
  }
}

// Example: Working with AppointmentModel
export function appointmentModelExample() {
  // Create appointment model from your data
  const appointmentData = {
    appointmentDate: "2025-10-17",
    appointmentTime: "18:00",
    branchId: "KYiL9JprSX3LBOYzrF6e",
    clientId: "5",
    clientInfo: {
      id: "5",
      name: "Sarah Lee"
    },
    serviceIds: ["1", "2"],
    status: "confirmed",
    stylistId: "1",
    notes: "chemical"
  };

  // Create model instance
  const appointment = AppointmentModel.fromDataStructure(appointmentData);

  // Use model methods
  console.log('Client display name:', appointment.getClientDisplayName());
  console.log('Formatted date:', appointment.getFormattedDate());
  console.log('Formatted time:', appointment.getFormattedTime());
  console.log('Is today:', appointment.isToday());
  console.log('Is past:', appointment.isPastAppointment());

  // Add history entry
  appointment.addHistoryEntry('status_changed_to_completed', 'stylist123', 'Service completed');

  // Update status
  appointment.updateStatus('completed', 'stylist123', 'All services completed');

  // Validate
  const validation = appointment.validate();
  console.log('Validation result:', validation);

  // Convert back to data structure
  const dataStructure = appointment.toDataStructure();
  console.log('Data structure:', dataStructure);

  return appointment;
}

// Example: Complete workflow
export async function completeWorkflowExample() {
  try {
    console.log('=== Complete Appointment Workflow Example ===');

    // 1. Create appointment
    console.log('1. Creating appointment...');
    const appointment = await createAppointmentExample();
    console.log('Created appointment ID:', appointment.id);

    // 2. Get appointment details
    console.log('2. Getting appointment details...');
    const appointmentDetails = await appointmentApiService.getAppointmentById(appointment.id);
    console.log('Appointment details:', appointmentDetails);

    // 3. Update client information
    console.log('3. Updating client information...');
    await updateClientInfoExample(appointment.id);

    // 4. Confirm appointment
    console.log('4. Confirming appointment...');
    await appointmentApiService.confirmAppointment(appointment.id, 'Appointment confirmed');

    // 5. Start appointment
    console.log('5. Starting appointment...');
    await appointmentApiService.startAppointment(appointment.id, 'Appointment started');

    // 6. Complete appointment
    console.log('6. Completing appointment...');
    await appointmentApiService.completeAppointment(appointment.id, 'Appointment completed');

    // 7. Get final appointment details
    console.log('7. Getting final appointment details...');
    const finalAppointment = await appointmentApiService.getAppointmentById(appointment.id);
    console.log('Final appointment:', finalAppointment);

    console.log('=== Workflow completed successfully ===');
    return finalAppointment;
  } catch (error) {
    console.error('Error in complete workflow:', error);
    throw error;
  }
}

export default {
  createAppointmentExample,
  updateAppointmentStatusExample,
  getAppointmentsExample,
  searchAppointmentsExample,
  updateClientInfoExample,
  getAppointmentStatsExample,
  cancelAppointmentExample,
  rescheduleAppointmentExample,
  appointmentModelExample,
  completeWorkflowExample
};
