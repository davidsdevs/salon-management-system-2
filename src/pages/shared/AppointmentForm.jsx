import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { X, Calendar, Clock, User, MapPin, Scissors } from 'lucide-react';

const AppointmentForm = ({ 
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
  loading = false,
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

  // Mock data - in real implementation, this would come from services
  const mockServices = [
    { id: '1', name: 'Haircut', duration: 30, price: 25 },
    { id: '2', name: 'Hair Color', duration: 60, price: 50 },
    { id: '3', name: 'Hair Styling', duration: 45, price: 35 },
    { id: '4', name: 'Manicure', duration: 30, price: 20 },
    { id: '5', name: 'Pedicure', duration: 45, price: 30 },
    { id: '6', name: 'Facial', duration: 60, price: 40 }
  ];

  // Default mock data if not provided
  const defaultBranches = [
    { id: '1', name: 'Main Branch - Downtown' },
    { id: '2', name: 'Branch 2 - Uptown' },
    { id: '3', name: 'Branch 3 - Mall' }
  ];

  const defaultStylists = [
    { id: '1', name: 'Sarah Johnson', branchId: '1' },
    { id: '2', name: 'Mike Chen', branchId: '1' },
    { id: '3', name: 'Emma Davis', branchId: '2' },
    { id: '4', name: 'Alex Rodriguez', branchId: '2' },
    { id: '5', name: 'Lisa Wang', branchId: '3' },
    { id: '6', name: 'David Brown', branchId: '3' }
  ];

  const defaultClients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Jane Doe' },
    { id: '3', name: 'Maria Garcia' },
    { id: '4', name: 'Robert Wilson' },
    { id: '5', name: 'Sarah Lee' }
  ];

  // Use provided data or defaults
  const branchesData = branches.length > 0 ? branches : defaultBranches;
  const stylistsData = stylists.length > 0 ? stylists : defaultStylists;
  const clientsData = clients.length > 0 ? clients : defaultClients;

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          clientId: initialData.clientId || '',
          clientName: initialData.clientName || '',
          branchId: initialData.branchId || '',
          stylistId: initialData.stylistId || '',
          serviceIds: initialData.serviceIds || [],
          appointmentDate: initialData.appointmentDate || '',
          appointmentTime: initialData.appointmentTime || '',
          notes: initialData.notes || ''
        });
      } else {
        setFormData({
          clientId: '',
          clientName: '',
          branchId: '',
          stylistId: '',
          serviceIds: [],
          appointmentDate: '',
          appointmentTime: '',
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    // Filter stylists by selected branch
    if (formData.branchId) {
      const branchStylists = stylistsData.filter(stylist => 
        stylist.branchId === formData.branchId
      );
      setAvailableStylists(branchStylists);
    } else {
      setAvailableStylists(stylistsData);
    }
  }, [formData.branchId]); // Removed stylistsData from dependencies to prevent infinite loop

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
    const selectedClient = clientsData.find(client => client.id === clientId);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-4 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">
                {isEditing ? 'Edit Appointment' : 'Create New Appointment'}
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                {isEditing ? 'Update appointment details' : 'Schedule a new appointment for your client'}
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

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Client and Branch Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4 mr-2 text-[#160B53]" />
                  Client *
                </label>
                <div className="relative">
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors text-sm sm:text-base ${
                      errors.clientId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clientsData.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                {errors.clientId && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.clientId}
                  </p>
                )}
              </div>

              {/* Branch Selection */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 text-[#160B53]" />
                  Branch *
                </label>
                <div className="relative">
                  <select
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors text-sm sm:text-base ${
                      errors.branchId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a branch</option>
                    {branchesData.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                {errors.branchId && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.branchId}
                  </p>
                )}
              </div>
            </div>

            {/* Stylist Selection */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Scissors className="w-4 h-4 mr-2 text-[#160B53]" />
                Stylist *
              </label>
              <div className="relative">
                <select
                  name="stylistId"
                  value={formData.stylistId}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors text-sm sm:text-base ${
                    errors.stylistId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  } ${!formData.branchId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!formData.branchId}
                >
                  <option value="">{formData.branchId ? 'Select a stylist' : 'Select a branch first'}</option>
                  {availableStylists.map(stylist => (
                    <option key={stylist.id} value={stylist.id}>{stylist.name}</option>
                  ))}
                </select>
              </div>
              {errors.stylistId && (
                <p className="text-red-500 text-sm flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.stylistId}
                </p>
              )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-[#160B53]" />
                  Appointment Date *
                </label>
                <Input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  className={`px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors text-sm sm:text-base ${
                    errors.appointmentDate ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.appointmentDate && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.appointmentDate}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-[#160B53]" />
                  Appointment Time *
                </label>
                <Input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  className={`px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors text-sm sm:text-base ${
                    errors.appointmentTime ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                />
                {errors.appointmentTime && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.appointmentTime}
                  </p>
                )}
              </div>
            </div>

            {/* Services Selection */}
            <div className="space-y-4">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Scissors className="w-4 h-4 mr-2 text-[#160B53]" />
                Services *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {mockServices.map(service => (
                  <div
                    key={service.id}
                    className={`p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.serviceIds.includes(service.id)
                        ? 'border-[#160B53] bg-[#160B53]/5 shadow-md'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                    onClick={() => handleServiceToggle(service.id)}
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
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        formData.serviceIds.includes(service.id)
                          ? 'border-[#160B53] bg-[#160B53]'
                          : 'border-gray-300'
                      }`}>
                        {formData.serviceIds.includes(service.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {errors.serviceIds && (
                <p className="text-red-500 text-sm flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {errors.serviceIds}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <span className="w-4 h-4 mr-2 text-[#160B53]">📝</span>
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors resize-none text-sm sm:text-base"
                placeholder="Any special requests, allergies, or additional notes for this appointment..."
              />
            </div>
          </form>
        </div>

        {/* Form Actions - Fixed at bottom */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              onClick={handleSubmit}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50 order-1 sm:order-2"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update Appointment' : 'Create Appointment'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
