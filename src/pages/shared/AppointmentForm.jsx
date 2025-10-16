import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { X, Calendar, Clock, User, MapPin, Scissors } from 'lucide-react';

const AppointmentForm = ({ 
  appointment, 
  isEditing, 
  onSubmit, 
  onClose, 
  loading,
  branches = [],
  stylists = [],
  clients = []
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    branchId: '',
    stylistId: '',
    serviceIds: [],
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [availableStylists, setAvailableStylists] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        clientId: appointment.clientId || '',
        clientName: appointment.clientName || '',
        branchId: appointment.branchId || '',
        stylistId: appointment.stylistId || '',
        serviceIds: appointment.serviceIds || [],
        appointmentDate: appointment.appointmentDate || '',
        appointmentTime: appointment.appointmentTime || '',
        notes: appointment.notes || ''
      });
    }
  }, [appointment]);

  useEffect(() => {
    // Filter stylists by selected branch
    if (formData.branchId) {
      const branchStylists = stylists.filter(stylist => 
        stylist.branchId === formData.branchId
      );
      setAvailableStylists(branchStylists);
    } else {
      setAvailableStylists(stylists);
    }
  }, [formData.branchId, stylists]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(client => client.id === clientId);
    setFormData(prev => ({
      ...prev,
      clientId: clientId,
      clientName: selectedClient ? selectedClient.name : ''
    }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.branchId) {
      newErrors.branchId = 'Branch is required';
    }
    if (!formData.stylistId) {
      newErrors.stylistId = 'Stylist is required';
    }
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Date is required';
    }
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Time is required';
    }
    if (!formData.serviceIds || formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'At least one service is required';
    }

    // Validate date is in the future
    if (formData.appointmentDate && formData.appointmentTime) {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      const now = new Date();
      if (appointmentDateTime <= now) {
        newErrors.appointmentDate = 'Appointment must be scheduled in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  // Mock services data - in real implementation, this would come from a service
  const mockServices = [
    { id: '1', name: 'Haircut', duration: 30, price: 25 },
    { id: '2', name: 'Hair Color', duration: 60, price: 50 },
    { id: '3', name: 'Hair Styling', duration: 45, price: 35 },
    { id: '4', name: 'Manicure', duration: 30, price: 20 },
    { id: '5', name: 'Pedicure', duration: 45, price: 30 },
    { id: '6', name: 'Facial', duration: 60, price: 40 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Appointment' : 'Create New Appointment'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Client *
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={(e) => handleClientSelect(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clientId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a client</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-red-500 text-sm mt-1">{errors.clientId}</p>
              )}
            </div>

            {/* Branch Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Branch *
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.branchId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>
              )}
            </div>

            {/* Stylist Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Scissors className="w-4 h-4 inline mr-2" />
                Stylist *
              </label>
              <select
                name="stylistId"
                value={formData.stylistId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.stylistId ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!formData.branchId}
              >
                <option value="">Select a stylist</option>
                {availableStylists.map(stylist => (
                  <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                ))}
              </select>
              {errors.stylistId && (
                <p className="text-red-500 text-sm mt-1">{errors.stylistId}</p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date *
                </label>
                <Input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className={errors.appointmentDate ? 'border-red-500' : ''}
                />
                {errors.appointmentDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.appointmentDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time *
                </label>
                <Input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className={errors.appointmentTime ? 'border-red-500' : ''}
                />
                {errors.appointmentTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.appointmentTime}</p>
                )}
              </div>
            </div>

            {/* Services Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mockServices.map(service => (
                  <div
                    key={service.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.serviceIds.includes(service.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => handleServiceToggle(service.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-600">
                          {service.duration} min • ${service.price}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.serviceIds.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors.serviceIds && (
                <p className="text-red-500 text-sm mt-1">{errors.serviceIds}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or notes..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (isEditing ? 'Update Appointment' : 'Create Appointment')}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default AppointmentForm;
