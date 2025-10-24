import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import ServiceTransactionForm from '../shared/ServiceTransactionForm';
import ProductTransactionForm from '../shared/ProductTransactionForm';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { transactionService } from '../../services/transactionService';
import { userService } from '../../services/userService';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Home,
  Calendar as CalendarIcon,
  UserCog,
  Building2,
  Scissors,
  Package2,
  Receipt,
  TrendingUp,
  Users
} from 'lucide-react';

const POSDashboard = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [dailySummary, setDailySummary] = useState(null);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // Menu items for Receptionist
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/receptionist-appointments', label: 'Appointments', icon: CalendarIcon },
    { path: '/pos-dashboard', label: 'POS System', icon: Receipt },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    loadTransactions();
    loadDailySummary();
  }, [userData?.branchId, statusFilter, dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 50
      };

      // Add date filter
      if (dateFilter === 'today') {
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        filters.startDate = startOfDay;
        filters.endDate = endOfDay;
      }

      const transactionsData = await transactionService.getTransactionsByBranch(
        userData?.branchId || 'unknown', 
        filters
      );
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailySummary = async () => {
    try {
      const today = new Date();
      const summary = await transactionService.getDailySalesSummary(userData?.branchId || 'unknown', today);
      setDailySummary(summary);
    } catch (error) {
      console.error('Error loading daily summary:', error);
    }
  };

  const handleServiceTransactionSubmit = async (transactionData) => {
    try {
      setLoading(true);
      
      // Use clientId if existing client, otherwise use null for walk-in
      const clientId = transactionData.isExistingClient ? transactionData.clientId : null;
      
      const serviceTransactionData = {
        branchId: userData?.branchId || 'unknown',
        clientId: clientId,
        clientInfo: transactionData.isExistingClient ? null : {
          name: transactionData.clientInfo.name,
          phone: transactionData.clientInfo.phone,
          email: transactionData.clientInfo.email
        },
        appointmentId: transactionData.appointmentId || null,
        items: transactionData.services.map(service => ({
          id: service.id,
          name: service.name,
          type: 'service',
          price: service.price,
          stylistId: service.stylistId || null,
          stylistName: service.stylistName || null,
          total: service.price
        })),
        subtotal: transactionData.subtotal,
        discount: 0, // No discount for services
        loyaltyUsed: 0, // No loyalty points for services
        tax: 0, // No tax for services
        total: transactionData.total,
        paymentMethod: transactionData.paymentMethod,
        status: 'completed',
        loyaltyEarned: Math.floor(transactionData.total / 100), // 1 point per 100 pesos
        createdBy: userData?.id || userData?.uid || 'unknown',
        notes: `POS Service Transaction - ${new Date().toLocaleString()}`,
        transactionType: 'service'
      };

      console.log('Creating service transaction:', serviceTransactionData);
      const serviceTransactionId = await transactionService.createTransaction(serviceTransactionData);
      
      // Update client loyalty points
      try {
        const totalLoyaltyEarned = Math.floor(transactionData.total / 100);
        await transactionService.updateClientLoyaltyPoints(
          clientId, 
          totalLoyaltyEarned, 
          0 // No loyalty points used for services
        );
        console.log('Updated client loyalty points');
      } catch (error) {
        console.error('Error updating loyalty points:', error);
      }

      alert(`Service transaction completed successfully! Transaction ID: ${serviceTransactionId}`);
      setShowServiceForm(false);
      
      // Reload transactions and summary
      loadTransactions();
      loadDailySummary();
      
    } catch (error) {
      console.error('Error completing service transaction:', error);
      alert(`Error completing service transaction: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProductTransactionSubmit = async (transactionData) => {
    try {
      setLoading(true);
      
      let clientId = transactionData.clientId;
      
      // Create new client if it's a new client
      if (clientId === 'new_client') {
        try {
          const newClient = await userService.createUser({
            firstName: transactionData.clientInfo.name.split(' ')[0] || transactionData.clientInfo.name,
            lastName: transactionData.clientInfo.name.split(' ').slice(1).join(' ') || '',
            name: transactionData.clientInfo.name,
            phone: transactionData.clientInfo.phone,
            email: transactionData.clientInfo.email,
            role: 'client',
            roles: ['client'],
            branchId: userData.branchId,
            isActive: true,
            loyaltyPoints: 0
          });
          clientId = newClient.id;
          console.log('New client created:', newClient);
        } catch (error) {
          console.error('Error creating new client:', error);
          alert('Error creating new client. Please try again.');
          return;
        }
      }
      
      const productTransactionData = {
        branchId: userData?.branchId || 'unknown',
        clientId: clientId,
        appointmentId: transactionData.appointmentId || null,
        items: transactionData.products.map(product => ({
          id: product.id,
          name: product.name,
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
        status: 'completed',
        loyaltyEarned: Math.floor(transactionData.total / 100), // 1 point per 100 pesos
        createdBy: userData?.id || userData?.uid || 'unknown',
        notes: `POS Product Transaction - ${new Date().toLocaleString()}`,
        transactionType: 'product'
      };

      console.log('Creating product transaction:', productTransactionData);
      const productTransactionId = await transactionService.createTransaction(productTransactionData);
      
      // Deduct inventory for products
      try {
        await transactionService.deductInventory(transactionData.products);
        console.log('Inventory deducted for products');
      } catch (error) {
        console.error('Error deducting inventory:', error);
      }
      
      // Update client loyalty points if client is selected
      if (clientId) {
        try {
          const totalLoyaltyEarned = Math.floor(transactionData.total / 100);
          await transactionService.updateClientLoyaltyPoints(
            clientId, 
            totalLoyaltyEarned, 
            transactionData.loyaltyUsed
          );
          console.log('Updated client loyalty points');
        } catch (error) {
          console.error('Error updating loyalty points:', error);
        }
      }

      alert(`Product transaction completed successfully! Transaction ID: ${productTransactionId}`);
      setShowProductForm(false);
      
      // Reload transactions and summary
      loadTransactions();
      loadDailySummary();
      
    } catch (error) {
      console.error('Error completing product transaction:', error);
      alert(`Error completing product transaction: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'voided':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'voided':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.clientName && transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="POS Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">POS Dashboard</h1>
            <p className="text-gray-600">Manage point of sale transactions</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowServiceForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              <Scissors className="h-4 w-4 mr-2" />
              Service Transaction
            </Button>
            <Button 
              onClick={() => setShowProductForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Package2 className="h-4 w-4 mr-2" />
              Product Transaction
            </Button>
          </div>
        </div>

        {/* Daily Summary Cards */}
        {dailySummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(dailySummary.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dailySummary.totalTransactions}
                  </p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Sale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dailySummary.averageTransaction)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Discounts</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(dailySummary.totalDiscounts)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#160B53]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="voided">Voided</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#160B53]"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Transactions List */}
        <Card>
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">Recent Transactions</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53] mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{transaction.id.slice(-8)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.clientName || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.items?.length || 0} items
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transaction.total || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to transaction details
                            console.log('View transaction:', transaction.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Service Transaction Form Modal */}
      <ServiceTransactionForm
        isOpen={showServiceForm}
        onClose={() => setShowServiceForm(false)}
        onSubmit={handleServiceTransactionSubmit}
        loading={loading}
        userData={userData}
      />

      {/* Product Transaction Form Modal */}
      <ProductTransactionForm
        isOpen={showProductForm}
        onClose={() => setShowProductForm(false)}
        onSubmit={handleProductTransactionSubmit}
        loading={loading}
        userData={userData}
      />
    </DashboardLayout>
  );
};

export default POSDashboard;
