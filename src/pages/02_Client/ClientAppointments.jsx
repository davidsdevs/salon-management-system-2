import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../../components/appointment/AppointmentForm';
import AppointmentDetails from '../../components/appointment/AppointmentDetails';
import RescheduleModal from '../../components/appointment/RescheduleModal';
import CancelModal from '../../components/appointment/CancelModal';
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
  Edit,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const ClientAppointments = () => {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    loadAppointments();
  }, []);

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
      const result = await appointmentService.getAppointments(userData.roles?.[0], userData.uid);
      
      // Filter appointments for this client
      const clientAppointments = result.appointments.filter(apt => apt.clientId === userData.uid);
      setAppointments(clientAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (appointmentData) => {
    if (creatingAppointment) return; // Prevent duplicate submissions
    
    try {
      setCreatingAppointment(true);
      setShowLoadingModal(true);
      setLoadingMessage('Booking appointment...');
      
      // Clients can only book appointments, not create them directly
      // This would typically go through a booking request system
      const bookingRequest = {
        ...appointmentData,
        clientId: userData.uid,
        clientName: `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`.trim(),
        status: APPOINTMENT_STATUS.SCHEDULED,
        requestedBy: 'client'
      };

      // For now, we'll use the createAppointment method but with client permissions
      await appointmentService.createAppointment(bookingRequest, userData.roles?.[0], userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();

      setShowAppointmentForm(false);
      setShowLoadingModal(false);
      showSuccess('Appointment request submitted successfully!');
    } catch (error) {
      console.error('Error booking appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to book appointment: ' + error.message);
    } finally {
      setCreatingAppointment(false);
    }
  };


  const handleRescheduleAppointment = async (appointmentId, newDate, newTime, reason) => {
    try {
      setShowLoadingModal(true);
      setLoadingMessage('Rescheduling appointment...');
      
      await appointmentService.rescheduleAppointment(appointmentId, newDate, newTime, userData.roles?.[0], userData.uid, reason);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      setShowLoadingModal(false);
      showSuccess('Appointment rescheduled successfully!');
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

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(true);
    setShowAppointmentForm(true);
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
    const matchesSearch = appointment.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Calendar },
    { path: '/my-appointments', label: 'My Appointments', icon: Calendar },
    { path: '/services', label: 'Services', icon: Scissors },
    { path: '/branches', label: 'Branches', icon: MapPin },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="My Appointments">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-end items-center mb-6">
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            disabled={creatingAppointment}
            className="bg-[#160B53] hover:bg-[#160B53]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingAppointment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Booking...
              </>
            ) : (
              <>
            <Plus className="h-4 w-4 mr-2" />
                Request Appointment
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <p className="text-gray-600 mb-4">You don't have any appointments yet.</p>
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              disabled={creatingAppointment}
              className="bg-[#160B53] hover:bg-[#160B53]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingAppointment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
              <Plus className="h-4 w-4 mr-2" />
              Book Your First Appointment
                </>
              )}
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatTime(appointment.appointmentTime)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Scissors className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.serviceName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{appointment.stylistName}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{appointment.serviceName}</h3>
                        <p className="text-sm text-gray-600">with {appointment.stylistName}</p>
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
                          {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                           appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditAppointment(appointment)}
                                disabled={updatingAppointment}
                                title="Reschedule"
                                className="disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {updatingAppointment ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                ) : (
                                <Edit className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReschedule(appointment)}
                                title="Reschedule"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenCancel(appointment)}
                                disabled={cancellingAppointment === appointment.id}
                                title="Cancel"
                                className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {cancellingAppointment === appointment.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                ) : (
                                <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Appointment Form Modal */}
        {showAppointmentForm && (
          <AppointmentForm
            isOpen={showAppointmentForm}
            onClose={() => {
              setShowAppointmentForm(false);
              setSelectedAppointment(null);
              setIsEditing(false);
            }}
            onSubmit={handleBookAppointment}
            initialData={isEditing ? selectedAppointment : null}
            isEditing={isEditing}
            loading={isEditing ? updatingAppointment : creatingAppointment}
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
            onEdit={() => {
              setShowAppointmentDetails(false);
              handleEditAppointment(selectedAppointment);
            }}
            onCancel={() => {
              setShowAppointmentDetails(false);
              handleOpenCancel(selectedAppointment);
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

export default ClientAppointments;
