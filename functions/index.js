// Import all Cloud Functions
const { createUser } = require('./createUser');
const appointmentService = require('./appointmentService');

// Export all functions
exports.createUser = createUser.createUser;
exports.createAppointment = appointmentService.createAppointment;
exports.updateAppointment = appointmentService.updateAppointment;
exports.getAppointments = appointmentService.getAppointments;
exports.getAppointmentById = appointmentService.getAppointmentById;
exports.cancelAppointment = appointmentService.cancelAppointment;
exports.completeAppointment = appointmentService.completeAppointment;
