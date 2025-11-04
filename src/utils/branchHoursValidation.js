/**
 * Utility functions for validating appointment times against branch operating hours
 */

/**
 * Get the day of the week from a date string
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Day of the week (monday, tuesday, etc.)
 */
export const getDayOfWeek = (dateString) => {
  const date = new Date(dateString);
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Check if a branch is open on a specific day
 * @param {Object} operatingHours - Branch operating hours object
 * @param {string} dayOfWeek - Day of the week (monday, tuesday, etc.)
 * @returns {boolean} - True if branch is open on that day
 */
export const isBranchOpenOnDay = (operatingHours, dayOfWeek) => {
  if (!operatingHours || !operatingHours[dayOfWeek]) {
    return false;
  }
  return operatingHours[dayOfWeek].isOpen === true;
};

/**
 * Check if a time is within branch operating hours
 * @param {Object} operatingHours - Branch operating hours object
 * @param {string} dayOfWeek - Day of the week (monday, tuesday, etc.)
 * @param {string} time - Time in HH:MM format
 * @returns {boolean} - True if time is within operating hours
 */
export const isTimeWithinOperatingHours = (operatingHours, dayOfWeek, time) => {
  if (!isBranchOpenOnDay(operatingHours, dayOfWeek)) {
    return false;
  }

  const dayHours = operatingHours[dayOfWeek];
  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  // Convert times to minutes for easier comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const appointmentMinutes = timeToMinutes(time);
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  return appointmentMinutes >= openMinutes && appointmentMinutes <= closeMinutes;
};

/**
 * Get available time slots for a specific day
 * @param {Object} operatingHours - Branch operating hours object
 * @param {string} dayOfWeek - Day of the week (monday, tuesday, etc.)
 * @param {number} slotDuration - Duration of each slot in minutes (default: 30)
 * @returns {Array} - Array of available time slots
 */
export const getAvailableTimeSlots = (operatingHours, dayOfWeek, slotDuration = 30) => {
  if (!isBranchOpenOnDay(operatingHours, dayOfWeek)) {
    return [];
  }

  const dayHours = operatingHours[dayOfWeek];
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
  const slots = [];

  for (let minutes = openMinutes; minutes < closeMinutes; minutes += slotDuration) {
    slots.push(minutesToTime(minutes));
  }

  return slots;
};

/**
 * Validate appointment time against branch operating hours
 * @param {Object} branch - Branch object with operatingHours
 * @param {string} appointmentDate - Date in YYYY-MM-DD format
 * @param {string} appointmentTime - Time in HH:MM format
 * @returns {Object} - Validation result with isValid and message
 */
export const validateAppointmentTime = (branch, appointmentDate, appointmentTime) => {
  if (!branch || !branch.operatingHours) {
    return {
      isValid: false,
      message: 'Branch operating hours not available'
    };
  }

  const dayOfWeek = getDayOfWeek(appointmentDate);
  
  if (!isBranchOpenOnDay(branch.operatingHours, dayOfWeek)) {
    const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return {
      isValid: false,
      message: `Branch is closed on ${dayName}`
    };
  }

  if (!isTimeWithinOperatingHours(branch.operatingHours, dayOfWeek, appointmentTime)) {
    const dayHours = branch.operatingHours[dayOfWeek];
    const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    return {
      isValid: false,
      message: `Appointment time must be between ${dayHours.open} and ${dayHours.close} on ${dayName}`
    };
  }

  return {
    isValid: true,
    message: 'Appointment time is valid'
  };
};

/**
 * Convert 24-hour time to 12-hour AM/PM format
 * @param {string} time24 - Time in HH:MM format
 * @returns {string} - Time in 12-hour format with AM/PM
 */
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Get branch operating hours for display
 * @param {Object} operatingHours - Branch operating hours object
 * @returns {Array} - Array of formatted operating hours
 */
export const getFormattedOperatingHours = (operatingHours) => {
  if (!operatingHours) return [];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return days.map(day => ({
    day: dayLabels[day],
    isOpen: operatingHours[day]?.isOpen || false,
    hours: operatingHours[day]?.isOpen 
      ? `${formatTimeTo12Hour(operatingHours[day].open)} - ${formatTimeTo12Hour(operatingHours[day].close)}`
      : 'Closed'
  }));
};
