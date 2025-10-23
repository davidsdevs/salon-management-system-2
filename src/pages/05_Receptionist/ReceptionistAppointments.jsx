import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../shared/AppointmentForm';
import AppointmentDetails from '../shared/AppointmentDetails';
import RescheduleModal from '../shared/RescheduleModal';
import CancelModal from '../shared/CancelModal';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Scissors, 
  Plus, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users
} from 'lucide-react';

const ReceptionistAppointments = () => {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  
  // Notification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Loading states for buttons
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [confirmingAppointment, setConfirmingAppointment] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    loadAppointments();
    loadClients();
  }, [statusFilter]);


  // Helper functions for notifications
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => setShowErrorMessage(false), 5000);
  };



  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user's branch ID for filtering
      const branchId = userData.branchId;
      const userRole = userData.roles?.[0];
      
      console.log('Loading appointments for receptionist:', {
        branchId,
        userRole,
        statusFilter
      });
      
      // Set up filters for receptionist
      const filters = {
        branchId: branchId, // Filter by receptionist's branch
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const result = await appointmentService.getAppointments(
        filters,
        userRole,
        userData.uid
      );
      
      console.log('Appointments loaded:', result);
      setAppointments(result.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await appointmentService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    if (creatingAppointment) return; // Prevent duplicate submissions
    
    try {
      setCreatingAppointment(true);
      setShowLoadingModal(true);
      setLoadingMessage('Creating appointment...');
      
      await appointmentService.createAppointment(appointmentData, userData.roles?.[0], userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowAppointmentForm(false);
      setShowLoadingModal(false);
      showSuccess('Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to create appointment: ' + error.message);
    } finally {
      setCreatingAppointment(false);
    }
  };


  const handleConfirmAppointment = async (appointmentId) => {
    if (confirmingAppointment === appointmentId) return; // Prevent duplicate submissions
    
    try {
      setConfirmingAppointment(appointmentId);
      setShowLoadingModal(true);
      setLoadingMessage('Confirming appointment...');
      
      await appointmentService.updateAppointment(appointmentId, { 
        status: APPOINTMENT_STATUS.CONFIRMED 
      }, userData.roles?.[0], userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowLoadingModal(false);
      showSuccess('Appointment confirmed successfully!');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to confirm appointment: ' + error.message);
    } finally {
      setConfirmingAppointment(null);
    }
  };


  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  // Reschedule and Cancel handlers
  const handleRescheduleAppointment = async (appointmentId, newDate, newTime, reason) => {
    try {
      setShowLoadingModal(true);
      setLoadingMessage('Rescheduling appointment...');
      
      await appointmentService.rescheduleAppointment(
        appointmentId, 
        newDate, 
        newTime, 
        userData.roles?.[0], 
        userData.uid, 
        reason
      );
      
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      setShowLoadingModal(false);
      showSuccess('Appointment rescheduled successfully!');
      await loadAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to reschedule appointment: ' + error.message);
    }
  };

  const handleOpenReschedule = (appointment) => {
    setRescheduleAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      setShowLoadingModal(true);
      setLoadingMessage('Cancelling appointment...');
      
      await appointmentService.cancelAppointment(
        appointmentId, 
        reason, 
        userData.roles?.[0], 
        userData.uid
      );
      
      setShowCancelModal(false);
      setCancelAppointment(null);
      setShowLoadingModal(false);
      showSuccess('Appointment cancelled successfully!');
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to cancel appointment: ' + error.message);
    }
  };

  const handleOpenCancel = (appointment) => {
    setCancelAppointment(appointment);
    setShowCancelModal(true);
  };



  const getStatusBadge = (status) => {
    const statusConfig = {
      [APPOINTMENT_STATUS.SCHEDULED]: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      [APPOINTMENT_STATUS.CONFIRMED]: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      [APPOINTMENT_STATUS.IN_PROGRESS]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      [APPOINTMENT_STATUS.COMPLETED]: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      [APPOINTMENT_STATUS.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // If time is already in HH:MM format, convert to 12-hour format
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    // If time is a timestamp, format it
    const d = time.toDate ? time.toDate() : new Date(time);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    const matchesDate = !dateFilter || (appointment.appointmentDate && 
      formatDate(appointment.appointmentDate).toLowerCase().includes(dateFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Calendar },
    { path: '/receptionist-appointments', label: 'Appointments', icon: Calendar },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointment Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-end items-center mb-6">
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            disabled={creatingAppointment}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingAppointment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => {
                    const today = new Date();
                    const aptDate = apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate);
                    return aptDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === APPOINTMENT_STATUS.SCHEDULED).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={APPOINTMENT_STATUS.SCHEDULED}>Scheduled</option>
                <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                <option value={APPOINTMENT_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
                <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-4">No appointments match your current filters.</p>
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Appointment
            </Button>
          </Card>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <li key={appointment.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{formatTime(appointment.appointmentTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{appointment.clientName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Scissors className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{appointment.serviceName}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{appointment.serviceName}</h3>
                              <p className="text-sm text-gray-600">Client: {appointment.clientName}</p>
                              <p className="text-sm text-gray-600">Stylist: {appointment.stylistName}</p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(appointment.status)}
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewAppointment(appointment)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {appointment.status === APPOINTMENT_STATUS.SCHEDULED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmAppointment(appointment.id)}
                                    disabled={confirmingAppointment === appointment.id}
                                    title="Confirm Appointment"
                                    className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {confirmingAppointment === appointment.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    ) : (
                                    <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                                 appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenReschedule(appointment)}
                                    title="Reschedule Appointment"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                )}
                                {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                                 appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenCancel(appointment)}
                                    title="Cancel Appointment"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Form Modal */}
        {showAppointmentForm && (
          <AppointmentForm
            isOpen={showAppointmentForm}
            onClose={() => {
              setShowAppointmentForm(false);
              setSelectedAppointment(null);
            }}
            onSubmit={handleCreateAppointment}
            initialData={null}
            isEditing={false}
            loading={creatingAppointment}
            clients={clients}
            userData={userData}
          />
        )}

        {/* Appointment Details Modal */}
        {showAppointmentDetails && selectedAppointment && (
          <AppointmentDetails
            isOpen={showAppointmentDetails}
            onClose={() => {
              setShowAppointmentDetails(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onCancel={() => {
              setShowAppointmentDetails(false);
              handleCancelAppointmentWithConfirmation(selectedAppointment.id);
            }}
            loading={false}
          />
        )}


        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {showErrorMessage && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
        )}

        {/* Loading Modal */}
        {showLoadingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8">
              <div className="flex flex-col items-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600">{loadingMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && rescheduleAppointment && (
          <RescheduleModal
            isOpen={showRescheduleModal}
            onClose={() => {
              setShowRescheduleModal(false);
              setRescheduleAppointment(null);
            }}
            appointment={rescheduleAppointment}
            onReschedule={handleRescheduleAppointment}
            loading={false}
          />
        )}

        {/* Cancel Modal */}
        {showCancelModal && cancelAppointment && (
          <CancelModal
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setCancelAppointment(null);
            }}
            appointment={cancelAppointment}
            onCancel={handleCancelAppointment}
            loading={false}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionistAppointments;
