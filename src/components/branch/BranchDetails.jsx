import React, { useState, useEffect } from 'react';
import { Card } from '../../pages/ui/card';
import { Button } from '../../pages/ui/button';
import { X, Building2, MapPin, Phone, Calendar, Clock, Users, DollarSign } from 'lucide-react';

const BranchDetails = ({ 
  isOpen, 
  onClose, 
  branch, 
  onEdit, 
  onToggleStatus,
  loading = false 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen || !branch) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return 'N/A';
    
    // If already in 12-hour format, return as is
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    const time12 = `${hour12}:${minutes} ${ampm}`;
    
    return time12;
  };

  const formatOperatingHours = (operatingHours) => {
    if (!operatingHours) return 'N/A';
    
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

    return days.map(day => {
      const hours = operatingHours[day];
      if (!hours || !hours.isOpen) {
        return `${dayLabels[day]}: Closed`;
      }
      const openTime = convertTo12Hour(hours.open);
      const closeTime = convertTo12Hour(hours.close);
      return `${dayLabels[day]}: ${openTime} - ${closeTime}`;
    });
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Branch Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Branch Profile Section */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
              <p className="text-gray-600">{branch.address}, {branch.city}</p>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusBadge(branch.isActive)}
              </div>
            </div>
          </div>

          {/* Branch Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{branch.address}, {branch.city}</span>
                </div>
                {branch.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{branch.email}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Branch Information</h4>
              <div className="space-y-3">
                {branch.managerId && (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Manager: {branch.managerId}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">Capacity: {branch.capacity || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    Created: {formatDate(branch.createdAt)}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Operating Hours */}
          <Card className="p-4">
            <h4 className="font-medium text-gray-900 mb-3">Operating Hours</h4>
            <div className="space-y-2">
              {formatOperatingHours(branch.operatingHours).map((schedule, index) => (
                <div key={index} className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{schedule}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Services */}
          {branch.services && branch.services.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Services</h4>
              <div className="flex flex-wrap gap-2">
                {branch.services.map((service, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {service}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Amenities */}
          {branch.amenities && branch.amenities.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {branch.amenities.map((amenity, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {amenity}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={() => onEdit(branch)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              Edit Branch
            </Button>
            <Button
              onClick={() => onToggleStatus(branch.id, branch.isActive)}
              className={branch.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : branch.isActive ? (
                <div className="flex items-center">
                  <X className="h-4 w-4 mr-2" />
                  Deactivate
                </div>
              ) : (
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Activate
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetails;