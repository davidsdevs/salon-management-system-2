import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../shared/AppointmentForm';
import AppointmentDetails from '../shared/AppointmentDetails';
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

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const result = await appointmentService.getAppointments(userData.currentRole || userData.roles?.[0], userData.uid);
      
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
    try {
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
      await appointmentService.createAppointment(bookingRequest, userData.currentRole || userData.roles?.[0], userData.uid);
      setShowAppointmentForm(false);
      await loadAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please contact the salon directly.');
    }
  };

  const handleRescheduleAppointment = async (appointmentId, newData) => {
    try {
      await appointmentService.updateAppointment(appointmentId, newData, userData.currentRole || userData.roles?.[0], userData.uid);
      setShowAppointmentForm(false);
      setSelectedAppointment(null);
      setIsEditing(false);
      await loadAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setError('Failed to reschedule appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { 
        status: APPOINTMENT_STATUS.CANCELLED 
      }, userData.currentRole || userData.roles?.[0], userData.uid);
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment');
    }
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

  const formatTime = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600">Manage your salon appointments</p>
          </div>
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            className="bg-[#160B53] hover:bg-[#160B53]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Appointment
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
              className="bg-[#160B53] hover:bg-[#160B53]/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book Your First Appointment
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
                        <span className="text-sm text-gray-600">{formatTime(appointment.appointmentDate)}</span>
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
                                title="Reschedule"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAppointment(appointment.id)}
                                title="Cancel"
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4" />
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
            onSubmit={isEditing ? handleRescheduleAppointment : handleBookAppointment}
            initialData={isEditing ? selectedAppointment : null}
            isEditing={isEditing}
            loading={false}
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
              handleCancelAppointment(selectedAppointment.id);
            }}
            loading={false}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientAppointments;