/**
 * LeaveRequestForm - Component for staff to apply for leave
 * 
 * This component allows staff members to submit leave requests
 * with validation and proper form handling.
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  X,
  User,
  Building
} from 'lucide-react';
import { leaveService } from '../../services/leaveService';
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from '../../models/LeaveRequestModel';

const LeaveRequestForm = ({ 
  isOpen, 
  onClose, 
  employeeId, 
  employeeName, 
  branchId, 
  onSuccess,
  initialData = null,
  selectedDate = null,
  isDirectMode = false // New prop for direct approval mode
}) => {
  const [formData, setFormData] = useState({
    leaveType: LEAVE_TYPES.PERSONAL,
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    isFullDay: true,
    reason: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        leaveType: initialData.leaveType || LEAVE_TYPES.PERSONAL,
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '17:00',
        isFullDay: initialData.isFullDay !== undefined ? initialData.isFullDay : true,
        reason: initialData.reason || '',
        notes: initialData.notes || ''
      });
    } else if (selectedDate) {
      // Pre-fill with selected date from calendar
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        startDate: selectedDateStr,
        endDate: selectedDateStr // Default to same day, user can extend
      }));
    } else {
      // Set default dates (today and tomorrow)
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        startDate: today.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0]
      }));
    }
  }, [initialData, selectedDate]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors when user starts typing
    if (error) setError('');
  };

  // Handle date change with validation
  const handleDateChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // If start date is changed and it's after end date, update end date
      if (field === 'startDate' && value && newData.endDate && value > newData.endDate) {
        newData.endDate = value;
      }
      
      return newData;
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.startDate || !formData.endDate) {
        throw new Error('Please select start and end dates');
      }

      if (!formData.reason.trim()) {
        throw new Error('Please provide a reason for your leave request');
      }

      // Prepare leave request data
      const leaveRequestData = {
        employeeId,
        employeeName,
        branchId,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.isFullDay ? '09:00' : formData.startTime,
        endTime: formData.isFullDay ? '17:00' : formData.endTime,
        isFullDay: formData.isFullDay,
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
        status: isDirectMode ? 'approved' : 'pending',
        createdBy: employeeId,
        // If direct mode, auto-approve
        ...(isDirectMode && {
          approvedBy: employeeId, // In direct mode, the creator is the approver
          approvedByName: employeeName,
          approvedAt: new Date().toISOString()
        })
      };

      // Submit leave request
      const result = await leaveService.createLeaveRequest(leaveRequestData);

      if (result.success) {
        if (isDirectMode) {
          setSuccess('Leave has been added successfully! It will appear in the schedule immediately.');
        } else {
          setSuccess('Leave request submitted successfully! You will be notified once it\'s reviewed.');
        }
        
        // Reset form
        setFormData({
          leaveType: LEAVE_TYPES.PERSONAL,
          startDate: '',
          endDate: '',
          startTime: '09:00',
          endTime: '17:00',
          isFullDay: true,
          reason: '',
          notes: ''
        });

        // Call success callback
        if (onSuccess) {
          onSuccess(result.leaveRequest);
        }

        // Close modal after a delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate duration
  const getDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {initialData ? 'Edit Leave Request' : (isDirectMode ? 'Add Leave' : 'Request Leave')}
              </h2>
              <p className="text-sm text-gray-600">
                {employeeName} • {getDuration()} day{getDuration() !== 1 ? 's' : ''}
                {selectedDate && (
                  <span className="text-blue-600 ml-2">
                    (Selected: {selectedDate.toLocaleDateString()})
                  </span>
                )}
              </p>
              {isDirectMode && (
                <p className="text-xs text-orange-600 mt-1">
                  ⚡ Direct mode: Leave will be added immediately without approval
                </p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Type *
            </label>
            <select
              value={formData.leaveType}
              onChange={(e) => handleInputChange('leaveType', e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {selectedDate && formData.startDate === formData.endDate && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 Tip: Change the end date to extend your leave to multiple days
                </p>
              )}
            </div>
          </div>

          {/* Full Day / Partial Day Toggle */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isFullDay}
                onChange={(e) => handleInputChange('isFullDay', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Full Day Leave</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Uncheck if you only need to be away for part of the day
            </p>
          </div>

          {/* Time Range (for partial day leaves) */}
          {!formData.isFullDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please provide a brief reason for your leave request..."
              rows={3}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information you'd like to share..."
              rows={2}
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Leave Summary</span>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Duration:</strong> {getDuration()} day{getDuration() !== 1 ? 's' : ''}</p>
              <p><strong>Type:</strong> {LEAVE_TYPE_LABELS[formData.leaveType]}</p>
              <p><strong>Schedule:</strong> {formData.isFullDay ? 'Full Day' : `${formData.startTime} - ${formData.endTime}`}</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : (initialData ? 'Update Request' : (isDirectMode ? 'Add Leave' : 'Submit Request'))}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LeaveRequestForm;
