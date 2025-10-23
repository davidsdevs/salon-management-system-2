import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, User, FileText } from 'lucide-react';

const CancelModal = ({ 
  isOpen, 
  onClose, 
  appointment, 
  onCancel,
  loading = false 
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for cancelling this appointment');
      return;
    }

    onCancel(appointment.id, reason);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3" />
              <div>
                <h2 className="text-xl font-bold">Cancel Appointment</h2>
                <p className="text-red-100 text-sm">Permanently cancel this appointment</p>
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
            {/* Appointment Info */}
            <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-red-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Appointment Details</h3>
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

            {/* Reason for Cancellation */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-red-600 mr-2" />
                <h4 className="font-semibold text-gray-900">Reason for Cancellation</h4>
              </div>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Please provide a reason for cancelling this appointment..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                disabled={loading}
              />
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
            </div>

            {/* Warning */}
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Warning:</p>
                  <p>This action cannot be undone. The appointment will be permanently cancelled.</p>
                </div>
              </div>
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
              Keep
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelModal;


