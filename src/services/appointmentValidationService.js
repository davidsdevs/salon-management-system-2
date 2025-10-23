// Appointment data validation service
export class AppointmentValidationService {
  
  // Validate appointment data structure
  static validateAppointmentData(appointmentData) {
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!appointmentData.appointmentDate) {
      errors.push('appointmentDate is required');
    } else if (!this.isValidDate(appointmentData.appointmentDate)) {
      errors.push('appointmentDate must be a valid date in YYYY-MM-DD format');
    }

    if (!appointmentData.appointmentTime) {
      errors.push('appointmentTime is required');
    } else if (!this.isValidTime(appointmentData.appointmentTime)) {
      errors.push('appointmentTime must be a valid time in HH:MM format');
    }

    if (!appointmentData.branchId) {
      errors.push('branchId is required');
    }

    if (!appointmentData.stylistId) {
      errors.push('stylistId is required');
    }

    if (!appointmentData.serviceIds || !Array.isArray(appointmentData.serviceIds) || appointmentData.serviceIds.length === 0) {
      errors.push('serviceIds is required and must be a non-empty array');
    }

    // Client information validation
    if (appointmentData.isNewClient) {
      if (!appointmentData.newClientName && !appointmentData.clientName) {
        errors.push('newClientName or clientName is required for new clients');
      }
    } else {
      if (!appointmentData.clientId) {
        errors.push('clientId is required for existing clients');
      }
    }

    // Client info validation
    if (appointmentData.clientInfo) {
      const clientInfoErrors = this.validateClientInfo(appointmentData.clientInfo);
      errors.push(...clientInfoErrors);
    }

    // Date/time validation
    if (appointmentData.appointmentDate && appointmentData.appointmentTime) {
      const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
      const now = new Date();
      
      if (appointmentDateTime <= now) {
        errors.push('Appointment must be scheduled in the future');
      }

      // Check if appointment is within business hours (9 AM - 9 PM)
      const hour = appointmentDateTime.getHours();
      if (hour < 9 || hour > 21) {
        warnings.push('Appointment is outside normal business hours (9 AM - 9 PM)');
      }
    }

    // Notes validation
    if (appointmentData.notes && appointmentData.notes.length > 500) {
      warnings.push('Notes exceed recommended length of 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate client information
  static validateClientInfo(clientInfo) {
    const errors = [];

    if (!clientInfo.name || clientInfo.name.trim().length === 0) {
      errors.push('Client name is required');
    } else if (clientInfo.name.length > 100) {
      errors.push('Client name must be less than 100 characters');
    }

    if (clientInfo.phone && !this.isValidPhone(clientInfo.phone)) {
      errors.push('Invalid phone number format');
    }

    if (clientInfo.email && !this.isValidEmail(clientInfo.email)) {
      errors.push('Invalid email format');
    }

    if (clientInfo.address && clientInfo.address.length > 200) {
      errors.push('Address must be less than 200 characters');
    }

    return errors;
  }

  // Validate appointment history entry
  static validateHistoryEntry(historyEntry) {
    const errors = [];

    if (!historyEntry.action) {
      errors.push('History action is required');
    }

    if (!historyEntry.by) {
      errors.push('History by field is required');
    }

    if (!historyEntry.timestamp) {
      errors.push('History timestamp is required');
    } else if (!this.isValidTimestamp(historyEntry.timestamp)) {
      errors.push('Invalid timestamp format');
    }

    if (historyEntry.notes && historyEntry.notes.length > 200) {
      errors.push('History notes must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate status transition
  static validateStatusTransition(currentStatus, newStatus) {
    const STATUS_FLOW = {
      'scheduled': ['confirmed', 'cancelled'],
      'confirmed': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // Terminal state
      'cancelled': [] // Terminal state
    };

    const allowedTransitions = STATUS_FLOW[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  // Helper validation methods
  static isValidDate(dateString) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
  }

  static isValidTime(timeString) {
    const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  }

  static isValidPhone(phone) {
    // Basic phone validation - can be enhanced based on requirements
    const regex = /^[\+]?[1-9][\d]{0,15}$/;
    return regex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  static isValidTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date instanceof Date && !isNaN(date);
  }

  // Sanitize appointment data
  static sanitizeAppointmentData(appointmentData) {
    const sanitized = { ...appointmentData };

    // Sanitize string fields
    if (sanitized.notes) {
      sanitized.notes = sanitized.notes.trim().substring(0, 500);
    }

    if (sanitized.newClientName) {
      sanitized.newClientName = sanitized.newClientName.trim().substring(0, 100);
    }

    if (sanitized.clientName) {
      sanitized.clientName = sanitized.clientName.trim().substring(0, 100);
    }

    // Sanitize client info
    if (sanitized.clientInfo) {
      sanitized.clientInfo = {
        ...sanitized.clientInfo,
        name: sanitized.clientInfo.name?.trim().substring(0, 100) || '',
        phone: sanitized.clientInfo.phone?.trim() || '',
        email: sanitized.clientInfo.email?.trim().toLowerCase() || '',
        address: sanitized.clientInfo.address?.trim().substring(0, 200) || ''
      };
    }

    // Ensure serviceIds is an array of strings
    if (sanitized.serviceIds && Array.isArray(sanitized.serviceIds)) {
      sanitized.serviceIds = sanitized.serviceIds.map(id => String(id).trim()).filter(id => id.length > 0);
    }

    return sanitized;
  }

  // Create appointment data from your provided structure
  static createAppointmentFromStructure(data) {
    const appointmentData = {
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      branchId: data.branchId,
      clientId: data.clientId || '',
      clientInfo: data.clientInfo || {},
      isNewClient: data.isNewClient || false,
      newClientName: data.newClientName || '',
      notes: data.notes || '',
      serviceIds: data.serviceIds || [],
      stylistId: data.stylistId,
      status: data.status || 'scheduled',
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      history: data.history || []
    };

    // Validate the created appointment data
    const validation = this.validateAppointmentData(appointmentData);
    
    return {
      appointmentData: this.sanitizeAppointmentData(appointmentData),
      validation
    };
  }
}

export default AppointmentValidationService;
