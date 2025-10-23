// Appointment data model based on the provided structure
export class AppointmentModel {
  constructor(data = {}) {
    // Core appointment fields
    this.appointmentDate = data.appointmentDate || '';
    this.appointmentTime = data.appointmentTime || '';
    this.branchId = data.branchId || '';
    this.clientId = data.clientId || '';
    this.stylistId = data.stylistId || '';
    this.serviceIds = data.serviceIds || [];
    this.serviceStylistPairs = data.serviceStylistPairs || [];
    this.status = data.status || 'scheduled';
    this.notes = data.notes || '';

    // Client information
    this.clientInfo = data.clientInfo || {};
    this.isNewClient = data.isNewClient || false;
    this.newClientName = data.newClientName || '';
    this.clientName = data.clientName || '';
    this.clientEmail = data.clientEmail || '';
    this.clientPhone = data.clientPhone || '';

    // System fields
    this.id = data.id || '';
    this.createdAt = data.createdAt || null;
    this.createdBy = data.createdBy || '';
    this.updatedAt = data.updatedAt || null;

    // History tracking
    this.history = data.history || [];
  }

  // Create from your provided data structure
  static fromDataStructure(data) {
    return new AppointmentModel({
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      branchId: data.branchId,
      clientId: data.clientId,
      clientInfo: data.clientInfo,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      isNewClient: data.isNewClient,
      newClientName: data.newClientName,
      notes: data.notes,
      serviceIds: data.serviceIds,
      serviceStylistPairs: data.serviceStylistPairs,
      status: data.status,
      stylistId: data.stylistId,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      history: data.history
    });
  }

  // Convert to your data structure format
  toDataStructure() {
    return {
      appointmentDate: this.appointmentDate,
      appointmentTime: this.appointmentTime,
      branchId: this.branchId,
      clientId: this.clientId,
      clientInfo: this.clientInfo,
      clientName: this.clientName,
      clientEmail: this.clientEmail,
      clientPhone: this.clientPhone,
      isNewClient: this.isNewClient,
      newClientName: this.newClientName,
      notes: this.notes,
      serviceIds: this.serviceIds,
      serviceStylistPairs: this.serviceStylistPairs,
      status: this.status,
      stylistId: this.stylistId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      history: this.history
    };
  }

  // Add history entry
  addHistoryEntry(action, by, notes = '') {
    const historyEntry = {
      action,
      by,
      timestamp: new Date().toISOString(),
      notes
    };
    
    this.history.push(historyEntry);
    this.updatedAt = new Date();
    
    return this;
  }

  // Update status
  updateStatus(newStatus, by, notes = '') {
    this.status = newStatus;
    this.addHistoryEntry(`status_changed_to_${newStatus}`, by, notes);
    this.updatedAt = new Date();
    
    return this;
  }

  // Update client information
  updateClientInfo(clientInfo, by) {
    this.clientInfo = { ...this.clientInfo, ...clientInfo };
    this.addHistoryEntry('client_info_updated', by, `Client information updated for ${clientInfo.name || 'client'}`);
    this.updatedAt = new Date();
    
    return this;
  }

  // Get client display name
  getClientDisplayName() {
    if (this.clientInfo && this.clientInfo.name) {
      return this.clientInfo.name;
    }
    if (this.clientName) {
      return this.clientName;
    }
    if (this.newClientName) {
      return this.newClientName;
    }
    return 'Unknown Client';
  }

  // Get appointment datetime
  getAppointmentDateTime() {
    if (this.appointmentDate && this.appointmentTime) {
      return new Date(`${this.appointmentDate}T${this.appointmentTime}`);
    }
    return null;
  }

  // Check if appointment is in the past
  isPastAppointment() {
    const appointmentDateTime = this.getAppointmentDateTime();
    if (!appointmentDateTime) return false;
    return appointmentDateTime < new Date();
  }

  // Check if appointment is today
  isToday() {
    const appointmentDateTime = this.getAppointmentDateTime();
    if (!appointmentDateTime) return false;
    
    const today = new Date();
    return appointmentDateTime.toDateString() === today.toDateString();
  }

  // Get formatted appointment time
  getFormattedTime() {
    if (!this.appointmentTime) return '';
    
    const [hours, minutes] = this.appointmentTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Get formatted appointment date
  getFormattedDate() {
    if (!this.appointmentDate) return '';
    
    const date = new Date(this.appointmentDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Validate the appointment data
  validate() {
    const errors = [];

    if (!this.appointmentDate) {
      errors.push('Appointment date is required');
    }

    if (!this.appointmentTime) {
      errors.push('Appointment time is required');
    }

    if (!this.branchId) {
      errors.push('Branch ID is required');
    }

    if (!this.stylistId) {
      errors.push('Stylist ID is required');
    }

    if (!this.serviceIds || this.serviceIds.length === 0) {
      errors.push('At least one service is required');
    }

    if (this.isNewClient && !this.newClientName && !this.clientName) {
      errors.push('Client name is required for new clients');
    }

    if (!this.isNewClient && !this.clientId) {
      errors.push('Client ID is required for existing clients');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clone the appointment
  clone() {
    return new AppointmentModel(this.toDataStructure());
  }

  // Convert to JSON
  toJSON() {
    return JSON.stringify(this.toDataStructure(), null, 2);
  }

  // Create from JSON
  static fromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return new AppointmentModel(data);
    } catch (error) {
      throw new Error('Invalid JSON format for appointment data');
    }
  }
}

export default AppointmentModel;
