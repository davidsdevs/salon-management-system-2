/**
 * LeaveRequestModel - Data model for staff leave requests
 * 
 * This model handles leave request data structure and validation
 * for the salon management system.
 */

export class LeaveRequestModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.employeeId = data.employeeId || null;
    this.employeeName = data.employeeName || '';
    this.branchId = data.branchId || null;
    this.leaveType = data.leaveType || 'personal'; // personal, sick, vacation, emergency, other
    this.startDate = data.startDate || '';
    this.endDate = data.endDate || '';
    this.startTime = data.startTime || '09:00'; // For partial day leaves
    this.endTime = data.endTime || '17:00'; // For partial day leaves
    this.isFullDay = data.isFullDay !== undefined ? data.isFullDay : true;
    this.reason = data.reason || '';
    this.notes = data.notes || '';
    this.status = data.status || 'pending'; // pending, approved, denied, cancelled
    this.approvedBy = data.approvedBy || null;
    this.approvedByName = data.approvedByName || '';
    this.approvedAt = data.approvedAt || null;
    this.deniedReason = data.deniedReason || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.createdBy = data.createdBy || null;
    this.history = data.history || [];
  }

  // Validation methods
  validate() {
    const errors = [];

    if (!this.employeeId) {
      errors.push('Employee ID is required');
    }

    if (!this.branchId) {
      errors.push('Branch ID is required');
    }

    if (!this.leaveType) {
      errors.push('Leave type is required');
    }

    if (!this.startDate) {
      errors.push('Start date is required');
    }

    if (!this.endDate) {
      errors.push('End date is required');
    }

    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (start > end) {
        errors.push('Start date cannot be after end date');
      }

      if (start < new Date()) {
        errors.push('Leave cannot be requested for past dates');
      }
    }

    if (!this.isFullDay) {
      if (!this.startTime || !this.endTime) {
        errors.push('Start time and end time are required for partial day leaves');
      }

      if (this.startTime && this.endTime && this.startTime >= this.endTime) {
        errors.push('Start time must be before end time');
      }
    }

    if (!this.reason.trim()) {
      errors.push('Reason for leave is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get leave duration in days
  getDurationInDays() {
    if (!this.startDate || !this.endDate) return 0;
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  }

  // Get formatted date range
  getFormattedDateRange() {
    if (!this.startDate || !this.endDate) return '';
    
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    if (this.startDate === this.endDate) {
      return start.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`;
  }

  // Get formatted time range (for partial day leaves)
  getFormattedTimeRange() {
    if (this.isFullDay) return 'Full Day';
    
    const formatTime = (time) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(this.startTime)} - ${formatTime(this.endTime)}`;
  }

  // Check if leave is currently active
  isActive() {
    if (this.status !== 'approved') return false;
    
    const today = new Date();
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    
    return today >= start && today <= end;
  }

  // Check if leave is upcoming
  isUpcoming() {
    if (this.status !== 'approved') return false;
    
    const today = new Date();
    const start = new Date(this.startDate);
    
    return start > today;
  }

  // Get status color for UI
  getStatusColor() {
    switch (this.status) {
      case 'pending':
        return 'yellow';
      case 'approved':
        return 'green';
      case 'denied':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  }

  // Get status icon for UI
  getStatusIcon() {
    switch (this.status) {
      case 'pending':
        return 'clock';
      case 'approved':
        return 'check-circle';
      case 'denied':
        return 'x-circle';
      case 'cancelled':
        return 'minus-circle';
      default:
        return 'help-circle';
    }
  }

  // Convert to plain object for database storage
  toFirestore() {
    return {
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      branchId: this.branchId,
      leaveType: this.leaveType,
      startDate: this.startDate,
      endDate: this.endDate,
      startTime: this.startTime,
      endTime: this.endTime,
      isFullDay: this.isFullDay,
      reason: this.reason,
      notes: this.notes,
      status: this.status,
      approvedBy: this.approvedBy,
      approvedByName: this.approvedByName,
      approvedAt: this.approvedAt,
      deniedReason: this.deniedReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      history: this.history
    };
  }

  // Create from Firestore document
  static fromFirestore(doc) {
    const data = doc.data();
    return new LeaveRequestModel({
      id: doc.id,
      ...data
    });
  }
}

// Leave types constants
export const LEAVE_TYPES = {
  PERSONAL: 'personal',
  SICK: 'sick',
  VACATION: 'vacation',
  EMERGENCY: 'emergency',
  OTHER: 'other'
};

// Leave status constants
export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled'
};

// Leave type labels for UI
export const LEAVE_TYPE_LABELS = {
  [LEAVE_TYPES.PERSONAL]: 'Personal Leave',
  [LEAVE_TYPES.SICK]: 'Sick Leave',
  [LEAVE_TYPES.VACATION]: 'Vacation',
  [LEAVE_TYPES.EMERGENCY]: 'Emergency',
  [LEAVE_TYPES.OTHER]: 'Other'
};

// Status labels for UI
export const STATUS_LABELS = {
  [LEAVE_STATUS.PENDING]: 'Pending',
  [LEAVE_STATUS.APPROVED]: 'Approved',
  [LEAVE_STATUS.DENIED]: 'Denied',
  [LEAVE_STATUS.CANCELLED]: 'Cancelled'
};

