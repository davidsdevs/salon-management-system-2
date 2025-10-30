/**
 * Availability Utilities for Appointment Booking
 * 
 * These utilities help integrate the availability-based scheduling system
 * with appointment booking functionality.
 */

/**
 * Check if a staff member is available on a specific day
 * @param {Array} schedules - Array of all schedules
 * @param {string} employeeId - Staff member's ID
 * @param {string} dayOfWeek - Day of the week (e.g., "Monday", "Tuesday")
 * @returns {boolean} - True if staff is available
 */
export const isStaffAvailable = (schedules, employeeId, dayOfWeek) => {
  return schedules.some(schedule => 
    schedule.employeeId === employeeId && 
    schedule.dayOfWeek === dayOfWeek
  );
};

/**
 * Get availability details for a staff member on a specific day
 * @param {Array} schedules - Array of all schedules
 * @param {string} employeeId - Staff member's ID
 * @param {string} dayOfWeek - Day of the week (e.g., "Monday", "Tuesday")
 * @returns {Object|null} - Schedule object or null if not available
 */
export const getStaffAvailability = (schedules, employeeId, dayOfWeek) => {
  return schedules.find(schedule => 
    schedule.employeeId === employeeId && 
    schedule.dayOfWeek === dayOfWeek
  );
};

/**
 * Get all available staff for a specific day
 * @param {Array} schedules - Array of all schedules
 * @param {Array} staffData - Array of all staff members
 * @param {string} dayOfWeek - Day of the week (e.g., "Monday", "Tuesday")
 * @returns {Array} - Array of available staff members
 */
export const getAvailableStaffForDay = (schedules, staffData, dayOfWeek) => {
  return staffData.filter(staff => 
    isStaffAvailable(schedules, staff.uid || staff.id, dayOfWeek)
  );
};

/**
 * Check if a staff member is available at a specific time on a specific day
 * @param {Array} schedules - Array of all schedules
 * @param {string} employeeId - Staff member's ID
 * @param {string} dayOfWeek - Day of the week (e.g., "Monday", "Tuesday")
 * @param {string} time - Time in HH:MM format (e.g., "14:30")
 * @returns {boolean} - True if staff is available at that time
 */
export const isStaffAvailableAtTime = (schedules, employeeId, dayOfWeek, time) => {
  const availability = getStaffAvailability(schedules, employeeId, dayOfWeek);
  if (!availability) return false;
  
  const requestedTime = time;
  const startTime = availability.startTime;
  const endTime = availability.endTime;
  
  return requestedTime >= startTime && requestedTime <= endTime;
};

/**
 * Get all available time slots for a staff member on a specific day
 * @param {Array} schedules - Array of all schedules
 * @param {string} employeeId - Staff member's ID
 * @param {string} dayOfWeek - Day of the week (e.g., "Monday", "Tuesday")
 * @param {number} slotDurationMinutes - Duration of each slot in minutes (default: 30)
 * @returns {Array} - Array of available time slots
 */
export const getAvailableTimeSlots = (schedules, employeeId, dayOfWeek, slotDurationMinutes = 30) => {
  const availability = getStaffAvailability(schedules, employeeId, dayOfWeek);
  if (!availability) return [];
  
  const slots = [];
  const startTime = availability.startTime;
  const endTime = availability.endTime;
  
  // Convert time strings to minutes for easier calculation
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDurationMinutes) {
    const slotEnd = Math.min(minutes + slotDurationMinutes, endMinutes);
    slots.push({
      start: minutesToTime(minutes),
      end: minutesToTime(slotEnd),
      duration: slotDurationMinutes
    });
  }
  
  return slots;
};

/**
 * Example usage for appointment booking:
 * 
 * // Check if stylist is available on Monday
 * const isAvailable = isStaffAvailable(schedules, 'stylist123', 'Monday');
 * 
 * // Get all available stylists for Monday
 * const availableStylists = getAvailableStaffForDay(schedules, staffData, 'Monday');
 * 
 * // Check if stylist is available at 2:30 PM on Monday
 * const availableAtTime = isStaffAvailableAtTime(schedules, 'stylist123', 'Monday', '14:30');
 * 
 * // Get 30-minute time slots for a stylist on Monday
 * const timeSlots = getAvailableTimeSlots(schedules, 'stylist123', 'Monday', 30);
 */


