import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Building2,
  Building,
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Edit, 
  Save, 
  X, 
  Plus, 
  Trash2,
  Search,
  Filter,
  Home,
  UserCog,
  BarChart3,
  Settings,
  Scissors,
  Package2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';

const BranchDetailsManagement = () => {
  const { userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Building2 },
    { path: '/service-management', label: 'Services', icon: Scissors },
    { path: '/master-products', label: 'Master Products', icon: Package2 },
    { path: '/suppliers', label: 'Suppliers', icon: Building },
    { path: '/admin/transactions', label: 'Transactions', icon: DollarSign },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    isActive: true,
    operatingHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    services: [],
    holidays: []
  });

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

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await branchService.getBranches(userData.roles?.[0], userData.uid);
      setBranches(response.branches || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const loadBranchDetails = async (branchId) => {
    try {
      const branch = await branchService.getBranch(branchId, userData.roles?.[0], userData.uid);
      setSelectedBranch(branch);
      setFormData({
        name: branch.name || '',
        address: branch.address || '',
        contactNumber: branch.contactNumber || '',
        email: branch.email || '',
        isActive: branch.isActive !== false,
        operatingHours: branch.operatingHours || formData.operatingHours,
        services: branch.services || [],
        holidays: branch.holidays || []
      });
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading branch details:', error);
      setError('Failed to load branch details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          isOpen: !prev.operatingHours[day].isOpen
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      if (selectedBranch) {
        await branchService.updateBranch(selectedBranch.id, formData, userData.roles?.[0], userData.uid);
        await loadBranches();
        setIsEditing(false);
        setError('');
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      setError('Failed to update branch');
    }
  };

  const handleToggleStatus = async (branchId, newStatus) => {
    try {
      await branchService.updateBranch(branchId, { isActive: newStatus }, userData.roles?.[0], userData.uid);
      await loadBranches();
    } catch (error) {
      console.error('Error updating branch status:', error);
      setError('Failed to update branch status');
    }
  };

  const getBranchStatus = (branch) => {
    if (!branch.isActive) return { status: 'inactive', color: 'text-red-600', bg: 'bg-red-100' };
    return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        branch.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && branch.isActive) ||
                         (statusFilter === 'inactive' && !branch.isActive);
    return matchesSearch && matchesStatus;
  });

  const getOverallStats = () => {
    const total = branches.length;
    const active = branches.filter(b => b.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  };

  const stats = getOverallStats();

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Details Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Details Management</h1>
            <p className="text-gray-600">Comprehensive management of all branch details and configurations</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search branches by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Branches List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No branches match your current filters.' 
                : 'No branches are available.'
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => {
              const branchStatus = getBranchStatus(branch);
              return (
                <Card key={branch.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                        {branch.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(branchStatus.status)}
                      <span className={`text-sm font-medium ${branchStatus.color}`}>
                        {branchStatus.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {branch.contactNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {branch.contactNumber}
                      </div>
                    )}
                    
                    {branch.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {branch.email}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {branch.address}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => loadBranchDetails(branch.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(branch.id, !branch.isActive)}
                      className={branch.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {branch.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Branch Details Modal */}
        {showDetails && selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Building2 className="h-6 w-6 mr-3 text-[#160B53]" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{selectedBranch.name} Details</h2>
                    <p className="text-sm text-gray-600">Comprehensive branch information and settings</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} className="flex items-center">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          loadBranchDetails(selectedBranch.id);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleSave} className="flex items-center">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <Input
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <Input
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-50' : ''}
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Active Branch</label>
                      </div>
                    </div>
                  </Card>

                  {/* Operating Hours */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
                    <div className="space-y-4">
                      {days.map(day => (
                        <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="w-24">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.operatingHours[day].isOpen}
                                onChange={() => handleDayToggle(day)}
                                disabled={!isEditing}
                                className="mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">
                                {dayLabels[day]}
                              </span>
                            </label>
                          </div>
                          
                          {formData.operatingHours[day].isOpen ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                type="time"
                                value={formData.operatingHours[day].open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                disabled={!isEditing}
                                className={!isEditing ? 'bg-gray-50' : ''}
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={formData.operatingHours[day].close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                disabled={!isEditing}
                                className={!isEditing ? 'bg-gray-50' : ''}
                              />
                            </div>
                          ) : (
                            <span className="text-gray-500 text-sm">Closed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Services and Holidays Placeholders */}
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Services & Holidays</h3>
                    <div className="text-center py-8 text-gray-500">
                      <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Service and holiday management will be implemented in the next phase</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchDetailsManagement;