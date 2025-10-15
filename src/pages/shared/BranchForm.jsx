import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { X, Save, Building2 } from 'lucide-react';

const BranchForm = ({ branch = null, onSave, onCancel, isOpen }) => {
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    operatingHours: {},
    holidays: [],
    services: [],
    branchAdminId: '',
    managerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (branch) {
        setFormData({
          name: branch.name || '',
          address: branch.address || '',
          contactNumber: branch.contactNumber || '',
          operatingHours: branch.operatingHours || branchService.getDefaultOperatingHours(),
          holidays: branch.holidays || [],
          services: branch.services || [],
          branchAdminId: branch.branchAdminId || '',
          managerId: branch.managerId || ''
        });
      } else {
        setFormData({
          name: '',
          address: '',
          contactNumber: '',
          operatingHours: branchService.getDefaultOperatingHours(),
          holidays: [],
          services: [],
          branchAdminId: '',
          managerId: ''
        });
      }
      loadAvailableStaff();
    }
  }, [isOpen, branch]);

  const loadAvailableStaff = async () => {
    try {
      // Load available admins and managers
      const adminRoles = ['systemAdmin', 'branchAdmin'];
      const managerRoles = ['branchManager'];
      
      // This would need to be implemented in userService
      // For now, we'll use placeholder data
      setAvailableAdmins([]);
      setAvailableManagers([]);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOperatingHoursChange = (day, field, value) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (branch) {
        // Update existing branch
        await branchService.updateBranch(
          branch.id, 
          formData, 
          userData.role, 
          userData.uid
        );
      } else {
        // Create new branch
        await branchService.createBranch(
          formData, 
          userData.role, 
          userData.uid
        );
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-[#160B53] mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                {branch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Name *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter branch name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number
                    </label>
                    <Input
                      name="contactNumber"
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="Enter contact number"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter branch address"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Operating Hours */}
            <Card>
              <div className="p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Operating Hours</h4>
                <div className="space-y-3">
                  {days.map((day) => (
                    <div key={day.key} className="flex items-center space-x-4">
                      <div className="w-24 text-sm font-medium text-gray-700">
                        {day.label}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={formData.operatingHours[day.key]?.open || ''}
                          onChange={(e) => handleOperatingHoursChange(day.key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={formData.operatingHours[day.key]?.close || ''}
                          onChange={(e) => handleOperatingHoursChange(day.key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Staff Assignment */}
            <Card>
              <div className="p-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Staff Assignment</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Admin
                    </label>
                    <select
                      name="branchAdminId"
                      value={formData.branchAdminId}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    >
                      <option value="">Select Branch Admin</option>
                      {availableAdmins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch Manager
                    </label>
                    <select
                      name="managerId"
                      value={formData.managerId}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                    >
                      <option value="">Select Branch Manager</option>
                      {availableManagers.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : (branch ? 'Update Branch' : 'Create Branch')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchForm;

