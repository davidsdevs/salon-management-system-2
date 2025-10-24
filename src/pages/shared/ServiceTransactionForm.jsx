import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  X, 
  Plus, 
  Search, 
  User, 
  Calendar, 
  Clock,
  Scissors,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CreditCard,
  Gift
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { serviceService } from '../../services/serviceService';
import { appointmentService } from '../../services/appointmentService';

const ServiceTransactionForm = ({ isOpen, onClose, onSubmit, loading, userData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    isExistingClient: false,
    appointmentId: '',
    services: [], // { id, name, price, stylistId, stylistName }
    paymentMethod: null,
    subtotal: 0,
    total: 0
  });
  
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingClients, setSearchingClients] = useState(false);
  const [searchingAppointments, setSearchingAppointments] = useState(false);
  const [errors, setErrors] = useState({});
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadServices();
      loadStylists();
      setFormData({
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        isExistingClient: false,
        appointmentId: '',
        services: [],
        paymentMethod: null,
        subtotal: 0,
        total: 0
      });
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen]);

  const loadServices = async () => {
    try {
      if (userData?.branchId) {
        const branchServices = await serviceService.getServicesByBranch(userData.branchId);
        setServices(branchServices.map(service => {
          // Get price for this specific branch
          let servicePrice = 0;
          if (service.prices && service.branches) {
            const branchIndex = service.branches.indexOf(userData.branchId);
            if (branchIndex !== -1 && service.prices[branchIndex] !== undefined) {
              servicePrice = parseFloat(service.prices[branchIndex]);
            } else if (service.prices.length > 0) {
              servicePrice = parseFloat(service.prices[0]); // Fallback to first price
            }
          }
          
          return {
            id: service.id,
            name: service.name,
            price: servicePrice,
            description: service.description,
            category: service.category
          };
        }));
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadStylists = async () => {
    try {
      if (userData?.branchId) {
        const stylistsRef = collection(db, 'users');
        const q = query(stylistsRef, where('roles', 'array-contains', 'stylist'), where('branchId', '==', userData.branchId));
        const querySnapshot = await getDocs(q);
        
        const stylistsList = [];
        querySnapshot.forEach((doc) => {
          const stylistData = doc.data();
          stylistsList.push({
            id: doc.id,
            name: `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || stylistData.name || 'Unknown',
            specialization: stylistData.specialization || 'General',
            isActive: stylistData.isActive !== false
          });
        });
        
        setStylists(stylistsList.filter(stylist => stylist.isActive));
      }
    } catch (error) {
      console.error('Error loading stylists:', error);
    }
  };

  const searchClients = async (term) => {
    if (term.length < 2) {
      setClients([]);
      setSearchingClients(false);
      return;
    }
    
    try {
      setSearchingClients(true);
      const clientsRef = collection(db, 'users');
      const q = query(clientsRef, where('roles', 'array-contains', 'client'));
      const querySnapshot = await getDocs(q);
      
      const allClients = [];
      querySnapshot.forEach((doc) => {
        const clientData = doc.data();
        allClients.push({
          id: doc.id,
          name: `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || clientData.name || 'Unknown',
          phone: clientData.phone || '',
          email: clientData.email || '',
          loyaltyPoints: clientData.loyaltyPoints || 0
        });
      });
      
      const filteredClients = allClients.filter(client => {
        const name = client.name || '';
        const phone = client.phone || '';
        const email = client.email || '';
        
        return (
          name.toLowerCase().includes(term.toLowerCase()) ||
          phone.includes(term) ||
          email.toLowerCase().includes(term.toLowerCase())
        );
      });
      
      setClients(filteredClients);
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setSearchingClients(false);
    }
  };

  const searchAppointments = async (term) => {
    if (term.length < 2) {
      setAppointments([]);
      setSearchingAppointments(false);
      return;
    }
    
    try {
      setSearchingAppointments(true);
      const searchResults = await appointmentService.searchAppointments(
        term,
        {
          branchId: userData?.branchId,
          status: ['scheduled', 'confirmed', 'in_progress']
        },
        userData?.role || 'receptionist',
        userData?.id
      );
      
      setAppointments(searchResults.map(appointment => ({
        id: appointment.id,
        clientName: appointment.clientName,
        clientId: appointment.clientId,
        service: appointment.services?.map(s => s.name).join(', ') || 'Multiple Services',
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        status: appointment.status
      })));
    } catch (error) {
      console.error('Error searching appointments:', error);
    } finally {
      setSearchingAppointments(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'searchTerm') {
      setSearchTerm(value);
      if (value.length >= 2) {
        searchClients(value);
      } else {
        setClients([]);
      }
    }
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email,
      isExistingClient: true
    }));
    setLoyaltyPoints(client.loyaltyPoints || 0);
    setClients([]);
    setSearchTerm('');
  };

  const selectAppointment = (appointment) => {
    setFormData(prev => ({
      ...prev,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.clientName
    }));
    setAppointments([]);
    setSearchTerm('');
  };

  const handleServiceToggle = (service) => {
    const existingService = formData.services.find(s => s.id === service.id);
    
    if (existingService) {
      setFormData(prev => ({
        ...prev,
        services: prev.services.filter(s => s.id !== service.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, { 
          ...service, 
          stylistId: '',
          stylistName: ''
        }]
      }));
    }
  };


  const updateServiceStylist = (serviceId, stylistId, stylistName) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map(s => 
        s.id === serviceId 
          ? { ...s, stylistId, stylistName } 
          : s
      )
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.services.reduce((sum, service) => sum + service.price, 0);
    const total = subtotal; // No tax for services

    setFormData(prev => ({
      ...prev,
      subtotal,
      total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.services]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (formData.services.length === 0) {
      newErrors.services = 'Please select at least one service';
    } else {
      // Validate that each service has a specific stylist assigned
      const servicesWithoutStylist = formData.services.filter(service => !service.stylistId || service.stylistId === '');
      if (servicesWithoutStylist.length > 0) {
        newErrors.services = 'Please assign a specific stylist to each service';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep === 1 && validateForm()) {
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const transactionData = {
        ...formData,
        clientInfo: {
          name: formData.clientName,
          phone: formData.clientPhone,
          email: formData.clientEmail
        },
        items: formData.services,
        transactionType: 'service'
      };
      onSubmit(transactionData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Transaction</h2>
            <p className="text-gray-600">Book and process service transactions</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-[#160B53]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-[#160B53] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Client & Services</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-[#160B53]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-[#160B53]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#160B53] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Client & Services */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Client & Services */}
              <div className="space-y-6">
                {/* Client Selection */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                  
                  {/* Client Information Display */}
                  <div className="space-y-4">
                    {/* Client Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Client Name *</label>
                      <Input
                        placeholder="Enter client name"
                        value={formData.clientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      />
                      {errors.clientName && <p className="text-red-500 text-sm mt-1">{errors.clientName}</p>}
                    </div>

                    {/* Client Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                      <Input
                        placeholder="Enter phone number"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                      />
                    </div>

                    {/* Client Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                      <Input
                        placeholder="Enter email address"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      />
                    </div>

                    {/* Existing Client Info */}
                    {formData.isExistingClient && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          <span className="font-medium">Existing Client:</span> Loyalty Points: {loyaltyPoints}
                        </p>
                      </div>
                    )}

                    {/* Client Search */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search existing clients..."
                          value={searchTerm}
                          onChange={(e) => handleInputChange('searchTerm', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      {searchingClients && (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Searching...</span>
                        </div>
                      )}
                      
                      {clients.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {clients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => selectClient(client)}
                              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                            >
                              <p className="font-medium">{client.name}</p>
                              <p className="text-sm text-gray-600">{client.phone}</p>
                              <p className="text-xs text-blue-600">Loyalty Points: {client.loyaltyPoints || 0}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Services Selection */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Select Services</h3>
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {services.map((service) => {
                      const isSelected = formData.services.some(s => s.id === service.id);
                      const selectedService = formData.services.find(s => s.id === service.id);
                      
                      return (
                        <div key={service.id} className="p-3 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-gray-600">₱{service.price.toFixed(2)}</p>
                              {service.description && (
                                <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleServiceToggle(service)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleServiceToggle(service)}
                                  className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Stylist Selection for Selected Services */}
                          {isSelected && (
                            <div className="border-t pt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Stylist
                              </label>
                              <select
                                value={selectedService.stylistId || ''}
                                onChange={(e) => {
                                  const stylistId = e.target.value;
                                  const stylist = stylists.find(s => s.id === stylistId);
                                  updateServiceStylist(service.id, stylistId, stylist?.name || '');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Stylist</option>
                                {stylists.map((stylist) => (
                                  <option key={stylist.id} value={stylist.id}>
                                    {stylist.name} - {stylist.specialization}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {errors.services && <p className="text-red-500 text-sm mt-2">{errors.services}</p>}
                </Card>
              </div>

              {/* Right Column - Summary */}
              <div className="space-y-6">
                {/* Service Summary */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Service Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₱{formData.subtotal.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₱{formData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Confirmation */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Service Transaction</h3>
                <p className="text-gray-600">Please review all details before processing the transaction.</p>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Client Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {formData.clientName}</p>
                    {formData.clientPhone && (
                      <p><span className="font-medium">Phone:</span> {formData.clientPhone}</p>
                    )}
                    {formData.clientEmail && (
                      <p><span className="font-medium">Email:</span> {formData.clientEmail}</p>
                    )}
                    {formData.isExistingClient && (
                      <p><span className="font-medium">Loyalty Points:</span> {loyaltyPoints}</p>
                    )}
                    {formData.isExistingClient && (
                      <p className="text-sm text-green-600">
                        <span className="font-medium">Status:</span> Existing Client
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Transaction Details</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Transaction Type:</span> Service Invoice</p>
                    <p className="text-sm text-gray-600">Payment will be processed after service completion</p>
                  </div>
                </Card>
              </div>

              {/* Services Summary */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Selected Services</h4>
                <div className="space-y-3">
                  {formData.services.map((service) => (
                    <div key={service.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-gray-600">₱{service.price.toFixed(2)}</p>
                          {service.stylistId && (
                            <p className="text-sm text-blue-600 mt-1">
                              <span className="font-medium">Assigned Stylist:</span> {service.stylistName || 'Unknown Stylist'}
                            </p>
                          )}
                        </div>
                        <p className="font-medium">₱{service.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>₱{formData.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : prevStep}
          >
            {currentStep === 1 ? 'Cancel' : <><ArrowLeft className="h-4 w-4 mr-2" />Back</>}
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 1 && (
              <Button
                onClick={nextStep}
                className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                disabled={loading}
              >
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {currentStep === 2 && (
              <Button
                onClick={handleSubmit}
                className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Process Service Transaction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceTransactionForm;
  