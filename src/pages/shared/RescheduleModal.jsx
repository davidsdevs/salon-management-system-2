import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';

const RescheduleModal = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onReschedule,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (appointment && isOpen) {
      // Set current appointment date and time as default
      setFormData({
        appointmentDate: appointment.appointmentDate || '',
        appointmentTime: appointment.appointmentTime || ''
      });
      setErrors({});
    }
  }, [appointment, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = {};
    
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Date is required';
    }
    
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Time is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for rescheduling is required';
    }

    // Check if date is not in the past
    const selectedDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      newErrors.appointmentDate = 'Cannot schedule appointments in the past';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onReschedule(appointment.id, formData.appointmentDate, formData.appointmentTime, formData.reason);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Reschedule Appointment</h2>
                <p className="text-blue-100 text-sm">Update appointment date and time</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Info */}
            <div className="bg-gradient-to-r from-[#160B53]/5 to-[#2D1B69]/5 border border-[#160B53]/20 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-[#160B53] mr-2" />
                <h3 className="font-semibold text-gray-900">Current Appointment</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Client:</span> {appointment?.clientName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {appointment?.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'} at {appointment?.appointmentTime ? (() => {
                    const time = appointment.appointmentTime;
                    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
                      const [hours, minutes] = time.split(':');
                      const hour = parseInt(hours, 10);
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                      return `${displayHour}:${minutes} ${ampm}`;
                    }
                    return time;
                  })() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-[#160B53] mr-2" />
                <h4 className="font-semibold text-gray-900">New Date & Time</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${
                      errors.appointmentDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min={new Date().toISOString().split('T')[0]}
                    disabled={loading}
                  />
                  {errors.appointmentDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.appointmentDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${
                      errors.appointmentTime ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.appointmentTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.appointmentTime}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Reason for Rescheduling */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-[#160B53] mr-2" />
                <h4 className="font-semibold text-gray-900">Reason for Rescheduling</h4>
              </div>
              <textarea
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Please provide a reason for rescheduling this appointment..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent resize-none ${
                  errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                disabled={loading}
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-[#160B53] text-white rounded-lg font-medium hover:bg-[#0f0844] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rescheduling...
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Reschedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;
    

