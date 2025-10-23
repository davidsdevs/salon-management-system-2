import { appointmentService } from './appointmentService';
import { AppointmentModel } from '../models/AppointmentModel';
import { AppointmentValidationService } from './appointmentValidationService';

class AppointmentApiService {
  constructor() {
    // Use the existing appointment service for now
    this.appointmentService = appointmentService;
  }

  // Create appointment using your data structure
  async createAppointment(appointmentData, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      // Validate appointment data
      const validation = AppointmentValidationService.validateAppointmentData(appointmentData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize data
      const sanitizedData = AppointmentValidationService.sanitizeAppointmentData(appointmentData);

      // Create appointment using the existing service
      const result = await this.appointmentService.createAppointment(
        sanitizedData,
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Update appointment
  async updateAppointment(appointmentId, updateData, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      // Validate update data
      const validation = AppointmentValidationService.validateAppointmentData(updateData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Sanitize data
      const sanitizedData = AppointmentValidationService.sanitizeAppointmentData(updateData);

      // Update appointment using the existing service
      const result = await this.appointmentService.updateAppointment(
        appointmentId,
        sanitizedData,
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  // Get appointments with filters
  async getAppointments(filters = {}, currentUserRole = 'branch_manager', currentUserId = 'current_user', pageSize = 20, lastDoc = null) {
    try {
      const result = await this.appointmentService.getAppointments(
        filters,
        currentUserRole,
        currentUserId,
        pageSize,
        lastDoc
      );

      return {
        appointments: result.appointments.map(apt => 
          AppointmentModel.fromDataStructure(apt)
        ),
        lastDoc: result.lastDoc,
        hasMore: result.hasMore
      };
    } catch (error) {
      console.error('Error getting appointments:', error);
      throw error;
    }
  }

  // Get appointment by ID
  async getAppointmentById(appointmentId, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const result = await this.appointmentService.getAppointmentById(
        appointmentId,
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      throw error;
    }
  }

  // Cancel appointment
  async cancelAppointment(appointmentId, reason = '', currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      // Use the appointment service directly for status updates to avoid validation issues
      const result = await this.appointmentService.updateAppointmentStatus(
        appointmentId,
        'cancelled',
        reason || 'Appointment cancelled',
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  // Complete appointment
  async completeAppointment(appointmentId, notes = '', currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const result = await this.appointmentService.completeAppointment(
        appointmentId,
        notes,
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }
  }

  // Confirm appointment
  async confirmAppointment(appointmentId, notes = '', currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      // Use the appointment service directly for status updates to avoid validation issues
      const result = await this.appointmentService.updateAppointmentStatus(
        appointmentId,
        'confirmed',
        notes,
        currentUserRole,
        currentUserId
      );

      return AppointmentModel.fromDataStructure(result);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      throw error;
    }
  }

  // Start appointment (mark as in progress)
  async startAppointment(appointmentId, notes = '', currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      return await this.updateAppointment(appointmentId, {
        status: 'in_progress',
        notes
      }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error starting appointment:', error);
      throw error;
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(appointmentId, newDate, newTime, notes = '', currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      return await this.updateAppointment(appointmentId, {
        appointmentDate: newDate,
        appointmentTime: newTime,
        notes: notes || 'Appointment rescheduled'
      }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      throw error;
    }
  }

  // Update client information
  async updateClientInfo(appointmentId, clientInfo, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      // Validate client info
      const clientInfoErrors = AppointmentValidationService.validateClientInfo(clientInfo);
      if (clientInfoErrors.length > 0) {
        throw new Error(`Client info validation failed: ${clientInfoErrors.join(', ')}`);
      }

      return await this.updateAppointment(appointmentId, {
        clientInfo,
        notes: 'Client information updated'
      }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error updating client info:', error);
      throw error;
    }
  }

  // Get appointments by client ID
  async getAppointmentsByClientId(clientId, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      return await this.getAppointments({ clientId }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error getting appointments by client ID:', error);
      throw error;
    }
  }

  // Get appointments by stylist ID
  async getAppointmentsByStylistId(stylistId, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      return await this.getAppointments({ stylistId }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error getting appointments by stylist ID:', error);
      throw error;
    }
  }

  // Get appointments by date range
  async getAppointmentsByDateRange(startDate, endDate, branchId = null, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const filters = {
        dateFrom: startDate,
        dateTo: endDate,
        ...(branchId && { branchId })
      };
      return await this.getAppointments(filters, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error getting appointments by date range:', error);
      throw error;
    }
  }

  // Get appointments by status
  async getAppointmentsByStatus(status, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      return await this.getAppointments({ status }, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error getting appointments by status:', error);
      throw error;
    }
  }

  // Search appointments
  async searchAppointments(searchTerm, filters = {}, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const appointments = await this.getAppointments(filters, currentUserRole, currentUserId, 1000);
      
      if (!searchTerm) {
        return appointments;
      }

      const searchLower = searchTerm.toLowerCase();
      const filteredAppointments = appointments.appointments.filter(appointment => 
        appointment.getClientDisplayName().toLowerCase().includes(searchLower) ||
        appointment.notes.toLowerCase().includes(searchLower) ||
        appointment.appointmentDate.includes(searchTerm) ||
        appointment.appointmentTime.includes(searchTerm)
      );

      return {
        appointments: filteredAppointments,
        lastDoc: appointments.lastDoc,
        hasMore: appointments.hasMore
      };
    } catch (error) {
      console.error('Error searching appointments:', error);
      throw error;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(filters = {}, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const appointments = await this.getAppointments(filters, currentUserRole, currentUserId, 1000);
      
      const stats = {
        total: 0,
        scheduled: 0,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        byBranch: {},
        byStylist: {},
        byDate: {}
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

        // By date
        if (!stats.byDate[appointment.appointmentDate]) {
          stats.byDate[appointment.appointmentDate] = 0;
        }
        stats.byDate[appointment.appointmentDate]++;
      });

      return stats;
    } catch (error) {
      console.error('Error getting appointment stats:', error);
      throw error;
    }
  }

  // Create appointment from your data structure
  async createAppointmentFromStructure(data, currentUserRole = 'branch_manager', currentUserId = 'current_user') {
    try {
      const { appointmentData, validation } = AppointmentValidationService.createAppointmentFromStructure(data);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (validation.warnings.length > 0) {
        console.warn('Validation warnings:', validation.warnings);
      }

      return await this.createAppointment(appointmentData, currentUserRole, currentUserId);
    } catch (error) {
      console.error('Error creating appointment from structure:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const appointmentApiService = new AppointmentApiService();
export default appointmentApiService;
