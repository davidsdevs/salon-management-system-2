import React, { useState, useEffect } from 'react';
import { Card } from '../../pages/ui/card';
import { Button } from '../../pages/ui/button';
import { X, Receipt, Scissors, Package, CreditCard, Banknote, Smartphone, Calendar, Clock, User } from 'lucide-react';
import { TRANSACTION_STATUS } from '../../services/transactionService';

const TransactionDetails = ({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

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

  if (!isOpen || !transaction) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [TRANSACTION_STATUS.IN_SERVICE]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Service' },
      [TRANSACTION_STATUS.PAID]: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      [TRANSACTION_STATUS.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    switch(method) {
      case 'cash':
        return <Banknote className="h-4 w-4 text-green-600" />;
      case 'card':
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case 'digital':
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      default:
        return null;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch(method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Credit/Debit Card';
      case 'digital':
        return 'Digital Payment';
      default:
        return 'Not specified';
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] px-4 py-3 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Transaction Details</h2>
              <p className="text-blue-100 text-sm mt-1">
                Transaction ID: #{transaction.id?.slice(-8) || 'N/A'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="text-white hover:bg-white/20 p-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Client Info & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-4 w-4 mr-2 text-[#160B53]" />
                {transaction.clientInfo?.name || 'Walk-in Client'}
              </h3>
              <p className="text-sm text-gray-600 ml-7">
                {transaction.clientInfo?.phone || 'No phone provided'}
              </p>
            </div>
            {getStatusBadge(transaction.status)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Column - Transaction Items */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Date & Time Info */}
              <div className="flex items-center gap-6 text-sm text-gray-600 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{transaction.createdAt ? new Date(transaction.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{transaction.createdAt ? new Date(transaction.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</span>
                </div>
              </div>

              {/* Services Section */}
              {transaction.services && transaction.services.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Scissors className="h-5 w-5 mr-2 text-[#160B53]" />
                    Services
                  </h4>
                  <div className="space-y-3">
                    {transaction.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{service.serviceName}</p>
                          <p className="text-xs text-gray-500">
                            Stylist: {service.stylistName || 'Unassigned'}
                          </p>
                          {service.adjustmentReason && (
                            <p className="text-xs text-blue-600">
                              Adjustment: {service.adjustmentReason}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {service.adjustedPrice && service.adjustedPrice !== service.basePrice ? (
                            <div>
                              <p className="text-xs text-gray-400 line-through">
                                ₱{service.basePrice?.toFixed(2)}
                              </p>
                              <p className="text-sm font-semibold text-green-600">
                                ₱{service.adjustedPrice.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">
                              ₱{service.basePrice?.toFixed(2) || service.price?.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Products Section */}
              {transaction.products && transaction.products.length > 0 && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-[#160B53]" />
                    Products
                  </h4>
                  <div className="space-y-3">
                    {transaction.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {product.name || product.productName || 'Unnamed Product'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Quantity: {product.quantity} × ₱{product.price?.toFixed(2)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          ₱{(product.price * product.quantity)?.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Payment Summary */}
            <div className="space-y-4">
              
              {/* Payment Summary */}
              <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₱{transaction.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  {transaction.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount ({transaction.discount}%):</span>
                      <span className="font-medium text-red-600">
                        -₱{((transaction.subtotal * transaction.discount) / 100)?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  {transaction.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax:</span>
                      <span className="font-medium">₱{transaction.tax?.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-base font-bold border-t pt-2 mt-2">
                    <span>Total:</span>
                    <span className="text-[#160B53]">₱{transaction.total?.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Payment Information */}
              {transaction.status === TRANSACTION_STATUS.PAID && (
                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-[#160B53]" />
                    Payment Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                      <div className="flex items-center">
                        {getPaymentMethodIcon(transaction.paymentMethod)}
                        <span className="text-sm font-medium ml-2">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </span>
                      </div>
                    </div>
                    
                    {transaction.paymentMethod === 'cash' && transaction.amountReceived && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Amount Received</p>
                          <p className="text-sm font-medium">₱{transaction.amountReceived?.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Change</p>
                          <p className="text-sm font-medium text-green-600">
                            ₱{transaction.change?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {transaction.processedAt && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-gray-500 mb-1 flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Processed At
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(transaction.processedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6 py-2"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetails;
