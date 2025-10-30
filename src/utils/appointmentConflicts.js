/**
 * Utility functions for checking appointment conflicts and availability
 */

/**
 * Check if a specific time slot is already booked
 * @param {Array} existingAppointments - Array of existing appointments
 * @param {string} branchId - Branch ID to check
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {string} appointmentTime - Time in HH:MM format
 * @param {string} stylistId - Stylist ID to check (optional)
 * @param {string} excludeAppointmentId - Appointment ID to exclude from conflict check (for editing)
 * @returns {Object} - Conflict information
 */
export const checkTimeSlotConflict = (existingAppointments, branchId, appointmentDate, appointmentTime, stylistId = null, excludeAppointmentId = null) => {
  const conflicts = existingAppointments.filter(appointment => {
    // Skip if it's the same appointment (for editing)
    if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
      return false;
    }

    // Check if appointment is in the same branch
    if (appointment.branchId !== branchId) {
      return false;
    }

    // Check if appointment is on the same date
    if (appointment.appointmentDate !== appointmentDate) {
      return false;
    }

    // Check if appointment is at the same time
    if (appointment.appointmentTime !== appointmentTime) {
      return false;
    }

    // If stylist is specified, check for stylist conflicts
    if (stylistId && appointment.serviceStylistPairs) {
      // Check if any service in the appointment uses the same stylist
      const hasStylistConflict = appointment.serviceStylistPairs.some(pair => 
        pair.stylistId === stylistId
      );
      if (!hasStylistConflict) {
        return false;
      }
    }

    // Only consider active appointments (not cancelled or completed)
    const activeStatuses = ['scheduled', 'confirmed', 'in_service'];
    if (!activeStatuses.includes(appointment.status)) {
      return false;
    }

    return true;
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts: conflicts,
    conflictCount: conflicts.length
  };
};

/**
 * Get available time slots for a specific date and branch
 * @param {Array} existingAppointments - Array of existing appointments
 * @param {Object} branchOperatingHours - Branch operating hours
 * @param {string} branchId - Branch ID
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {string} stylistId - Stylist ID to check (optional)
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for editing)
 * @param {number} slotDuration - Duration of each slot in minutes (default: 30)
 * @returns {Array} - Array of available time slots
 */
export const getAvailableTimeSlots = (existingAppointments, branchOperatingHours, branchId, appointmentDate, stylistId = null, excludeAppointmentId = null, slotDuration = 30) => {
  // First, get all possible time slots from operating hours
  const dayOfWeek = getDayOfWeek(appointmentDate);
  
  if (!branchOperatingHours || !branchOperatingHours[dayOfWeek] || !branchOperatingHours[dayOfWeek].isOpen) {
    return [];
  }

  const dayHours = branchOperatingHours[dayOfWeek];
  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const allSlots = [];

  // Generate all possible time slots
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotDuration) {
    allSlots.push(minutesToTime(minutes));
  }

  // Filter out booked time slots
  const availableSlots = allSlots.filter(timeSlot => {
    const conflict = checkTimeSlotConflict(
      existingAppointments, 
      branchId, 
      appointmentDate, 
      timeSlot, 
      stylistId, 
      excludeAppointmentId
    );
    return !conflict.hasConflict;
  });

  return availableSlots;
};

/**
 * Get day of the week from a date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Day of the week (monday, tuesday, etc.)
 */
const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Check if a stylist is available at a specific time
 * @param {Array} existingAppointments - Array of existing appointments
 * @param {string} stylistId - Stylist ID to check
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {string} appointmentTime - Time in HH:MM format
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for editing)
 * @returns {boolean} - True if stylist is available
 */
export const isStylistAvailable = (existingAppointments, stylistId, appointmentDate, appointmentTime, excludeAppointmentId = null) => {
  const conflict = checkTimeSlotConflict(
    existingAppointments, 
    null, // Don't filter by branch for stylist availability
    appointmentDate, 
    appointmentTime, 
    stylistId, 
    excludeAppointmentId
  );
  return !conflict.hasConflict;
};

/**
 * Get stylist availability for a specific date
 * @param {Array} existingAppointments - Array of existing appointments
 * @param {string} stylistId - Stylist ID to check
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {Object} branchOperatingHours - Branch operating hours
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for editing)
 * @param {number} slotDuration - Duration of each slot in minutes (default: 30)
 * @returns {Array} - Array of available time slots for the stylist
 */
export const getStylistAvailableSlots = (existingAppointments, stylistId, appointmentDate, branchOperatingHours, excludeAppointmentId = null, slotDuration = 30) => {
  const dayOfWeek = getDayOfWeek(appointmentDate);
  
  if (!branchOperatingHours || !branchOperatingHours[dayOfWeek] || !branchOperatingHours[dayOfWeek].isOpen) {
    return [];
  }

  const dayHours = branchOperatingHours[dayOfWeek];
  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);
  const allSlots = [];

  // Generate all possible time slots
  for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotDuration) {
    allSlots.push(minutesToTime(minutes));
  }

  // Filter out slots where stylist is not available
  const availableSlots = allSlots.filter(timeSlot => {
    return isStylistAvailable(existingAppointments, stylistId, appointmentDate, timeSlot, excludeAppointmentId);
  });

  return availableSlots;
};

/**
 * Validate appointment booking against existing appointments
 * @param {Object} appointmentData - New appointment data
 * @param {Array} existingAppointments - Array of existing appointments
 * @param {string} excludeAppointmentId - Appointment ID to exclude (for editing)
 * @returns {Object} - Validation result
 */
export const validateAppointmentBooking = (appointmentData, existingAppointments, excludeAppointmentId = null) => {
  const { branchId, appointmentDate, appointmentTime, serviceStylistPairs } = appointmentData;
  
  const errors = [];
  const warnings = [];

  // Check for general time slot conflicts
  const timeConflict = checkTimeSlotConflict(
    existingAppointments, 
    branchId, 
    appointmentDate, 
    appointmentTime, 
    null, 
    excludeAppointmentId
  );

  if (timeConflict.hasConflict) {
    errors.push(`Time slot ${appointmentTime} is already booked`);
  }

  // Check for stylist-specific conflicts
  if (serviceStylistPairs && serviceStylistPairs.length > 0) {
    for (const pair of serviceStylistPairs) {
      if (pair.stylistId) {
        const stylistConflict = checkTimeSlotConflict(
          existingAppointments, 
          branchId, 
          appointmentDate, 
          appointmentTime, 
          pair.stylistId, 
          excludeAppointmentId
        );

        if (stylistConflict.hasConflict) {
          errors.push(`Stylist ${pair.stylistName || pair.stylistId} is not available at ${appointmentTime}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    conflicts: timeConflict.conflicts
  };
};
