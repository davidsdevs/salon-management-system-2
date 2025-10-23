import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Building2, 
  Clock, 
  Calendar, 
  Scissors, 
  Save, 
  Edit, 
  Settings,
  MapPin,
  Phone,
  Mail,
  Users,
  Home,
  BarChart3,
  UserCog
} from 'lucide-react';

const BranchSettings = () => {
  const { userData } = useAuth();
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    operatingHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    holidays: [],
    services: []
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/branch-settings', label: 'Branch Settings', icon: Settings },
    { path: '/service-config', label: 'Service Configuration', icon: Scissors },
    { path: '/holiday-management', label: 'Holiday Management', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Building2 },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

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
    loadBranchData();
  }, []);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      if (userData?.branchId) {
        const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
        setBranchData(branch);
        setFormData({
          name: branch.name || '',
          address: branch.address || '',
          contactNumber: branch.contactNumber || '',
          email: branch.email || '',
          operatingHours: branch.operatingHours || formData.operatingHours,
          holidays: branch.holidays || [],
          services: branch.services || []
        });
      }
    } catch (error) {
      console.error('Error loading branch data:', error);
      setError('Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      setSaving(true);
      setError('');
      
      await branchService.updateBranch(userData.branchId, formData, userData.roles?.[0], userData.uid);
      
      setSuccess('Branch settings updated successfully');
      setIsEditing(false);
      await loadBranchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating branch:', error);
      setError('Failed to update branch settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Branch Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Settings">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Settings</h1>
            <p className="text-gray-600">Manage your branch configuration, hours, and services</p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    loadBranchData();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Branch Information */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Building2 className="h-5 w-5 mr-2 text-[#160B53]" />
            <h2 className="text-lg font-semibold text-gray-900">Branch Information</h2>
          </div>
          
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
          </div>
        </Card>

        {/* Operating Hours */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 mr-2 text-[#160B53]" />
            <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
          </div>
          
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

        {/* Holidays */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 mr-2 text-[#160B53]" />
            <h2 className="text-lg font-semibold text-gray-900">Holidays & Special Dates</h2>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Holiday management will be implemented in the next phase</p>
            <p className="text-sm">This feature will allow you to set special closure dates</p>
          </div>
        </Card>

        {/* Services */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Scissors className="h-5 w-5 mr-2 text-[#160B53]" />
            <h2 className="text-lg font-semibold text-gray-900">Branch Services</h2>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <Scissors className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Service configuration will be implemented in the next phase</p>
            <p className="text-sm">This feature will allow you to manage branch-specific services and pricing</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchSettings;
