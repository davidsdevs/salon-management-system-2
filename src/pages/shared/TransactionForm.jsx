import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { X, Search, Users, Calendar as CalendarIcon, ShoppingCart, Plus, Minus, DollarSign, Percent, CreditCard, Banknote, Gift, CheckCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { userService } from '../../services/userService';
import { serviceService } from '../../services/serviceService';
import { productService } from '../../services/productService';
import { appointmentService } from '../../services/appointmentService';

const TransactionForm = ({ 
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  userData = null
}) => {
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    appointmentId: '',
    items: [],
    subtotal: 0,
    discount: 0,
    discountType: 'amount',
    loyaltyUsed: 0,
    tax: 0,
    total: 0,
    paymentMethod: 'cash',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Client search state
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [realClients, setRealClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  // Appointment search state
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [showAppointmentDropdown, setShowAppointmentDropdown] = useState(false);
  const [realAppointments, setRealAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  
  // Item search state
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [itemSearchType, setItemSearchType] = useState('service');
  const [realServices, setRealServices] = useState([]);
  const [realProducts, setRealProducts] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // New client state
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        clientName: '',
        appointmentId: '',
        items: [],
        subtotal: 0,
        discount: 0,
        discountType: 'amount',
        loyaltyUsed: 0,
        tax: 0,
        total: 0,
        paymentMethod: 'cash',
        notes: ''
      });
      setCurrentStep(1);
      setIsNewClient(false);
      setNewClientData({ name: '', phone: '', email: '' });
      setLoyaltyPoints(0);
    }
  }, [isOpen]);

  // Fetch real data when form opens
  useEffect(() => {
    if (isOpen && userData?.branchId) {
      fetchRealClients();
      fetchRealServices();
      fetchRealProducts();
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
          email: clientData.email || '',
          loyaltyPoints: clientData.loyaltyPoints || 0
        });
      });
      setRealClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchRealServices = async () => {
    try {
      setLoadingItems(true);
      const services = await serviceService.getServicesByBranch(userData.branchId);
      setRealServices(services.map(service => ({
        id: service.id,
        name: service.name,
        price: service.prices?.[0] || 0,
        type: 'service',
        description: service.description,
        category: service.category
      })));
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchRealProducts = async () => {
    try {
      setLoadingItems(true);
      const products = await productService.getProductsByBranch(userData.branchId);
      setRealProducts(products.map(product => ({
        id: product.id,
        name: product.name,
        price: product.price || 0,
        type: 'product',
        stock: product.stock || 0,
        description: product.description,
        category: product.category
      })));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchRealAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const appointments = await appointmentService.searchAppointments(
        appointmentSearchTerm,
        {
          branchId: userData?.branchId,
          status: ['scheduled', 'confirmed', 'in_progress']
        },
        userData?.role || 'receptionist',
        userData?.id
      );
      setRealAppointments(appointments.map(appointment => ({
        id: appointment.id,
        clientName: appointment.clientName,
        clientId: appointment.clientId,
        service: appointment.services?.map(s => s.name).join(', ') || 'Multiple Services',
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        status: appointment.status,
        total: appointment.total || 0
      })));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
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
      clientName: client.name
    }));
    setLoyaltyPoints(client.loyaltyPoints || 0);
    setClientSearchTerm(client.name);
    setShowClientDropdown(false);
  };

  const handleAppointmentSearch = (term) => {
    setAppointmentSearchTerm(term);
    if (term.length > 0) {
      fetchRealAppointments();
      const filtered = realAppointments.filter(appointment =>
        appointment.clientName.toLowerCase().includes(term.toLowerCase()) ||
        appointment.service.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredAppointments(filtered);
      setShowAppointmentDropdown(true);
    } else {
      setFilteredAppointments([]);
      setShowAppointmentDropdown(false);
    }
  };

  const selectAppointment = (appointment) => {
    setFormData(prev => ({
      ...prev,
      appointmentId: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.clientName
    }));
    setAppointmentSearchTerm(`${appointment.clientName} - ${appointment.service}`);
    setShowAppointmentDropdown(false);
  };

  const handleItemSearch = (term) => {
    setItemSearchTerm(term);
    if (term.length > 0) {
      const items = itemSearchType === 'service' ? realServices : realProducts;
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredItems(filtered);
      setShowItemDropdown(true);
    } else {
      setFilteredItems([]);
      setShowItemDropdown(false);
    }
  };

  const addToCart = (item) => {
    const existingItem = formData.items.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { ...item, quantity: 1 }]
      }));
    }
    setShowItemDropdown(false);
    calculateTotals();
  };

  const removeFromCart = (itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    calculateTotals();
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    }));
    calculateTotals();
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = formData.discountType === 'percentage' 
      ? (subtotal * formData.discount) / 100 
      : formData.discount;
    const taxableAmount = subtotal - discountAmount - formData.loyaltyUsed;
    const tax = (taxableAmount * 0.12); // 12% VAT
    const total = taxableAmount + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discount: discountAmount,
      tax,
      total
    }));
  };

  // Recalculate totals when discount or loyalty points change
  useEffect(() => {
    calculateTotals();
  }, [formData.discount, formData.discountType, formData.loyaltyUsed, formData.items]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId && !isNewClient) {
      newErrors.clientId = 'Please select a client or create a new one';
    }
    
    if (isNewClient) {
      if (!newClientData.name.trim()) {
        newErrors.newClientName = 'Client name is required';
      }
      if (!newClientData.phone.trim()) {
        newErrors.newClientPhone = 'Client phone is required';
      }
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (currentStep < 2) {
      if (currentStep === 1) {
        const newErrors = {};
        
        if (!formData.clientId && !isNewClient) {
          newErrors.clientId = 'Please select a client';
        }
        
        if (isNewClient) {
          if (!newClientData.name.trim()) {
            newErrors.newClientName = 'Client name is required';
          }
          if (!newClientData.phone.trim()) {
            newErrors.newClientPhone = 'Phone number is required';
          }
        }
        
        if (formData.items.length === 0) {
          newErrors.items = 'Please add at least one item';
        }

        setErrors(newErrors);
        
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
      setIsSubmitting(true);
      try {
        const transactionData = {
          ...formData,
          clientInfo: isNewClient ? {
            name: newClientData.name,
            phone: newClientData.phone,
            email: newClientData.email,
            isNewClient: true
          } : {
            id: formData.clientId,
            name: formData.clientName,
            isNewClient: false
          }
        };

        await onSubmit(transactionData);
      } finally {
        setIsSubmitting(false);
      }
    } else {
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-4 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">
                Create New Transaction
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                Process a new POS transaction for services and products
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
              {currentStep === 1 ? 'Client & Items' : 'Payment & Confirmation'}
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
            {/* Step 1: Client & Items */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Client Selection */}
                <div className="space-y-6">
                  {/* Client Selection */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                    
                    {formData.clientId ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{formData.clientName}</p>
                          <p className="text-xs text-blue-600">Loyalty Points: {loyaltyPoints}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, clientId: '', clientName: '' }));
                            setLoyaltyPoints(0);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : isNewClient ? (
                      <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-900">New Client</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsNewClient(false);
                              setNewClientData({ name: '', phone: '', email: '' });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <Input
                            placeholder="Client Name *"
                            value={newClientData.name}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, name: e.target.value }))}
                          />
                          <Input
                            placeholder="Phone Number *"
                            value={newClientData.phone}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                          <Input
                            placeholder="Email (Optional)"
                            value={newClientData.email}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (newClientData.name && newClientData.phone) {
                              setFormData(prev => ({
                                ...prev,
                                clientId: 'new_client',
                                clientName: newClientData.name
                              }));
                              setLoyaltyPoints(0);
                            }
                          }}
                          disabled={!newClientData.name || !newClientData.phone}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Add New Client
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={() => setShowClientDropdown(true)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Search Existing Client
                        </Button>
                        
                        <Button
                          onClick={() => setIsNewClient(true)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Add New Client
                        </Button>
                        
                        <Button
                          onClick={() => setShowAppointmentDropdown(true)}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Select from Appointment
                        </Button>
                      </div>
                    )}
                    
                    {errors.clientId && (
                      <p className="text-red-500 text-sm mt-2">{errors.clientId}</p>
                    )}
                    {errors.newClientName && (
                      <p className="text-red-500 text-sm mt-2">{errors.newClientName}</p>
                    )}
                    {errors.newClientPhone && (
                      <p className="text-red-500 text-sm mt-2">{errors.newClientPhone}</p>
                    )}
                  </Card>

                  {/* Items Selection */}
                  <Card className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Items</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setItemSearchType('service');
                            setShowItemDropdown(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Services
                        </Button>
                        <Button
                          onClick={() => {
                            setItemSearchType('product');
                            setShowItemDropdown(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Products
                        </Button>
                      </div>
                    </div>

                    {formData.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No items in cart</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {formData.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">₱{item.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {errors.items && (
                      <p className="text-red-500 text-sm mt-2">{errors.items}</p>
                    )}
                  </Card>
                </div>

                {/* Right Column - Discount, Payment & Summary */}
                <div className="space-y-6">
                  {/* Discount */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Discount</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select
                          value={formData.discountType}
                          onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="amount">Fixed Amount</option>
                          <option value="percentage">Percentage</option>
                        </select>
                      </div>
                      <Input
                        type="number"
                        placeholder={formData.discountType === 'percentage' ? 'Percentage' : 'Amount'}
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </Card>

                  {/* Loyalty Points */}
                  {formData.clientId && (
                    <Card className="p-4">
                      <h3 className="text-lg font-semibold mb-4">Loyalty Points</h3>
                      <div className="space-y-3">
                        {formData.clientId === 'new_client' ? (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-600">New client - No loyalty points available</p>
                            <p className="text-xs text-blue-600 mt-1">Loyalty points will be earned from this transaction</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600">Available: {loyaltyPoints} points</p>
                            <Input
                              type="number"
                              placeholder="Points to use"
                              value={formData.loyaltyUsed}
                              onChange={(e) => setFormData(prev => ({ ...prev, loyaltyUsed: Math.min(parseInt(e.target.value) || 0, loyaltyPoints) }))}
                            />
                          </>
                        )}
                      </div>
                    </Card>
                  )}

                  {/* Payment Method */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                    <div className="space-y-2">
                      {['cash', 'card', 'gift'].map((method) => (
                        <Button
                          key={method}
                          onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                          variant={formData.paymentMethod === method ? 'default' : 'outline'}
                          className="w-full justify-start"
                        >
                          {method === 'cash' && <Banknote className="h-4 w-4 mr-2" />}
                          {method === 'card' && <CreditCard className="h-4 w-4 mr-2" />}
                          {method === 'gift' && <Gift className="h-4 w-4 mr-2" />}
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </Card>

                  {/* Order Summary */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>₱{formData.subtotal.toFixed(2)}</span>
                      </div>
                      {formData.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-₱{formData.discount.toFixed(2)}</span>
                        </div>
                      )}
                      {formData.loyaltyUsed > 0 && (
                        <div className="flex justify-between text-blue-600">
                          <span>Loyalty Points:</span>
                          <span>-₱{formData.loyaltyUsed.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Tax (12%):</span>
                        <span>₱{formData.tax.toFixed(2)}</span>
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

            {/* Step 2: Payment & Confirmation */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Transaction Details</h3>
                  <p className="text-gray-600">Please review all details before processing the transaction.</p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Client & Transaction Info */}
                  <div className="space-y-6">
                    {/* Client Information */}
                    <Card className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Name:</span>
                          <span className="text-gray-900">{formData.clientName}</span>
                        </div>
                        {isNewClient && (
                          <>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                              <span className="font-medium text-gray-700">Phone:</span>
                              <span className="text-gray-900">{newClientData.phone}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="text-gray-900">{newClientData.email}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>

                    {/* Payment Method */}
                    <Card className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h4>
                      <div className="space-y-2">
                        {['cash', 'card', 'gift'].map((method) => (
                          <Button
                            key={method}
                            onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method }))}
                            variant={formData.paymentMethod === method ? 'default' : 'outline'}
                            className="w-full justify-start"
                          >
                            {method === 'cash' && <Banknote className="h-4 w-4 mr-2" />}
                            {method === 'card' && <CreditCard className="h-4 w-4 mr-2" />}
                            {method === 'gift' && <Gift className="h-4 w-4 mr-2" />}
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Items & Totals */}
                  <div className="space-y-6">
                    {/* Items */}
                    <Card className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Items</h4>
                      <div className="space-y-4">
                        {formData.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{item.name}</h5>
                                <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-bold text-[#160B53] text-lg">₱{(item.price * item.quantity).toLocaleString()}</p>
                                <p className="text-sm text-gray-600">₱{item.price.toLocaleString()} each</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {/* Total Summary */}
                        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] rounded-lg p-4 text-white">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg">Total:</span>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ₱{formData.total.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
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
                  Processing...
                </div>
              ) : currentStep === 2 ? (
                'Process Transaction'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Client Search Modal */}
      {showClientDropdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Search Client</h3>
            </div>
            <div className="p-4">
              <Input
                placeholder="Search by name or phone..."
                value={clientSearchTerm}
                onChange={(e) => handleClientSearch(e.target.value)}
              />
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {loadingClients ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                ) : filteredClients.length === 0 && clientSearchTerm.length >= 2 ? (
                  <div className="text-center py-4 text-gray-500">
                    No clients found for "{clientSearchTerm}"
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => selectClient(client)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-gray-600">{client.phone}</p>
                      <p className="text-xs text-blue-600">Loyalty Points: {client.loyaltyPoints || 0}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClientDropdown(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Item Search Modal */}
      {showItemDropdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">
                Add {itemSearchType === 'service' ? 'Services' : 'Products'}
              </h3>
            </div>
            <div className="p-4">
              <Input
                placeholder={`Search ${itemSearchType}s...`}
                value={itemSearchTerm}
                onChange={(e) => handleItemSearch(e.target.value)}
              />
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {loadingItems ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                  </div>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            ₱{item.price.toFixed(2)}
                            {item.stock && ` • Stock: ${item.stock}`}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowItemDropdown(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;
