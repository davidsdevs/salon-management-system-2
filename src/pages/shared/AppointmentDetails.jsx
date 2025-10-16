import React from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { X, Calendar, Clock, User, MapPin, Scissors, FileText, History } from 'lucide-react';
import { APPOINTMENT_STATUS } from '../../services/appointmentService';

const AppointmentDetails = ({ appointment, onClose, onEdit }) => {
  if (!appointment) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getStatusBadge = (status) => {
    const colors = {
      [APPOINTMENT_STATUS.SCHEDULED]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [APPOINTMENT_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800 border-purple-200',
      [APPOINTMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
      [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusActions = (appointment) => {
    const actions = [];
    const currentStatus = appointment.status;

    if (currentStatus === APPOINTMENT_STATUS.SCHEDULED) {
      actions.push(
        <Button key="confirm" size="sm" className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white">
          Confirm Appointment
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.CONFIRMED) {
      actions.push(
        <Button key="start" size="sm" className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white">
          Start Appointment
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.IN_PROGRESS) {
      actions.push(
        <Button key="complete" size="sm" className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white">
          Complete Appointment
        </Button>
      );
    }

    if ([APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(currentStatus)) {
      actions.push(
        <Button key="cancel" size="sm" variant="outline" className="w-full sm:w-auto px-4 py-2 border-red-500 text-red-500 hover:bg-red-50">
          Cancel Appointment
        </Button>
      );
    }

    return actions;
  };

  // Mock services data - in real implementation, this would come from a service
  const mockServices = {
    '1': { name: 'Haircut', duration: 30, price: 25 },
    '2': { name: 'Hair Color', duration: 60, price: 50 },
    '3': { name: 'Hair Styling', duration: 45, price: 35 },
    '4': { name: 'Manicure', duration: 30, price: 20 },
    '5': { name: 'Pedicure', duration: 45, price: 30 },
    '6': { name: 'Facial', duration: 60, price: 40 }
  };

  const selectedServices = appointment.serviceIds?.map(id => mockServices[id]).filter(Boolean) || [];
  const totalDuration = selectedServices.reduce((total, service) => total + service.duration, 0);
  const totalPrice = selectedServices.reduce((total, service) => total + service.price, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-4 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">Appointment Details</h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                View and manage appointment information
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          <div className="space-y-6 sm:space-y-8">
            {/* Client and Status */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{appointment.clientName}</h3>
                <p className="text-gray-600 text-sm sm:text-base">Appointment #{appointment.id.slice(-8)}</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(appointment.status)}
              </div>
            </div>

            {/* Appointment Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-[#160B53]" />
                  Appointment Date
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base">
                  {formatDate(appointment.appointmentDate)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-[#160B53]" />
                  Appointment Time
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base">
                  {formatTime(appointment.appointmentTime)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4 mr-2 text-[#160B53]" />
                  Client
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base">
                  {appointment.clientName}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Scissors className="w-4 h-4 mr-2 text-[#160B53]" />
                  Stylist
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base">
                  {appointment.stylistName}
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Scissors className="w-4 h-4 mr-2 text-[#160B53]" />
                Services
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {selectedServices.map((service, index) => (
                  <div
                    key={index}
                    className="p-3 sm:p-4 border-2 border-[#160B53] bg-[#160B53]/5 rounded-xl shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{service.name}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {service.duration} min
                          </span>
                          <span className="flex items-center font-medium text-[#160B53]">
                            ${service.price}
                          </span>
                        </div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-[#160B53] bg-[#160B53] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-[#160B53]/10 to-[#2D1B69]/10 rounded-xl border-2 border-[#160B53]/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-700">Total Duration:</span>
                  <span className="font-bold text-[#160B53]">{totalDuration} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total Price:</span>
                  <span className="font-bold text-xl text-[#160B53]">${totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <span className="w-4 h-4 mr-2 text-[#160B53]">📝</span>
                  Additional Notes
                </label>
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-sm sm:text-base">
                  {appointment.notes}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
          <div className="flex flex-col gap-4">
            {/* Status Actions */}
            {getStatusActions(appointment).length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {getStatusActions(appointment)}
              </div>
            )}
            
            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
              >
                Close
              </Button>
              <Button 
                onClick={onEdit}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#160B53] hover:bg-[#160B53]/90 text-white order-1 sm:order-2"
              >
                Edit Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
