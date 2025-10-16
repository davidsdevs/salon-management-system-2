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
      [APPOINTMENT_STATUS.SCHEDULED]: 'bg-yellow-100 text-yellow-800',
      [APPOINTMENT_STATUS.CONFIRMED]: 'bg-blue-100 text-blue-800',
      [APPOINTMENT_STATUS.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
      [APPOINTMENT_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
      [APPOINTMENT_STATUS.CANCELLED]: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getStatusActions = (appointment) => {
    const actions = [];
    const currentStatus = appointment.status;

    if (currentStatus === APPOINTMENT_STATUS.SCHEDULED) {
      actions.push(
        <Button key="confirm" size="sm" className="bg-blue-600 hover:bg-blue-700">
          Confirm Appointment
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.CONFIRMED) {
      actions.push(
        <Button key="start" size="sm" className="bg-purple-600 hover:bg-purple-700">
          Start Appointment
        </Button>
      );
    }

    if (currentStatus === APPOINTMENT_STATUS.IN_PROGRESS) {
      actions.push(
        <Button key="complete" size="sm" className="bg-green-600 hover:bg-green-700">
          Complete Appointment
        </Button>
      );
    }

    if ([APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(currentStatus)) {
      actions.push(
        <Button key="cancel" size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Appointment Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status and Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{appointment.clientName}</h3>
                  <p className="text-gray-600">Appointment #{appointment.id.slice(-8)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(appointment.status)}
                </div>
              </div>

              {/* Appointment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{formatDate(appointment.appointmentDate)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">{formatTime(appointment.appointmentTime)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Client</p>
                    <p className="font-medium">{appointment.clientName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Stylist</p>
                    <p className="font-medium">{appointment.stylistName}</p>
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.duration} minutes</p>
                      </div>
                      <p className="font-medium">${service.price}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Duration:</span>
                    <span className="font-medium">{totalDuration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-medium">Total Price:</span>
                    <span className="font-medium text-lg">${totalPrice}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{appointment.notes}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {getStatusActions(appointment)}
                <Button variant="outline" onClick={onEdit}>
                  Edit Appointment
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Appointment Info */}
              <Card className="p-4">
                <h4 className="font-medium text-gray-900 mb-3">Appointment Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>{formatDate(appointment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span>{formatDate(appointment.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created By:</span>
                    <span>{appointment.createdBy}</span>
                  </div>
                </div>
              </Card>

              {/* History */}
              {appointment.history && appointment.history.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    History
                  </h4>
                  <div className="space-y-3">
                    {appointment.history.map((entry, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{entry.action.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-600">{formatDate(entry.timestamp)}</p>
                          {entry.notes && (
                            <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentDetails;
