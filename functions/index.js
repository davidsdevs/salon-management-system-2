// Import all Cloud Functions
const { createUser } = require('./createUser');
const appointmentService = require('./appointmentService');
const masterProductsService = require('./masterProductsService');

// Export all functions
exports.createUser = createUser.createUser;
exports.createAppointment = appointmentService.createAppointment;
exports.updateAppointment = appointmentService.updateAppointment;
exports.getAppointments = appointmentService.getAppointments;
exports.getAppointmentById = appointmentService.getAppointmentById;
exports.cancelAppointment = appointmentService.cancelAppointment;
exports.completeAppointment = appointmentService.completeAppointment;

// Master Products functions
exports.createMasterProduct = masterProductsService.createMasterProduct;
exports.getMasterProducts = masterProductsService.getMasterProducts;
exports.getMasterProductById = masterProductsService.getMasterProductById;
exports.updateMasterProduct = masterProductsService.updateMasterProduct;
exports.deleteMasterProduct = masterProductsService.deleteMasterProduct;
exports.searchMasterProducts = masterProductsService.searchMasterProducts;
exports.getMasterProductStats = masterProductsService.getMasterProductStats;
