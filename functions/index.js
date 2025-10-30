// Import all Cloud Functions
const admin = require('firebase-admin');
admin.initializeApp();
const { createUser } = require('./createUser');
const appointmentService = require('./appointmentService');
const masterProductsService = require('./masterProductsService');
const staffService = require('./staffService');
const staffExtraService = require('./staffExtraService');
const transactionService = require('./transactionService');

// Export all functions
exports.createUser = createUser.createUser;
exports.createAppointment = appointmentService.createAppointment;
exports.updateAppointment = appointmentService.updateAppointment;
exports.getAppointments = appointmentService.getAppointments;
exports.getAppointmentById = appointmentService.getAppointmentById;
exports.cancelAppointment = appointmentService.cancelAppointment;

// Staff functions
exports.getBranchStaff = staffService.getBranchStaff;
exports.getAllServices = staffService.getAllServices;
exports.updateStaffServices = staffService.updateStaffServices;
exports.getStaffDetails = staffService.getStaffDetails;

// Transaction functions
exports.getBranchTransactions = transactionService.getBranchTransactions;
exports.completeAppointment = appointmentService.completeAppointment;

// Master Products functions
exports.createMasterProduct = masterProductsService.createMasterProduct;
exports.getMasterProducts = masterProductsService.getMasterProducts;
exports.getMasterProductById = masterProductsService.getMasterProductById;
exports.updateMasterProduct = masterProductsService.updateMasterProduct;
exports.deleteMasterProduct = masterProductsService.deleteMasterProduct;
exports.searchMasterProducts = masterProductsService.searchMasterProducts;
exports.getMasterProductStats = masterProductsService.getMasterProductStats;

// Staff functions
exports.getBranchStaff = staffService.getBranchStaff;
exports.getAllServices = staffService.getAllServices;
exports.updateStaffServices = staffService.updateStaffServices;
exports.getStaffDetails = staffService.getStaffDetails;

// Staff extra (evaluations/certificates/violations)
exports.addEvaluation = staffExtraService.addEvaluation;
exports.listEvaluations = staffExtraService.listEvaluations;
exports.deleteEvaluation = staffExtraService.deleteEvaluation;
exports.addCertificate = staffExtraService.addCertificate;
exports.listCertificates = staffExtraService.listCertificates;
exports.deleteCertificate = staffExtraService.deleteCertificate;
exports.addViolation = staffExtraService.addViolation;
exports.listViolations = staffExtraService.listViolations;
exports.deleteViolation = staffExtraService.deleteViolation;
