import React, { useEffect, useState } from 'react';
import { Button } from '../../pages/ui/button';
import { Card } from '../../pages/ui/card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { promotionService } from '../../services/promotionService';
import { 
  Scissors,
  Package,
  X,
  Search,
  Banknote,
  CreditCard,
  Smartphone,
  User,
  Tag,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SalonTransactionForm = ({ isOpen, onClose, onSubmit, userData, showSuccess, showError, mode = 'create', existingTransaction = null }) => {
  const [formData, setFormData] = useState({
    transactionId: '',
    clientId: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    transactionType: 'service',
    services: [],
    products: [],
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    notes: '',
    paymentMethod: '',
    amountReceived: 0,
    promotionCode: '',
    appliedPromotion: null
  });
  const [availableServices, setAvailableServices] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [availableStylists, setAvailableStylists] = useState([]);
  const [availableClients, setAvailableClients] = useState([]);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [promotionError, setPromotionError] = useState('');
  const [validatingPromotion, setValidatingPromotion] = useState(false);
  const [activePromotions, setActivePromotions] = useState([]);
  const [loadingPromotions, setLoadingPromotions] = useState(false);

  // Trigger animation when modal opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  // Handle close with animation
  const handleClose = () => {
    setIsAnimating(false);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Load active promotions
  const loadActivePromotions = async () => {
    if (!userData?.branchId) return;
    
    try {
      setLoadingPromotions(true);
      const clientId = formData.clientId || null;
      const promotions = await promotionService.getActivePromotions(userData.branchId, clientId);
      setActivePromotions(promotions);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoadingPromotions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadActivePromotions();
      
      if ((mode === 'payment' || mode === 'edit') && existingTransaction) {
        // Load existing transaction data for payment processing
        // Normalize service and product data to ensure 'name' field exists
        const normalizedServices = (existingTransaction.services || []).map(service => ({
          ...service,
          name: service.name || service.serviceName,
          id: service.id || service.serviceId
        }));
        
        const normalizedProducts = (existingTransaction.products || []).map(product => ({
          ...product,
          name: product.name || product.productName,
          id: product.id || product.productId
        }));
        
        setFormData({
          transactionId: existingTransaction.transactionId || existingTransaction.id?.slice(-8) || '',
          clientId: existingTransaction.clientId || '',
          clientName: existingTransaction.clientInfo?.name || '',
          clientPhone: existingTransaction.clientInfo?.phone || '',
          clientEmail: existingTransaction.clientInfo?.email || '',
          transactionType: existingTransaction.transactionType || 'service',
          services: normalizedServices,
          products: normalizedProducts,
          subtotal: existingTransaction.subtotal || 0,
          discount: existingTransaction.discount || 0,
          tax: existingTransaction.tax || 0,
          total: existingTransaction.total || 0,
          notes: existingTransaction.notes || '',
          paymentMethod: '',
          amountReceived: existingTransaction.total || 0,
          appliedPromotion: existingTransaction.appliedPromotion || null
        });
      } else {
        // Creating new invoice
        const generateTransactionId = () => {
          const now = new Date();
          const timestamp = now.getTime().toString().slice(-6);
          const random = Math.random().toString(36).substr(2, 3).toUpperCase();
          return `TXN-${timestamp}-${random}`;
        };

        setFormData(prev => ({
          ...prev,
          transactionId: generateTransactionId()
        }));
      }

      loadData();
    }
  }, [isOpen, mode, existingTransaction]);

  const loadData = async () => {
    try {
      await fetchRealServices();
      await fetchRealStylists();
      await fetchRealClients();

      setAvailableProducts([
        { id: '1', name: 'Shampoo', price: 200, stock: 50 },
        { id: '2', name: 'Conditioner', price: 250, stock: 30 },
        { id: '3', name: 'Hair Oil', price: 300, stock: 25 },
        { id: '4', name: 'Styling Gel', price: 180, stock: 40 }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const fetchRealServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(
        servicesRef,
        where('branches', 'array-contains', userData?.branchId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const servicesList = [];

      querySnapshot.forEach((doc) => {
        const serviceData = doc.data();
        let price = 0;

        if (serviceData.prices && serviceData.prices.length > 0) {
          const branchIndex = serviceData.branches.indexOf(userData.branchId);
          if (branchIndex !== -1 && serviceData.prices[branchIndex] !== undefined) {
            price = parseFloat(serviceData.prices[branchIndex]);
          } else {
            price = parseFloat(serviceData.prices[0]);
          }
        } else if (serviceData.price) {
          price = parseFloat(serviceData.price);
        }

        servicesList.push({
          id: doc.id,
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

      setAvailableServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
      setAvailableServices([]);
    }
  };

  const fetchRealStylists = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('roles', 'array-contains', 'stylist'),
        where('branchId', '==', userData?.branchId),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      const stylistsList = [];

      querySnapshot.forEach((doc) => {
        const stylistData = doc.data();
        stylistsList.push({
          id: doc.id,
          name: `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim() || stylistData.name || 'Unknown',
          branchId: stylistData.branchId,
          specialization: stylistData.specialization || 'General',
          serviceIds: stylistData.service_id || []
        });
      });

      setAvailableStylists(stylistsList);
    } catch (error) {
      console.error('Error fetching stylists:', error);
      setAvailableStylists([]);
    }
  };

  const fetchRealClients = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('roles', 'array-contains', 'client'));
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

      setAvailableClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setAvailableClients([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addService = (service) => {
    const newService = {
      ...service,
      stylistId: '',
      stylistName: '',
      clientType: 'X',
      adjustedPrice: service.price,
      priceAdjustment: 0,
      adjustmentReason: ''
    };
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, newService]
    }));
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateServiceStylist = (index, stylistId, stylistName) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, stylistId, stylistName } : service
      )
    }));
  };

  const updateServiceClientType = (index, clientType) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, clientType } : service
      )
    }));
  };

  const updateServicePriceAdjustment = (index, adjustment, reason = '') => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { 
          ...service, 
          priceAdjustment: adjustment,
          adjustmentReason: reason,
          adjustedPrice: service.price + adjustment
        } : service
      )
    }));
  };

  const addProduct = (product, quantity = 1) => {
    const existingProductIndex = formData.products.findIndex(p => p.id === product.id);
    if (existingProductIndex >= 0) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.map((p, i) => 
          i === existingProductIndex ? { ...p, quantity: p.quantity + quantity } : p
        )
      }));
    } else {
      const newProduct = {
        ...product,
        quantity
      };
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, newProduct]
      }));
    }
  };

  const updateProductQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeProduct(index);
      return;
    }
    setFormData(prev => ({
      ...prev,
      products: prev.products.map((product, i) => 
        i === index ? { ...product, quantity } : product
      )
    }));
  };

  const removeProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
  };

  const handleClientSearch = (term) => {
    setClientSearchTerm(term);
    setShowClientSearch(term.length > 0);

    setFormData(prev => ({
      ...prev,
      clientName: term
    }));
  };

  const selectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone,
      clientEmail: client.email
    }));
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const useAsWalkIn = () => {
    setFormData(prev => ({
      ...prev,
      clientId: '',
      clientName: clientSearchTerm
    }));
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const clearClient = () => {
    setFormData(prev => ({
      ...prev,
      clientId: '',
      clientName: '',
      clientPhone: '',
      clientEmail: ''
    }));
    setClientSearchTerm('');
    setShowClientSearch(false);
  };

  const filteredClients = availableClients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.phone.includes(clientSearchTerm) ||
    client.email.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const exactMatch = filteredClients.find(client => 
    client.name.toLowerCase() === clientSearchTerm.toLowerCase()
  );

  // Apply selected promotion
  const handleApplyPromotion = async (promotionId) => {
    if (!promotionId) {
      setPromotionError('Please select a promotion');
      return;
    }

    if (!userData?.branchId) {
      setPromotionError('Branch ID not found');
      return;
    }

    try {
      setValidatingPromotion(true);
      setPromotionError('');

      const promotion = activePromotions.find(p => p.id === promotionId);
      if (!promotion) {
        setPromotionError('Promotion not found');
        return;
      }

      // Validate promotion (check dates, usage, etc.)
      const clientId = formData.clientId || null;
      const validation = await promotionService.validatePromotionCode(
        promotion.promotionCode,
        userData.branchId,
        clientId
      );

      if (!validation.success) {
        setPromotionError(validation.error);
        setFormData(prev => ({
          ...prev,
          appliedPromotion: null,
          discount: 0
        }));
        // Reload promotions to update list
        await loadActivePromotions();
        return;
      }

      // Calculate subtotal for discount calculation
      let subtotal = 0;
      formData.services.forEach(service => {
        subtotal += service.adjustedPrice || service.price || 0;
      });
      formData.products.forEach(product => {
        subtotal += (product.price || 0) * (product.quantity || 0);
      });

      // Calculate promotion discount
      const discountDetails = promotionService.calculatePromotionDiscount(
        promotion,
        subtotal,
        formData.services,
        formData.products
      );

      // Update form with promotion discount
      const discountPercentage = discountDetails.discountType === 'percentage' 
        ? discountDetails.discountValue 
        : (discountDetails.discountAmount / subtotal) * 100;

      setFormData(prev => ({
        ...prev,
        appliedPromotion: {
          id: promotion.id,
          code: promotion.promotionCode,
          title: promotion.title,
          discountAmount: discountDetails.discountAmount,
          discountType: discountDetails.discountType,
          discountValue: discountDetails.discountValue
        },
        discount: discountPercentage
      }));

      setPromotionError('');
    } catch (error) {
      console.error('Error applying promotion:', error);
      setPromotionError('Failed to apply promotion');
    } finally {
      setValidatingPromotion(false);
    }
  };

  // Remove promotion
  const handleRemovePromotion = () => {
    setFormData(prev => ({
      ...prev,
      appliedPromotion: null,
      discount: 0
    }));
    setPromotionError('');
    // Reload promotions to refresh list
    loadActivePromotions();
  };

  // Reload promotions when client changes
  useEffect(() => {
    if (isOpen && formData.clientId) {
      loadActivePromotions();
    }
  }, [formData.clientId, isOpen]);

  const calculateTotal = () => {
    let subtotal = 0;

    formData.services.forEach(service => {
      subtotal += service.adjustedPrice || service.price || 0;
    });

    formData.products.forEach(product => {
      subtotal += (product.price || 0) * (product.quantity || 0);
    });

    // Calculate discount
    let discountAmount = 0;
    if (formData.appliedPromotion) {
      // Use promotion discount amount directly
      discountAmount = formData.appliedPromotion.discountAmount;
    } else {
      // Use percentage discount
      const discountPercentage = formData.discount || 0;
      discountAmount = (subtotal * discountPercentage) / 100;
    }

    const tax = formData.tax || 0;
    const total = subtotal - discountAmount + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      total: Math.max(0, total)
    }));
  };

  useEffect(() => {
    calculateTotal();
  }, [formData.services, formData.products, formData.discount, formData.tax, formData.appliedPromotion]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (mode === 'payment') {
        // Payment mode validations
        if (!formData.paymentMethod) {
          showError('Please select a payment method');
          return;
        }

        if (formData.paymentMethod === 'cash' && formData.amountReceived < formData.total) {
          showError('Amount received must be at least equal to the total amount');
          return;
        }
      } else {
        // Create mode validations
        if (formData.services.length > 0 && !formData.clientName.trim()) {
          showError('Client name is required for service transactions');
          return;
        }

        if (formData.services.length === 0 && formData.products.length === 0) {
          showError('Please add at least one service or product');
          return;
        }
      }

      await onSubmit(formData);
      setFormData(prev => ({
        ...prev,
        transactionId: '',
        clientId: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        transactionType: 'service',
        services: [],
        products: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        notes: '',
        appliedPromotion: null
      }));
      setPromotionError('');
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-3 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white w-full h-full rounded-lg shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-4 sm:px-6 py-3 sm:py-4 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold">
                {mode === 'payment' ? 'Process Payment' : mode === 'edit' ? 'Edit Invoice' : 'Salon POS Terminal'}
              </h2>
              <p className="text-blue-100 mt-1 text-sm sm:text-base">
                {mode === 'payment' ? 'Complete payment for pending invoice' : 
                 mode === 'edit' ? 'Update invoice items and pricing' : 
                 'Point of Sale System'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 flex flex-col">
            <div className="bg-gray-50 p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                {formData.clientId && mode === 'create' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearClient}
                    className="text-xs"
                  >
                    Clear Client
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name {formData.services.length > 0 && '*'}
                    {formData.services.length === 0 && formData.products.length > 0 && (
                      <span className="text-xs text-gray-500 ml-1">(Optional for products)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => {
                        handleInputChange('clientName', e.target.value);
                        handleClientSearch(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                      placeholder="Search or enter client name"
                      required={formData.services.length > 0}
                      readOnly={mode === 'payment' || mode === 'edit'}
                      disabled={mode === 'payment' || mode === 'edit'}
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  
                  {showClientSearch && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {exactMatch && (
                        <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200">
                          <div className="text-xs text-yellow-700 font-medium">
                            ⚠️ Exact match found: "{exactMatch.name}"
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            Click to select existing client, or continue typing for walk-in
                          </div>
                        </div>
                      )}
                      
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => selectClient(client)}
                          className={`px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            exactMatch && client.id === exactMatch.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.phone}</div>
                          <div className="text-xs text-gray-500">{client.email}</div>
                          {exactMatch && client.id === exactMatch.id && (
                            <div className="text-xs text-blue-600 font-medium">← Exact match</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {showClientSearch && filteredClients.length === 0 && clientSearchTerm.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="p-3 border-b border-gray-100">
                        <div className="text-sm text-gray-500 text-center">
                          No existing clients found for "{clientSearchTerm}"
                        </div>
                      </div>
                      <div 
                        onClick={useAsWalkIn}
                        className="p-3 hover:bg-gray-50 cursor-pointer text-center"
                      >
                        <div className="text-sm font-medium text-blue-600">
                          Use as Walk-in Customer
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Continue with "{clientSearchTerm}" as new customer
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              {formData.clientName && (
                <div className={`mt-3 p-2 border rounded-md ${
                  formData.clientId 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    <User className={`h-4 w-4 ${
                      formData.clientId ? 'text-blue-600' : 'text-yellow-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      formData.clientId ? 'text-blue-900' : 'text-yellow-900'
                    }`}>
                      {formData.clientId ? 'Existing Client' : 'Walk-in Customer'}: {formData.clientName}
                    </span>
                    {formData.clientPhone && (
                      <span className={`text-xs ${
                        formData.clientId ? 'text-blue-600' : 'text-yellow-600'
                      }`}>
                        ({formData.clientPhone})
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Services & Products</h3>
                <div className="flex space-x-2">
                  <Button
                    variant={formData.transactionType === 'service' ? 'default' : 'outline'}
                    onClick={() => handleInputChange('transactionType', 'service')}
                    className={formData.transactionType === 'service' ? 'bg-[#160B53] text-white' : ''}
                  >
                    <Scissors className="h-4 w-4 mr-2" />
                    Services
                    </Button>
                    <Button
                      variant={formData.transactionType === 'product' ? 'default' : 'outline'}
                      onClick={() => handleInputChange('transactionType', 'product')}
                      className={formData.transactionType === 'product' ? 'bg-[#160B53] text-white' : ''}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Products
                    </Button>
                  </div>
                </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 flex-1 overflow-y-auto">
                {formData.transactionType === 'service' ? (
                  availableServices.map(service => (
                    <button
                      key={service.id}
                      onClick={() => addService(service)}
                      className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-[#160B53] hover:bg-[#160B53]/5 transition-all duration-200 text-left h-28"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm mb-1 leading-tight break-words">{service.name}</h5>
                          <p className="text-sm font-bold text-[#160B53]">₱{service.price}</p>
                          <p className="text-xs text-gray-500">{service.duration}m</p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  availableProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="p-3 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left h-28"
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-sm mb-1 leading-tight break-words">{product.name}</h5>
                          <p className="text-sm font-bold text-green-600">₱{product.price}</p>
                          <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-96 bg-gray-50 border-l flex flex-col">
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Current Sale</h4>
                <div className="text-xs text-gray-500">
                  Transaction #: {formData.transactionId || 'Pending'}
                </div>
              </div>
              
              <div className="space-y-2 flex-1 overflow-y-auto">
                {formData.services.map((service, index) => (
                  <div key={`service-${index}`} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Scissors className="h-3 w-3 text-blue-600" />
                          <h5 className="font-medium text-gray-900 text-sm">{service.name}</h5>
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className={service.priceAdjustment !== 0 ? 'line-through text-gray-400' : ''}>
                            ₱{service.price}
                          </span>
                          {service.priceAdjustment !== 0 && (
                            <span className="ml-2 font-semibold text-green-600">
                              ₱{service.adjustedPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeService(index)}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <select
                      value={service.stylistId}
                      onChange={(e) => {
                        const stylist = availableStylists.find(s => s.id === e.target.value);
                        updateServiceStylist(index, e.target.value, stylist?.name || '');
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent mb-2"
                    >
                      <option value="">Select Stylist</option>
                      {availableStylists.map(stylist => (
                        <option key={stylist.id} value={stylist.id}>
                          {stylist.name}
                        </option>
                      ))}
                    </select>
                    
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">Client Type:</label>
                      <div className="flex space-x-2">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`clientType-${index}`}
                            value="X"
                            checked={service.clientType === 'X'}
                            onChange={(e) => updateServiceClientType(index, e.target.value)}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs text-gray-700">X-New</span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`clientType-${index}`}
                            value="R"
                            checked={service.clientType === 'R'}
                            onChange={(e) => updateServiceClientType(index, e.target.value)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">R-Regular</span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="radio"
                            name={`clientType-${index}`}
                            value="TR"
                            checked={service.clientType === 'TR'}
                            onChange={(e) => updateServiceClientType(index, e.target.value)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-xs text-gray-700">TR-Transfer</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 mt-2 pt-2 border-t border-gray-200">
                      <label className="text-xs text-gray-500">Price Adjustment:</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Adjustment (₱)"
                          value={service.priceAdjustment || ''}
                          onChange={(e) => {
                            const adjustment = parseFloat(e.target.value) || 0;
                            updateServicePriceAdjustment(index, adjustment, service.adjustmentReason);
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Reason (e.g., Long hair)"
                          value={service.adjustmentReason || ''}
                          onChange={(e) => {
                            updateServicePriceAdjustment(index, service.priceAdjustment || 0, e.target.value);
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent"
                        />
                      </div>
                      {service.priceAdjustment !== 0 && (
                        <div className="text-xs text-gray-600">
                          <span className="text-gray-400">Base: ₱{service.price}</span>
                          <span className="mx-2">+</span>
                          <span className={service.priceAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                            ₱{service.priceAdjustment}
                          </span>
                          <span className="mx-2">=</span>
                          <span className="font-semibold text-green-600">₱{service.adjustedPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {formData.products.map((product, index) => (
                  <div key={`product-${index}`} className="bg-white p-3 rounded border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Package className="h-3 w-3 text-green-600" />
                          <h5 className="font-medium text-gray-900 text-sm">{product.name}</h5>
                        </div>
                        <p className="text-sm text-gray-600">₱{product.price} each</p>
                      </div>
                      <button
                        onClick={() => removeProduct(index)}
                        className="text-red-500 hover:text-red-700 text-sm ml-2"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Qty:</label>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => updateProductQuantity(index, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                      />
                      <span className="text-xs font-medium text-gray-900">
                        ₱{(product.price * product.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {formData.services.length === 0 && formData.products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No items selected</p>
                    <p className="text-xs">Add services or products to start a sale</p>
                  </div>
                )}
              </div>

            </div>

            <div className="border-t bg-white p-3 flex-shrink-0">
              <div className="space-y-2 mb-3">
                {mode === 'payment' ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-green-800 font-medium mb-1">💰 Payment Processing</p>
                    <p className="text-xs text-green-700">Complete the payment for this pending invoice. You can add/remove items, adjust discount/tax, and select payment method before processing.</p>
                  </div>
                ) : mode === 'edit' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-yellow-800 font-medium mb-1">✏️ Edit Invoice</p>
                    <p className="text-xs text-yellow-700">Update invoice items, adjust pricing, or modify discount/tax. Changes will be saved without processing payment.</p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-blue-800 font-medium mb-1">ℹ️ Invoice Creation</p>
                    <p className="text-xs text-blue-700">This creates an invoice with "Pending" status. Payment will be processed after the service is completed.</p>
                  </div>
                )}

                {/* Promotion Selection */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Active Promotions</label>
                  {loadingPromotions ? (
                    <div className="text-xs text-gray-500 py-2">Loading promotions...</div>
                  ) : activePromotions.length === 0 ? (
                    <div className="text-xs text-gray-500 py-2">No active promotions available</div>
                  ) : (
                    <>
                      <select
                        value={formData.appliedPromotion?.id || ''}
                        onChange={(e) => {
                          const promotionId = e.target.value;
                          if (promotionId) {
                            handleApplyPromotion(promotionId);
                          } else {
                            handleRemovePromotion();
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent"
                        disabled={validatingPromotion}
                      >
                        <option value="">Select a promotion...</option>
                        {activePromotions.map(promotion => (
                          <option key={promotion.id} value={promotion.id}>
                            {promotion.title} - {promotion.discountType === 'percentage' 
                              ? `${promotion.discountValue}% OFF`
                              : `₱${promotion.discountValue} OFF`}
                            {promotion.applicableTo === 'services' && ' (Services Only)'}
                            {promotion.applicableTo === 'products' && ' (Products Only)'}
                            {promotion.applicableTo === 'specific' && ' (Specific Items)'}
                          </option>
                        ))}
                      </select>
                      {promotionError && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3" />
                          {promotionError}
                        </div>
                      )}
                      {formData.appliedPromotion && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle className="h-3 w-3" />
                          <span className="font-semibold">{formData.appliedPromotion.title}</span>
                          <span className="text-gray-600">
                            ({formData.appliedPromotion.discountType === 'percentage' 
                              ? `${formData.appliedPromotion.discountValue}% OFF`
                              : `₱${formData.appliedPromotion.discountValue} OFF`})
                          </span>
                          <button
                            type="button"
                            onClick={handleRemovePromotion}
                            className="ml-auto text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Discount and Tax - Always editable */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Discount (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discount}
                      onChange={(e) => {
                        const newDiscount = parseFloat(e.target.value) || 0;
                        // If promotion is applied, remove it when manually changing discount
                        if (formData.appliedPromotion && newDiscount !== formData.discount) {
                          handleRemovePromotion();
                        }
                        handleInputChange('discount', newDiscount);
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent"
                      placeholder="0"
                      disabled={!!formData.appliedPromotion}
                    />
                    {formData.appliedPromotion && (
                      <p className="text-xs text-gray-500 mt-0.5">Discount from promotion</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Tax (₱)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.tax}
                      onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#160B53] focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Payment Method - Only in payment mode */}
                {mode === 'payment' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={formData.paymentMethod === 'cash'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="text-blue-600"
                          />
                          <Banknote className="h-4 w-4 text-green-600" />
                          <span className="text-xs">Cash</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={formData.paymentMethod === 'card'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="text-blue-600"
                          />
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="text-xs">Card</span>
                        </label>
                        
                        <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="digital"
                            checked={formData.paymentMethod === 'digital'}
                            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                            className="text-blue-600"
                          />
                          <Smartphone className="h-4 w-4 text-purple-600" />
                          <span className="text-xs">Digital</span>
                        </label>
                      </div>
                    </div>

                    {formData.paymentMethod === 'cash' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (₱)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.amountReceived}
                          onChange={(e) => handleInputChange('amountReceived', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                          placeholder="Enter amount received"
                        />
                        {formData.amountReceived >= formData.total && (
                          <p className="mt-2 text-sm text-green-600 font-medium">
                            Change: ₱{Math.max(0, formData.amountReceived - formData.total).toFixed(2)}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-1 text-xs mb-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Discount {formData.appliedPromotion 
                      ? `(${formData.appliedPromotion.title})`
                      : `(${formData.discount}%)`}:
                  </span>
                  <span>-₱{formData.appliedPromotion 
                    ? formData.appliedPromotion.discountAmount.toFixed(2)
                    : ((formData.subtotal * formData.discount) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₱{formData.tax.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span className="text-[#160B53]">₱{formData.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loading || 
                    (mode === 'create' && formData.services.length > 0 && !formData.clientName) || 
                    (mode === 'create' && formData.total <= 0) ||
                    (mode === 'create' && formData.services.length === 0 && formData.products.length === 0) ||
                    (mode === 'payment' && !formData.paymentMethod)
                  }
                  className="flex-1 bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {mode === 'payment' ? 'Processing...' : mode === 'edit' ? 'Updating...' : 'Creating...'}
                    </div>
                  ) : (
                    mode === 'payment' ? 'Process Payment' : mode === 'edit' ? 'Update Invoice' : 'Create Invoice'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonTransactionForm;


