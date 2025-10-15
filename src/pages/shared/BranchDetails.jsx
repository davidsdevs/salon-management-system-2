import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  Edit, 
  X,
  Calendar,
  Settings
} from 'lucide-react';

const BranchDetails = ({ branchId, onClose, onEdit }) => {
  const { userData } = useAuth();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (branchId) {
      loadBranchDetails();
    }
  }, [branchId]);

  const loadBranchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const branchData = await branchService.getBranch(branchId, userData.role, userData.uid);
      setBranch(branchData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getOperatingHours = (operatingHours) => {
    if (!operatingHours) return [];
    
    const days = [
      { key: 'monday', label: 'Monday' },
      { key: 'tuesday', label: 'Tuesday' },
      { key: 'wednesday', label: 'Wednesday' },
      { key: 'thursday', label: 'Thursday' },
      { key: 'friday', label: 'Friday' },
      { key: 'saturday', label: 'Saturday' },
      { key: 'sunday', label: 'Sunday' }
    ];
    
    return days.map(day => ({
      ...day,
      hours: operatingHours[day.key] || { open: 'Closed', close: 'Closed' }
    }));
  };

  if (!branchId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-[#160B53] mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Branch Details</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          ) : branch ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <div className="p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                      <p className="text-sm text-gray-900">{branch.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {branch.contactNumber || 'Not provided'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-sm text-gray-900 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {branch.address}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Operating Hours */}
              <Card>
                <div className="p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Operating Hours
                  </h4>
                  <div className="space-y-2">
                    {getOperatingHours(branch.operatingHours).map((day) => (
                      <div key={day.key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <span className="text-sm font-medium text-gray-700">{day.label}</span>
                        <span className="text-sm text-gray-900">
                          {day.hours.open === 'Closed' ? 'Closed' : `${day.hours.open} - ${day.hours.close}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Holidays */}
              {branch.holidays && branch.holidays.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Holidays
                    </h4>
                    <div className="space-y-1">
                      {branch.holidays.map((holiday, index) => (
                        <div key={index} className="text-sm text-gray-900">
                          {new Date(holiday).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Staff Assignment */}
              <Card>
                <div className="p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Staff Assignment
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Admin</label>
                      <p className="text-sm text-gray-900">
                        {branch.branchAdminId ? 'Assigned' : 'Not assigned'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Branch Manager</label>
                      <p className="text-sm text-gray-900">
                        {branch.managerId ? 'Assigned' : 'Not assigned'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Status and Dates */}
              <Card>
                <div className="p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Status & Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        branch.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-sm text-gray-900">{formatDate(branch.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                      <p className="text-sm text-gray-900">{formatDate(branch.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                  onClick={() => onEdit(branch)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Branch
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default BranchDetails;

