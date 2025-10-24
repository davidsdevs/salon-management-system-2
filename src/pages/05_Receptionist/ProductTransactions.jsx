import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import ProductTransactionForm from '../shared/ProductTransactionForm';
import { transactionService } from '../../services/transactionService';
import { 
  Package, 
  Plus, 
  Eye, 
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Home,
  Receipt,
  UserCog,
  Calendar,
  Scissors,
  ShoppingCart
} from 'lucide-react';

const ProductTransactions = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await transactionService.getTransactionsByBranch(
        userData?.branchId || 'unknown',
        { limit: 50 },
        'product'
      );
      
      setTransactions(result);
    } catch (error) {
      console.error('Error loading product transactions:', error);
      setError('Failed to load product transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProductTransactionSubmit = async (transactionData) => {
    try {
      console.log('Creating product transaction:', transactionData);
      
      const productTransactionData = {
        clientId: transactionData.clientId,
        clientInfo: {
          name: transactionData.clientName,
          phone: transactionData.clientPhone,
          email: transactionData.clientEmail
        },
        branchId: userData?.branchId || 'unknown',
        products: transactionData.products.map(product => ({
          productId: product.id,
          productName: product.name,
          type: 'product',
          price: product.price,
          quantity: product.quantity,
          total: product.price * product.quantity
        })),
        subtotal: transactionData.subtotal,
        discount: transactionData.discountAmount,
        loyaltyUsed: transactionData.loyaltyUsed,
        tax: transactionData.tax,
        total: transactionData.total,
        paymentMethod: transactionData.paymentMethod,
        status: 'completed', // Product transactions are completed immediately
        loyaltyEarned: Math.floor(transactionData.total / 100), // 1 point per 100 pesos
        createdBy: userData?.id || userData?.uid || 'unknown',
        notes: `Product Sale - ${new Date().toLocaleString()}`,
        transactionType: 'product'
      };

      console.log('Creating product transaction:', productTransactionData);
      const productTransactionId = await transactionService.createTransaction(productTransactionData, 'product');
      
      // Deduct inventory for products
      try {
        await transactionService.deductInventory(transactionData.products);
        console.log('Inventory deducted for products');
      } catch (inventoryError) {
        console.error('Error deducting inventory:', inventoryError);
        // Don't fail the transaction for inventory errors
      }

      // Update client loyalty points
      try {
        const totalLoyaltyEarned = Math.floor(transactionData.total / 100);
        await transactionService.updateClientLoyaltyPoints(
          transactionData.clientId, 
          totalLoyaltyEarned, 
          transactionData.loyaltyUsed || 0
        );
        console.log('Updated client loyalty points');
      } catch (loyaltyError) {
        console.error('Error updating loyalty points:', loyaltyError);
        // Don't fail the transaction for loyalty point errors
      }

      alert(`Product transaction completed successfully! Transaction ID: ${productTransactionId}`);
      setShowProductForm(false);
      
      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('Error creating product transaction:', error);
      alert('Failed to create product transaction: ' + error.message);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: Clock }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/receptionist-appointments', label: 'Appointments', icon: Calendar },
    { path: '/service-transactions', label: 'Service Transactions', icon: Scissors },
    { path: '/product-transactions', label: 'Product Transactions', icon: Package },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Product Transactions">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Transactions</h1>
            <p className="text-gray-600">Manage product sales and inventory</p>
          </div>
          <Button 
            onClick={() => setShowProductForm(true)}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Product Sale
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Items Sold</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.reduce((sum, t) => 
                    sum + (t.products?.reduce((productSum, p) => productSum + (p.quantity || 0), 0) || 0), 0
                  )}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{transactions
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + (t.total || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTransactions} className="bg-[#160B53] hover:bg-[#160B53]/90 text-white">
              Try Again
            </Button>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Transactions</h3>
            <p className="text-gray-600 mb-4">Create your first product sale to get started.</p>
            <Button 
              onClick={() => setShowProductForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Product Sale
            </Button>
          </Card>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <li key={transaction.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {transaction.products?.length || 0} Product(s)
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {transaction.clientInfo?.name || 'Walk-in Client'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                ₱{transaction.total?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                Product Sale #{transaction.id.slice(-8)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Created: {formatDate(transaction.createdAt)}
                              </p>
                              {transaction.products?.map((product, index) => (
                                <p key={index} className="text-sm text-gray-500">
                                  {product.productName} x{product.quantity} - ₱{product.price?.toFixed(2)}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(transaction.status)}
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewTransaction(transaction)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Product Transaction Form Modal */}
        {showProductForm && (
          <ProductTransactionForm
            isOpen={showProductForm}
            onClose={() => setShowProductForm(false)}
            onSubmit={handleProductTransactionSubmit}
            loading={false}
            userData={userData}
          />
        )}

        {/* Transaction Details Modal */}
        {showTransactionDetails && selectedTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
                <button
                  onClick={() => setShowTransactionDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Client Information</h4>
                  <p className="text-sm text-gray-600">
                    {selectedTransaction.clientInfo?.name || 'Walk-in Client'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedTransaction.clientInfo?.phone || 'No phone'}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Products</h4>
                  {selectedTransaction.products?.map((product, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{product.productName}</p>
                        <p className="text-xs text-gray-500">
                          Quantity: {product.quantity} x ₱{product.price?.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">₱{(product.price * product.quantity)?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="text-green-600">-₱{selectedTransaction.discount?.toFixed(2)}</span>
                  </div>
                )}

                {selectedTransaction.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>₱{selectedTransaction.tax?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-4 border-t">
                  <span>Total:</span>
                  <span>₱{selectedTransaction.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductTransactions;
