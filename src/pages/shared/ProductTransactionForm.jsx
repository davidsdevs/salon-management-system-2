import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  X, 
  Plus, 
  Minus, 
  Search, 
  User, 
  Calendar, 
  Clock,
  Package2,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CreditCard,
  Gift,
  Percent,
  DollarSign
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { productService } from '../../services/productService';
import { appointmentService } from '../../services/appointmentService';

const ProductTransactionForm = ({ isOpen, onClose, onSubmit, loading, userData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    isNewClient: false,
    newClientName: '',
    newClientPhone: '',
    newClientEmail: '',
    appointmentId: '',
    products: [], // { id, name, price, quantity, stock }
    discount: 0,
    discountType: 'amount',
    loyaltyUsed: 0,
    paymentMethod: 'cash',
    subtotal: 0,
    discountAmount: 0,
    tax: 0,
    total: 0
  });
  
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingClients, setSearchingClients] = useState(false);
  const [searchingAppointments, setSearchingAppointments] = useState(false);
  const [errors, setErrors] = useState({});
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
      setFormData({
        clientId: '',
        clientName: '',
        isNewClient: false,
        newClientName: '',
        newClientPhone: '',
        newClientEmail: '',
        appointmentId: '',
        products: [],
        discount: 0,
        discountType: 'amount',
        loyaltyUsed: 0,
        paymentMethod: 'cash',
        subtotal: 0,
        discountAmount: 0,
        tax: 0,
        total: 0
      });
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      if (userData?.branchId) {
        const branchProducts = await productService.getProductsByBranch(userData.branchId);
        setProducts(branchProducts.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price || 0,
          stock: product.stock || 0,
          description: product.description,
          category: product.category
        })));
      }
    } catch (error) {
      console.error('Error loading products:', error);
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
      isNewClient: false
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

  const handleProductToggle = (product) => {
    const existingProduct = formData.products.find(p => p.id === product.id);
    
    if (existingProduct) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== product.id)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, { ...product, quantity: 1 }]
      }));
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== productId)
      }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p => 
        p.id === productId ? { ...p, quantity } : p
      )
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    const discountAmount = formData.discountType === 'percentage' 
      ? (subtotal * formData.discount) / 100 
      : formData.discount;
    const taxableAmount = subtotal - discountAmount - formData.loyaltyUsed;
    const tax = (taxableAmount * 0.12); // 12% VAT
    const total = taxableAmount + tax;

    setFormData(prev => ({
      ...prev,
      subtotal,
      discountAmount,
      tax,
      total
    }));
  };

  useEffect(() => {
    calculateTotals();
  }, [formData.products, formData.discount, formData.discountType, formData.loyaltyUsed]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId && !formData.isNewClient) {
      newErrors.client = 'Please select a client or create a new one';
    }

    if (formData.isNewClient) {
      if (!formData.newClientName.trim()) {
        newErrors.newClientName = 'Client name is required';
      }
      if (!formData.newClientPhone.trim()) {
        newErrors.newClientPhone = 'Phone number is required';
      }
    }

    if (formData.products.length === 0) {
      newErrors.products = 'Please select at least one product';
    }

    // Check stock availability
    for (const product of formData.products) {
      if (product.quantity > product.stock) {
        newErrors.stock = `Insufficient stock for ${product.name}. Available: ${product.stock}`;
        break;
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
        clientInfo: formData.isNewClient ? {
          name: formData.newClientName,
          phone: formData.newClientPhone,
          email: formData.newClientEmail
        } : null,
        items: formData.products,
        transactionType: 'product'
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
            <h2 className="text-2xl font-bold text-gray-900">Product Transaction</h2>
            <p className="text-gray-600">Sell and process product transactions</p>
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
              <span className="ml-2 font-medium">Client & Products</span>
            </div>
            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-[#160B53]' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-[#160B53]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-[#160B53] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Payment & Confirmation</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Client & Products */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Client & Products */}
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
                  ) : formData.isNewClient ? (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-blue-900">New Client</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, isNewClient: false, newClientName: '', newClientPhone: '', newClientEmail: '' }))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <Input
                            placeholder="Client Name *"
                            value={formData.newClientName}
                            onChange={(e) => setFormData(prev => ({ ...prev, newClientName: e.target.value }))}
                          />
                          {errors.newClientName && <p className="text-red-500 text-sm mt-1">{errors.newClientName}</p>}
                        </div>
                        <div>
                          <Input
                            placeholder="Phone Number *"
                            value={formData.newClientPhone}
                            onChange={(e) => setFormData(prev => ({ ...prev, newClientPhone: e.target.value }))}
                          />
                          {errors.newClientPhone && <p className="text-red-500 text-sm mt-1">{errors.newClientPhone}</p>}
                        </div>
                        <Input
                          placeholder="Email (Optional)"
                          value={formData.newClientEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, newClientEmail: e.target.value }))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search clients..."
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
                      
                      <Button
                        onClick={() => setFormData(prev => ({ ...prev, isNewClient: true }))}
                        className="w-full justify-start"
                        variant="outline"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Add New Client
                      </Button>
                    </div>
                  )}
                  
                  {errors.client && <p className="text-red-500 text-sm mt-2">{errors.client}</p>}
                </Card>

                {/* Products Selection */}
                <Card className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Select Products</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {products.map((product) => {
                      const isSelected = formData.products.some(p => p.id === product.id);
                      const selectedProduct = formData.products.find(p => p.id === product.id);
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-gray-600">₱{product.price.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                            {product.description && (
                              <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isSelected ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProductQuantity(product.id, selectedProduct.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{selectedProduct.quantity}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateProductQuantity(product.id, selectedProduct.quantity + 1)}
                                  disabled={selectedProduct.quantity >= product.stock}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleProductToggle(product)}
                                className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                                disabled={product.stock === 0}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {errors.products && <p className="text-red-500 text-sm mt-2">{errors.products}</p>}
                  {errors.stock && <p className="text-red-500 text-sm mt-2">{errors.stock}</p>}
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
                  <h3 className="text-lg font-semibold mb-4">Product Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₱{formData.subtotal.toFixed(2)}</span>
                    </div>
                    {formData.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-₱{formData.discountAmount.toFixed(2)}</span>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Product Transaction</h3>
                <p className="text-gray-600">Please review all details before processing the transaction.</p>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Client Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Name:</span> {formData.clientName}</p>
                    {formData.isNewClient && (
                      <>
                        <p><span className="font-medium">Phone:</span> {formData.newClientPhone}</p>
                        {formData.newClientEmail && (
                          <p><span className="font-medium">Email:</span> {formData.newClientEmail}</p>
                        )}
                      </>
                    )}
                    <p><span className="font-medium">Loyalty Points:</span> {loyaltyPoints}</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Payment Details</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Payment Method:</span> {formData.paymentMethod.charAt(0).toUpperCase() + formData.paymentMethod.slice(1)}</p>
                    <p><span className="font-medium">Transaction Type:</span> Product</p>
                    {formData.discountAmount > 0 && (
                      <p><span className="font-medium">Discount:</span> ₱{formData.discountAmount.toFixed(2)}</p>
                    )}
                    {formData.loyaltyUsed > 0 && (
                      <p><span className="font-medium">Loyalty Used:</span> {formData.loyaltyUsed} points</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Products Summary */}
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Selected Products</h4>
                <div className="space-y-3">
                  {formData.products.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </div>
                      <p className="font-medium">₱{(product.price * product.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₱{formData.subtotal.toFixed(2)}</span>
                  </div>
                  {formData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-₱{formData.discountAmount.toFixed(2)}</span>
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
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
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
                Process Product Transaction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTransactionForm;
