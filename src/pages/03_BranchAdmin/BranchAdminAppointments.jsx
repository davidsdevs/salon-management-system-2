import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../../components/appointment/AppointmentForm';
import AppointmentDetails from '../../components/appointment/AppointmentDetails';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { branchService } from '../../services/branchService';
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
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BarChart3,
  Home,
  Settings,
  Package,
  UserCog
} from 'lucide-react';

const BranchAdminAppointments = () => {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [stylistFilter, setStylistFilter] = useState('all');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Notification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadAppointments();
    loadClients();
    loadBranches();
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



  const loadBranches = async () => {
    try {
      const branchesData = await branchService.getBranches(userData?.roles?.[0], userData?.userId);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      showError('Failed to load branches');
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const result = await appointmentService.getAppointments(userData.roles?.[0], userData.uid);
      
      // Filter appointments for this branch
      const branchAppointments = result.appointments.filter(apt => apt.branchId === userData.branchId);
      setAppointments(branchAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
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
    try {
      const newAppointment = {
        ...appointmentData,
        branchId: userData.branchId
      };
      await appointmentService.createAppointment(newAppointment, userData.roles?.[0]);
      setShowAppointmentForm(false);
      await loadAppointments();
      showSuccess('Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      showError('Failed to create appointment: ' + error.message);
    }
  };

  const handleUpdateAppointment = async (appointmentId, updateData) => {
    try {
      await appointmentService.updateAppointment(appointmentId, updateData, userData.roles?.[0]);
      setShowAppointmentForm(false);
      setSelectedAppointment(null);
      setIsEditing(false);
      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { 
        status: APPOINTMENT_STATUS.CONFIRMED 
      }, userData.roles?.[0]);
      await loadAppointments();
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setError('Failed to confirm appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentService.updateAppointment(appointmentId, { 
        status: APPOINTMENT_STATUS.CANCELLED 
      }, userData.roles?.[0]);
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
    
    const matchesStylist = stylistFilter === 'all' || appointment.stylistId === stylistFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesStylist;
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/branch-settings', label: 'Branch Settings', icon: Settings },
    { path: '/service-config', label: 'Service Configuration', icon: Scissors },
    { path: '/holiday-management', label: 'Holiday Management', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Appointments">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-end items-center mb-6">
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            className="bg-[#160B53] hover:bg-[#160B53]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
          
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Stylists</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(appointments.map(apt => apt.stylistId)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Stylists</option>
                {Array.from(new Set(appointments.map(apt => apt.stylistId))).map(stylistId => {
                  const appointment = appointments.find(apt => apt.stylistId === stylistId);
                  return (
                    <option key={stylistId} value={stylistId}>
                      {appointment?.stylistName || 'Unknown Stylist'}
                    </option>
                  );
                })}
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
            <p className="text-gray-600 mb-4">No appointments match your current filters.</p>
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90"
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditAppointment(appointment)}
                                  title="Edit Appointment"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {appointment.status === APPOINTMENT_STATUS.SCHEDULED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmAppointment(appointment.id)}
                                    title="Confirm Appointment"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                                 appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelAppointment(appointment.id)}
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
              setIsEditing(false);
            }}
            onSubmit={isEditing ? handleUpdateAppointment : handleCreateAppointment}
            initialData={isEditing ? selectedAppointment : null}
            isEditing={isEditing}
            loading={false}
            branches={branches}
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


        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              {successMessage}
            </div>
          </div>
        )}

        {/* Error Message */}
        {showErrorMessage && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              {errorMessage}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchAdminAppointments;