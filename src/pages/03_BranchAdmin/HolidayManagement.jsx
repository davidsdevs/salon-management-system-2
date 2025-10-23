import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Search,
  Filter,
  Home,
  Users,
  Settings,
  Scissors,
  BarChart3,
  UserCog,
  Package,
  Star,
  Gift,
  Heart
} from 'lucide-react';

const HolidayManagement = () => {
  const { userData } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

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

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'public',
    description: '',
    isRecurring: false,
    isActive: true
  });

  const holidayTypes = [
    { value: 'public', label: 'Public Holiday', icon: Star, color: 'text-blue-600' },
    { value: 'religious', label: 'Religious Holiday', icon: Heart, color: 'text-purple-600' },
    { value: 'national', label: 'National Holiday', icon: Gift, color: 'text-green-600' },
    { value: 'branch', label: 'Branch Closure', icon: AlertCircle, color: 'text-red-600' },
    { value: 'special', label: 'Special Event', icon: Calendar, color: 'text-yellow-600' }
  ];

  useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load holidays for this branch
      const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
      setHolidays(branch.holidays || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      setError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      
      const holidayData = {
        ...formData,
        id: editingHoliday ? editingHoliday.id : Date.now().toString(),
        createdAt: editingHoliday ? editingHoliday.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedHolidays;
      if (editingHoliday) {
        // Update existing holiday
        updatedHolidays = holidays.map(holiday => 
          holiday.id === editingHoliday.id ? holidayData : holiday
        );
      } else {
        // Add new holiday
        updatedHolidays = [...holidays, holidayData];
      }

      // Update branch with new holidays
      await branchService.updateBranch(userData.branchId, { holidays: updatedHolidays }, userData.roles?.[0], userData.uid);
      
      setHolidays(updatedHolidays);
      setShowHolidayModal(false);
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: '',
        type: 'public',
        description: '',
        isRecurring: false,
        isActive: true
      });
      setSuccess(editingHoliday ? 'Holiday updated successfully' : 'Holiday added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving holiday:', error);
      setError('Failed to save holiday');
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name || '',
      date: holiday.date || '',
      type: holiday.type || 'public',
      description: holiday.description || '',
      isRecurring: holiday.isRecurring || false,
      isActive: holiday.isActive !== false
    });
    setShowHolidayModal(true);
  };

  const handleDelete = async (holidayId) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        const updatedHolidays = holidays.filter(holiday => holiday.id !== holidayId);
        await branchService.updateBranch(userData.branchId, { holidays: updatedHolidays }, userData.roles?.[0], userData.uid);
        setHolidays(updatedHolidays);
        setSuccess('Holiday deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting holiday:', error);
        setError('Failed to delete holiday');
      }
    }
  };

  const handleToggleStatus = async (holidayId) => {
    try {
      const updatedHolidays = holidays.map(holiday => 
        holiday.id === holidayId 
          ? { ...holiday, isActive: !holiday.isActive, updatedAt: new Date().toISOString() }
          : holiday
      );
      await branchService.updateBranch(userData.branchId, { holidays: updatedHolidays }, userData.roles?.[0], userData.uid);
      setHolidays(updatedHolidays);
    } catch (error) {
      console.error('Error updating holiday status:', error);
      setError('Failed to update holiday status');
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        holiday.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || holiday.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getHolidayStats = () => {
    const total = holidays.length;
    const active = holidays.filter(h => h.isActive).length;
    const inactive = total - active;
    const byType = {};
    
    holidayTypes.forEach(type => {
      byType[type.value] = holidays.filter(h => h.type === type.value).length;
    });
    
    return { total, active, inactive, byType };
  };

  const getTypeInfo = (type) => {
    return holidayTypes.find(t => t.value === type) || holidayTypes[0];
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    return holidays
      .filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= today && holiday.isActive;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);
  };

  const stats = getHolidayStats();
  const upcomingHolidays = getUpcomingHolidays();

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Holiday Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Holiday Management</h1>
            <p className="text-gray-600">Manage branch holidays, closures, and special events</p>
          </div>
          <Button 
            onClick={() => {
              setEditingHoliday(null);
              setFormData({
                name: '',
                date: '',
                type: 'public',
                description: '',
                isRecurring: false,
                isActive: true
              });
              setShowHolidayModal(true);
            }}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Holidays</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Holidays</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Holidays</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingHolidays.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Holidays */}
        {upcomingHolidays.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingHolidays.map(holiday => {
                const typeInfo = getTypeInfo(holiday.type);
                const Icon = typeInfo.icon;
                return (
                  <div key={holiday.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className={`h-6 w-6 ${typeInfo.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{holiday.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(holiday.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search holidays by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-48">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Types</option>
                {holidayTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Holidays List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredHolidays.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || typeFilter !== 'all' 
                ? 'No holidays match your current filters.' 
                : 'No holidays are configured for this branch yet.'
              }
            </p>
            <Button 
              onClick={() => setShowHolidayModal(true)}
              className="flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Holiday
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHolidays.map(holiday => {
              const typeInfo = getTypeInfo(holiday.type);
              const Icon = typeInfo.icon;
              const isUpcoming = new Date(holiday.date) >= new Date();
              
              return (
                <Card key={holiday.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center ${typeInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <Icon className={`h-6 w-6 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
                        <p className="text-sm text-gray-600">{typeInfo.label}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {holiday.isActive ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${holiday.isActive ? 'text-green-600' : 'text-red-600'}`}>
                        {holiday.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(holiday.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    {holiday.description && (
                      <p className="text-sm text-gray-600">{holiday.description}</p>
                    )}
                    
                    {holiday.isRecurring && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Clock className="h-4 w-4 mr-2" />
                        Recurring annually
                      </div>
                    )}
                    
                    {isUpcoming && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Upcoming
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEdit(holiday)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleStatus(holiday.id)}
                      className={holiday.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {holiday.isActive ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(holiday.id)}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Holiday Modal */}
        {showHolidayModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 mr-3 text-[#160B53]" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                    </h2>
                    <p className="text-sm text-gray-600">Configure holiday details and settings</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Christmas Day"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <Input
                        name="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                      >
                        {holidayTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                      placeholder="Describe the holiday or closure reason..."
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Recurring annually</label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm font-medium text-gray-700">Active holiday</label>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HolidayManagement;