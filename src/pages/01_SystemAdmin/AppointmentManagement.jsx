import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../shared/AppointmentForm';
import AppointmentDetails from '../shared/AppointmentDetails';
import { 
  Calendar, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock,
  XCircle,
  Filter,
  MoreVertical,
  Home,
  Building2,
  Settings,
  BarChart3,
  UserCog,
  Eye
} from 'lucide-react';

const AppointmentManagement = () => {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStylist, setSelectedStylist] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  
  // Modal states
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Data for dropdowns
  const [branches, setBranches] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [clients, setClients] = useState([]);

  const pageSize = 20;

  useEffect(() => {
    loadAppointments();
    loadDropdownData();
  }, [currentPage, selectedStatus, selectedBranch, selectedStylist]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        status: selectedStatus || undefined,
        branchId: selectedBranch || undefined,
        stylistId: selectedStylist || undefined
      };

      const result = await appointmentService.getAppointments(
        filters,
        userData.roles?.[0],
        userData.uid,
        pageSize,
        lastDoc
      );
      
      setAppointments(result.appointments);
      setHasMore(result.hasMore);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      // Load branches
      const branchesResult = await branchService.getBranches(
        userData.roles?.[0],
        userData.uid
      );
      setBranches(branchesResult.branches || []);

      // Load stylists
      const stylistsResult = await userService.getUsers(
        userData.roles?.[0],
        userData.uid
      );
      const stylistUsers = stylistsResult.users.filter(user => 
        user.role === 'stylist' && user.isActive
      );
      setStylists(stylistUsers);

      // Load clients
      const clientsResult = await userService.getUsers(
        userData.roles?.[0],
        userData.uid
      );
      const clientUsers = clientsResult.users.filter(user => 
        user.role === 'client' && user.isActive
      );
      setClients(clientUsers);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setLastDoc(null);
    loadAppointments();
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    setLastDoc(null);
  };

  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    setCurrentPage(1);
    setLastDoc(null);
  };

  const handleStylistChange = (stylistId) => {
    setSelectedStylist(stylistId);
    setCurrentPage(1);
    setLastDoc(null);
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Modal handlers
  const handleAddAppointment = () => {
    setSelectedAppointment(null);
    setIsEditing(false);
    setShowAppointmentForm(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setIsEditing(true);
    setShowAppointmentForm(true);
  };

  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const handleCloseModals = () => {
    setShowAppointmentForm(false);
    setShowAppointmentDetails(false);
    setSelectedAppointment(null);
    setIsEditing(false);
    setFormLoading(false);
    setError('');
    setSuccess('');
  };

  // Form submission
  const handleAppointmentSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      if (isEditing && selectedAppointment) {
        // Update existing appointment
        await appointmentService.updateAppointment(
          selectedAppointment.id, 
          formData, 
          userData.roles?.[0],
          userData.uid
        );
        setSuccess('Appointment updated successfully!');
      } else {
        // Create new appointment
        await appointmentService.createAppointment(
          formData, 
          userData.roles?.[0],
          userData.uid
        );
        setSuccess('Appointment created successfully!');
      }

      // Reload appointments
      setCurrentPage(1);
      setLastDoc(null);
      await loadAppointments();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseModals();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus, notes = '') => {
    try {
      await appointmentService.updateAppointment(
        appointmentId,
        { status: newStatus, notes },
        userData.roles?.[0],
        userData.uid
      );
      setSuccess(`Appointment ${newStatus} successfully!`);
      await loadAppointments();
    } catch (error) {
      setError(error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getStatusBadge = (status) => {
    const colors = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'bg-yellow-100 text-yellow-800',
      [APPOINTMENT_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
      [APPOINTMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
      [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    };

    const icons = {
      [APPOINTMENT_STATUS.SCHEDULED]: <Clock className="w-3 h-3" />,
      [APPOINTMENT_STATUS.CONFIRMED]: <CheckCircle className="w-3 h-3" />,
      [APPOINTMENT_STATUS.IN_PROGRESS]: <Clock className="w-3 h-3" />,
      [APPOINTMENT_STATUS.COMPLETED]: <CheckCircle className="w-3 h-3" />,
      [APPOINTMENT_STATUS.CANCELLED]: <XCircle className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        <span className="ml-1 capitalize">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getStatusActions = (appointment) => {
    const actions = [];
    const currentStatus = appointment.status;

    if (currentStatus === APPOINTMENT_STATUS.SCHEDULED) {
      actions.push(
        <Button
          key="confirm"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.CONFIRMED)}
        >
          Confirm
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.CONFIRMED) {
      actions.push(
        <Button
          key="start"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.IN_PROGRESS)}
        >
          Start
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.IN_PROGRESS) {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.COMPLETED)}
        >
          Complete
        </Button>
      );
    }

    if ([APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(currentStatus)) {
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="outline"
          onClick={() => handleStatusUpdate(appointment.id, APPOINTMENT_STATUS.CANCELLED)}
        >
          Cancel
        </Button>
      );
    }

    return actions;
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Building2 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointment Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Button onClick={handleAddAppointment} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Appointment
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" size="sm">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value={APPOINTMENT_STATUS.SCHEDULED}>Scheduled</option>
                <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                <option value={APPOINTMENT_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
                <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stylist</label>
              <select
                value={selectedStylist}
                onChange={(e) => handleStylistChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Stylists</option>
                {stylists.map(stylist => (
                  <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Appointments List */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Appointments</h2>
              <div className="text-sm text-gray-500">
                {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading appointments...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No appointments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{appointment.clientName}</h3>
                          {getStatusBadge(appointment.status)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span> {formatDate(appointment.appointmentDate)}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {formatTime(appointment.appointmentTime)}
                          </div>
                          <div>
                            <span className="font-medium">Stylist:</span> {appointment.stylistName}
                          </div>
                        </div>
                        {appointment.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {appointment.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusActions(appointment)}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAppointment(appointment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditAppointment(appointment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-6">
                <Button onClick={loadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showAppointmentForm && (
        <AppointmentForm
          isOpen={showAppointmentForm}
          onClose={handleCloseModals}
          onSubmit={handleAppointmentSubmit}
          initialData={selectedAppointment}
          isEditing={isEditing}
          loading={formLoading}
          branches={branches}
          stylists={stylists}
          clients={clients}
          userData={userData}
        />
      )}

      {showAppointmentDetails && (
        <AppointmentDetails
          appointment={selectedAppointment}
          onClose={handleCloseModals}
          onEdit={() => {
            setShowAppointmentDetails(false);
            handleEditAppointment(selectedAppointment);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default AppointmentManagement;
