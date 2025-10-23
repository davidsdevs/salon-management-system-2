import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { X, Calendar, Clock, User, MapPin, Scissors, Search } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AppointmentForm = ({ 
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isEditing = false,
  loading = false,
  branches = [],
  stylists = [],
  clients = [],
  userData = null
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    branchId: '',
    serviceStylistPairs: [], // Array of {serviceId, stylistId} objects
    appointmentDate: new Date().toISOString().split('T')[0], // Default to today
    appointmentTime: '',
    notes: '',
    // New client fields
    isNewClient: false,
    newClientName: '',
    newClientPhone: '',
    newClientEmail: ''
  });
  const [errors, setErrors] = useState({});
  const [availableStylists, setAvailableStylists] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);

  // Client search state
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [realClients, setRealClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [realStylists, setRealStylists] = useState([]);
  const [loadingStylists, setLoadingStylists] = useState(false);
  const [realServices, setRealServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const servicesData = realServices;

  // Initialize form data when editing
  useEffect(() => {
    if (isEditing && initialData) {
        setFormData({
        ...initialData,
        serviceStylistPairs: initialData.serviceStylistPairs || []
      });
    } else if (!isEditing) {
      // Reset form for new appointment
        setFormData({
          clientId: '',
          clientName: '',
        branchId: userData?.branchId || '',
        serviceStylistPairs: [],
        appointmentDate: new Date().toISOString().split('T')[0],
          appointmentTime: '',
        notes: '',
        isNewClient: false,
        newClientName: '',
        newClientPhone: '',
        newClientEmail: ''
      });
      setCurrentStep(1);
    }
  }, [isEditing, initialData, userData]);

  // Fetch real clients when form opens
  useEffect(() => {
    if (isOpen && userData?.branchId) {
      fetchRealClients();
      fetchRealStylists(userData.branchId);
      fetchRealServices(userData.branchId);
    }
  }, [isOpen, userData?.branchId]);

  const fetchRealClients = async () => {
    try {
      setLoadingClients(true);
      const clientsRef = collection(db, 'users');
      const q = query(clientsRef, where('roles', 'array-contains', 'client'));
      const querySnapshot = await getDocs(q);
      const clientsList = [];
      querySnapshot.forEach((doc) => {
        const clientData = doc.data();
        clientsList.push({
          id: doc.id,
          name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || clientData.name || 'Unknown',
          phone: clientData.phone || '',
          email: clientData.email || ''
        });
      });
      setRealClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchRealStylists = async (branchId) => {
    if (!branchId) return;
    try {
      setLoadingStylists(true);
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('roles', 'array-contains', 'stylist'),
        where('branchId', '==', branchId)
      );
      const querySnapshot = await getDocs(q);
      const stylistsList = [];
      querySnapshot.forEach((doc) => {
        const stylistData = doc.data();
        stylistsList.push({
          id: doc.id,
          name: `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || stylistData.name || 'Unknown',
          branchId: stylistData.branchId
        });
      });
      setRealStylists(stylistsList);
    } catch (error) {
      console.error('Error fetching stylists:', error);
    } finally {
      setLoadingStylists(false);
    }
  };

  const fetchRealServices = async (branchId) => {
    if (!branchId) return;
    try {
      setLoadingServices(true);
      const servicesRef = collection(db, 'services');
      const q = query(
        servicesRef,
        where('branches', 'array-contains', branchId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const servicesList = [];
      querySnapshot.forEach((doc) => {
        const serviceData = doc.data();
        let price = 0;
        if (serviceData.prices && serviceData.prices.length > 0) {
          const branchIndex = serviceData.branches.indexOf(branchId);
          if (branchIndex !== -1 && serviceData.prices[branchIndex] !== undefined) {
            price = parseFloat(serviceData.prices[branchIndex]);
    } else {
            price = parseFloat(serviceData.prices[0]);
          }
        }
        servicesList.push({
          id: serviceData.id || doc.id,
          name: serviceData.name,
          duration: serviceData.duration || 30,
          price: price,
          category: serviceData.category || 'General',
          description: serviceData.description || '',
          isActive: serviceData.isActive !== false,
          isChemical: serviceData.isChemical || false,
          imageURL: serviceData.imageURL || ''
        });
      });
      setRealServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      setRealServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleClientSearch = (term) => {
    setClientSearchTerm(term);
    if (term.length > 0) {
      const filtered = realClients.filter(client =>
        client.name.toLowerCase().includes(term.toLowerCase()) ||
        client.phone.includes(term)
      );
      setFilteredClients(filtered);
      setShowClientDropdown(true);
    } else {
      setFilteredClients([]);
      setShowClientDropdown(false);
    }
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      isNewClient: false
    }));
    setClientSearchTerm(client.name);
    setShowClientDropdown(false);
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const existingPair = prev.serviceStylistPairs.find(pair => pair.serviceId === serviceId);
      
      if (existingPair) {
        // Remove service
        return {
          ...prev,
          serviceStylistPairs: prev.serviceStylistPairs.filter(pair => pair.serviceId !== serviceId)
        };
      } else {
        // Add service
        return {
          ...prev,
          serviceStylistPairs: [...(prev.serviceStylistPairs || []), { serviceId, stylistId: '' }]
        };
      }
    });
  };

  const handleServiceStylistChange = (serviceId, stylistId) => {
    setFormData(prev => ({
      ...prev,
      serviceStylistPairs: prev.serviceStylistPairs.map(pair =>
        pair.serviceId === serviceId ? { ...pair, stylistId } : pair
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.isNewClient && !formData.clientId) {
      newErrors.clientId = 'Please select a client or create a new one';
    }
    
    if (formData.isNewClient) {
      if (!formData.newClientName.trim()) {
        newErrors.newClientName = 'Client name is required';
      }
      if (!formData.newClientPhone.trim()) {
        newErrors.newClientPhone = 'Client phone is required';
      }
    }
    
    if (!formData.branchId) {
      newErrors.branchId = 'Please select a branch';
    }
    
    if (formData.serviceStylistPairs.length === 0) {
      newErrors.services = 'Please select at least one service';
    }
    
    // Check if all selected services have assigned stylists
    const unassignedServices = formData.serviceStylistPairs.filter(pair => !pair.stylistId);
    if (unassignedServices.length > 0) {
      newErrors.stylists = 'Please assign a stylist to each selected service';
    }
    
    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Please select an appointment date';
    }
    
    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Please select an appointment time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step navigation functions
  const nextStep = () => {
    if (currentStep < 2) {
      // Validate current step before proceeding
      if (currentStep === 1) {
        const newErrors = {};
        
        // Client validation
        if (!formData.isNewClient && !formData.clientId) {
          newErrors.clientId = 'Please select a client';
        }
        
        if (formData.isNewClient) {
          if (!formData.newClientName.trim()) {
            newErrors.newClientName = 'Client name is required';
          }
          if (!formData.newClientPhone.trim()) {
            newErrors.newClientPhone = 'Phone number is required';
          }
        }
        
        // Date and time validation
        if (!formData.appointmentDate) {
          newErrors.appointmentDate = 'Appointment date is required';
        }
        if (!formData.appointmentTime) {
          newErrors.appointmentTime = 'Appointment time is required';
        }
        
        // Services validation
        if (formData.serviceStylistPairs.length === 0) {
          newErrors.services = 'Please select at least one service';
        }
        
        // Stylist assignment validation
        const unassignedServices = formData.serviceStylistPairs.filter(pair => !pair.stylistId);
        if (unassignedServices.length > 0) {
          newErrors.stylists = 'Please assign a stylist for each selected service';
    }

    setErrors(newErrors);
        
        // If there are errors, don't proceed to next step
        if (Object.keys(newErrors).length > 0) {
          return;
        }
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSubmit = async () => {
    if (currentStep === 2) {
      // Final submission - no validation needed since step 1 was already validated
      setIsSubmitting(true);
      try {
        const appointmentData = {
          ...formData,
          // Include client information based on type
          clientInfo: formData.isNewClient ? {
            name: formData.newClientName,
            phone: formData.newClientPhone,
            email: formData.newClientEmail,
            isNewClient: true
          } : {
            id: formData.clientId,
            name: formData.clientName,
            isNewClient: false
          }
        };

        await onSubmit(appointmentData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Move to next step (validation happens in nextStep function)
      nextStep();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleStepSubmit();
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

        {/* Progress Bar */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of 2
            </span>
            <span className="text-sm text-gray-500">
              {currentStep === 1 ? 'Client & Schedule & Services' : 'Confirmation'}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#160B53] h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Step 1: Client & Schedule & Services */}
            {currentStep === 1 && (
              <div className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <User className="w-4 h-4 mr-2 text-[#160B53]" />
                  Client *
                </label>
                    
                  {/* Client Type Toggle */}
                  <div className="flex space-x-4 mb-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clientType"
                        value="existing"
                        checked={!formData.isNewClient}
                        onChange={() => setFormData(prev => ({ ...prev, isNewClient: false }))}
                        className="mr-2"
                      />
                      Existing Client
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="clientType"
                        value="new"
                        checked={formData.isNewClient}
                        onChange={() => setFormData(prev => ({ ...prev, isNewClient: true }))}
                        className="mr-2"
                      />
                      New Client
                    </label>
                  </div>

                  {!formData.isNewClient ? (
                <div className="relative">
                <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Search clients..."
                          value={clientSearchTerm}
                          onChange={(e) => handleClientSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {showClientDropdown && filteredClients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => selectClient(client)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-gray-500">{client.phone}</div>
                            </div>
                          ))}
                </div>
                      )}
                      {formData.clientName && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <span className="text-green-800 font-medium">Selected: {formData.clientName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Input
                        type="text"
                        name="newClientName"
                        placeholder="Client Name *"
                        value={formData.newClientName}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                      <Input
                        type="tel"
                        name="newClientPhone"
                        placeholder="Phone Number *"
                        value={formData.newClientPhone}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                      <Input
                        type="email"
                        name="newClientEmail"
                        placeholder="Email (Optional)"
                        value={formData.newClientEmail}
                        onChange={handleInputChange}
                        className="w-full"
                      />
                </div>
                  )}
                  
                {errors.clientId && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                    {errors.clientId}
                  </p>
                )}
                  {errors.newClientName && (
                  <p className="text-red-500 text-sm flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.newClientName}
                  </p>
                )}
                  {errors.newClientPhone && (
                <p className="text-red-500 text-sm flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.newClientPhone}
                </p>
              )}
            </div>

                {/* Date and Time Selection */}
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
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full"
                      required
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
                      className="w-full"
                      required
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
                  <div>
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <Scissors className="w-4 h-4 mr-2 text-[#160B53]" />
                Services *
              </label>
                    <p className="text-xs text-gray-500 mt-1">Select the services you need. You can choose multiple services.</p>
                  </div>
                  {loadingServices ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
                      <span className="ml-2">Loading services...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {servicesData.length === 0 ? (
                        <div className="col-span-full text-center py-8">
                          <p className="text-gray-500">No services available for this branch.</p>
                        </div>
                      ) : (
                        servicesData.map((service) => (
                  <div
                    key={service.id}
                          onClick={() => handleServiceToggle(service.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.serviceStylistPairs.some(pair => pair.serviceId === service.id)
                              ? 'border-[#160B53] bg-[#160B53]/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{service.name}</h3>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              formData.serviceStylistPairs.some(pair => pair.serviceId === service.id)
                          ? 'border-[#160B53] bg-[#160B53]'
                          : 'border-gray-300'
                      }`}>
                              {formData.serviceStylistPairs.some(pair => pair.serviceId === service.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                          <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">{service.duration} min</span>
                            <span className="font-semibold text-[#160B53]">₱{service.price.toLocaleString()}</span>
                    </div>
                  </div>
                        ))
                      )}
              </div>
                  )}
                  
                  {errors.services && (
                <p className="text-red-500 text-sm flex items-center">
                  <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.services}
                </p>
              )}
            </div>

                {/* Stylist Assignment Error */}
                {errors.stylists && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-500 text-sm flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                      {errors.stylists}
                    </p>
            </div>
                )}

                {/* Stylist Assignment for each service */}
                {formData.serviceStylistPairs.length > 0 && (
                  <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assign Stylists</h3>
                        <p className="text-sm text-gray-600">Assign a specific stylist or choose "Any Available Stylist" if the client has no preference.</p>
                      </div>
                    {formData.serviceStylistPairs.map((servicePair, index) => {
                      const service = servicesData.find(s => s.id === servicePair.serviceId);
                      return service ? (
                        <div key={index} className="p-4 border-2 border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{service.name}</h4>
                              <p className="text-sm text-gray-600">₱{service.price.toLocaleString()} • {service.duration} min</p>
                            </div>
                          </div>
            <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Assign Stylist *
              </label>
                <select
                              value={servicePair.stylistId || ''}
                              onChange={(e) => handleServiceStylistChange(servicePair.serviceId, e.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-colors"
                              required
                            >
                              <option value="">Select a stylist...</option>
                              <option value="any_available">🎯 Any Available Stylist</option>
                              {realStylists.map((stylist) => (
                                <option key={stylist.id} value={stylist.id}>
                                  {stylist.name}
                                </option>
                  ))}
                </select>
              </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

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
              </div>
            )}

            {/* Step 2: Confirmation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Appointment Details</h3>
                  <p className="text-gray-600">Please review all details before creating the appointment.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Client & Appointment Info */}
                  <div className="space-y-6">
                    {/* Client Information */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <User className="w-5 h-5 text-[#160B53] mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Client Information</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900">{formData.isNewClient ? formData.newClientName : formData.clientName}</span>
                        </div>
                        {formData.isNewClient && (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-900">{formData.newClientPhone}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="text-gray-900">{formData.newClientEmail}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <Calendar className="w-5 h-5 text-[#160B53] mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Appointment Details</h4>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Date:</span>
                          <span className="text-gray-900">{new Date(formData.appointmentDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Time:</span>
                          <span className="text-gray-900">
                            {formData.appointmentTime ? (() => {
                              const [hours, minutes] = formData.appointmentTime.split(':');
                              const hour = parseInt(hours, 10);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                              return `${displayHour}:${minutes} ${ampm}`;
                            })() : 'Not set'}
                          </span>
                        </div>
                        {formData.notes && (
                          <div className="pt-2">
                            <span className="font-medium text-gray-700 block mb-1">Notes:</span>
                            <span className="text-gray-900 text-sm bg-gray-50 p-2 rounded block">{formData.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Services & Stylists */}
                  <div className="space-y-6">
                    {/* Services and Stylists */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-center mb-4">
                        <Scissors className="w-5 h-5 text-[#160B53] mr-2" />
                        <h4 className="text-lg font-semibold text-gray-900">Services & Stylists</h4>
                      </div>
                      <div className="space-y-4">
                        {formData.serviceStylistPairs.map((servicePair, index) => {
                          const service = servicesData.find(s => s.id === servicePair.serviceId);
                          const stylist = realStylists.find(s => s.id === servicePair.stylistId);
                          return service ? (
                            <div key={index} className="bg-gradient-to-r from-[#160B53]/5 to-[#2D1B69]/5 border border-[#160B53]/20 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-1">{service.name}</h5>
                                  <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Scissors className="w-4 h-4 mr-1" />
                                    <span>Stylist: {servicePair.stylistId === 'any_available' ? 'Any Available Stylist' : (stylist?.name || 'Not assigned')}</span>
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-bold text-[#160B53] text-lg">₱{service.price.toLocaleString()}</p>
                                  <p className="text-sm text-gray-600">{service.duration} min</p>
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                        
                        {/* Total Summary */}
                        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] rounded-lg p-4 text-white">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg">Total:</span>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ₱{formData.serviceStylistPairs.reduce((total, servicePair) => {
                                  const service = servicesData.find(s => s.id === servicePair.serviceId);
                                  return total + (service?.price || 0);
                                }, 0).toLocaleString()}
                              </div>
                              <div className="text-sm opacity-90">
                                {formData.serviceStylistPairs.reduce((total, servicePair) => {
                                  const service = servicesData.find(s => s.id === servicePair.serviceId);
                                  return total + (service?.duration || 0);
                                }, 0)} minutes total
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Form Actions - Fixed at bottom */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={prevStep}
                  className="px-4 sm:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Button>
              )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
                className="px-4 sm:px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            </div>
            <Button 
              type="submit" 
              disabled={loading || isSubmitting}
              onClick={handleSubmit}
              className="px-4 sm:px-6 py-2 bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50"
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : currentStep === 2 ? (
                isEditing ? 'Update Appointment' : 'Create Appointment'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentForm;
