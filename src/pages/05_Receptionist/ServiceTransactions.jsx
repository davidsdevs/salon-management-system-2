import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import ServiceTransactionForm from '../shared/ServiceTransactionForm';
import { transactionService } from '../../services/transactionService';
import { 
  Scissors, 
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
  Package,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Filter,
  Printer,
  Download,
  FileText
} from 'lucide-react';

const ServiceTransactions = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  
  // Payment processing states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  // Print report states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [printStatusFilter, setPrintStatusFilter] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [printingSingleTransaction, setPrintingSingleTransaction] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions when filters change
  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, dateFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await transactionService.getTransactionsByBranch(
        userData?.branchId || 'unknown',
        { limit: 50 },
        'service'
      );
      
      setTransactions(result);
    } catch (error) {
      console.error('Error loading service transactions:', error);
      setError('Failed to load service transactions: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.clientInfo?.name?.toLowerCase().includes(searchLower) ||
        transaction.id?.toLowerCase().includes(searchLower) ||
        transaction.services?.[0]?.serviceName?.toLowerCase().includes(searchLower) ||
        transaction.services?.[0]?.stylistName?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filtered = filtered.filter(transaction => {
        if (transaction.createdAt) {
          const transactionDate = new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt);
          return transactionDate.toDateString() === filterDate.toDateString();
        }
        return false;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleServiceTransactionSubmit = async (transactionData) => {
    try {
      console.log('Creating service transaction:', transactionData);
      
      const serviceTransactionData = {
        clientId: transactionData.clientId,
        clientInfo: {
          name: transactionData.clientName,
          phone: transactionData.clientPhone,
          email: transactionData.clientEmail
        },
        branchId: userData?.branchId || 'unknown',
        services: transactionData.services.map(service => ({
          serviceId: service.id,
          serviceName: service.name,
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
        paymentMethod: null, // No payment method until service is completed
        status: 'pending',
        loyaltyEarned: 0, // No loyalty points until payment is processed
        createdBy: userData?.id || userData?.uid || 'unknown',
        notes: `Service Invoice - ${new Date().toLocaleString()}`,
        transactionType: 'service'
      };

      console.log('Creating service transaction:', serviceTransactionData);
      const serviceTransactionId = await transactionService.createTransaction(serviceTransactionData, 'service');
      
      // Note: Payment processing and loyalty points will be handled when service is completed
      
      alert(`Service invoice created successfully! Transaction ID: ${serviceTransactionId}`);
      setShowServiceForm(false);
      
      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('Error creating service transaction:', error);
      alert('Failed to create service transaction: ' + error.message);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
  };

  const handleCompleteTransaction = async (transactionId) => {
    try {
      // Update transaction status to completed
      await transactionService.updateTransaction(transactionId, { 
        status: 'completed',
        paymentMethod: 'cash' // Default payment method
      }, 'service');
      
      alert('Service transaction completed successfully!');
      loadTransactions();
    } catch (error) {
      console.error('Error completing transaction:', error);
      alert('Failed to complete transaction: ' + error.message);
    }
  };

  const handleProcessPayment = (transaction) => {
    setPaymentTransaction(transaction);
    setPaymentMethod('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Calculate loyalty points (1 point per 100 pesos)
      const loyaltyPoints = Math.floor((paymentTransaction.total || 0) / 100);
      
      // Update transaction with payment details
      await transactionService.updateTransaction(paymentTransaction.id, {
        status: 'completed',
        paymentMethod: paymentMethod,
        loyaltyEarned: loyaltyPoints,
        paymentProcessedAt: new Date().toISOString()
      }, 'service');
      
      // TODO: Update client loyalty points in user service
      // This would require implementing a user service method to update loyalty points
      
      alert(`Payment processed successfully! Loyalty points earned: ${loyaltyPoints}`);
      setShowPaymentModal(false);
      setPaymentTransaction(null);
      setPaymentMethod('');
      loadTransactions();
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment: ' + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOpenPrintModal = () => {
    setPrintDateRange({
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setPrintStatusFilter('all');
    setShowPrintModal(true);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Filter transactions based on print criteria
      let reportTransactions = [...transactions];
      
      // Apply date filter
      if (printDateRange.startDate && printDateRange.endDate) {
        const startDate = new Date(printDateRange.startDate);
        const endDate = new Date(printDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        reportTransactions = reportTransactions.filter(transaction => {
          if (transaction.createdAt) {
            const transactionDate = new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt);
            return transactionDate >= startDate && transactionDate <= endDate;
          }
          return false;
        });
      }
      
      // Apply status filter
      if (printStatusFilter !== 'all') {
        reportTransactions = reportTransactions.filter(transaction => transaction.status === printStatusFilter);
      }
      
      await generatePrintReport(reportTransactions);
      setShowPrintModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report: ' + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePrintReport = async (transactionsToPrint) => {
    const printWindow = window.open('', '_blank');
    
    const totalRevenue = transactionsToPrint
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.total || 0), 0);
    
    const pendingCount = transactionsToPrint.filter(t => t.status === 'pending').length;
    const completedCount = transactionsToPrint.filter(t => t.status === 'completed').length;
    
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Transactions Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .status-pending { color: #f59e0b; font-weight: bold; }
          .status-completed { color: #10b981; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Service Transactions Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary">
          <h3>Report Summary</h3>
          <p><strong>Date Range:</strong> ${printDateRange.startDate} to ${printDateRange.endDate}</p>
          <p><strong>Total Transactions:</strong> ${transactionsToPrint.length}</p>
          <p><strong>Pending:</strong> ${pendingCount}</p>
          <p><strong>Completed:</strong> ${completedCount}</p>
          <p><strong>Total Revenue:</strong> ₱${totalRevenue.toFixed(2)}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Client</th>
              <th>Service</th>
              <th>Stylist</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${transactionsToPrint.map(transaction => `
              <tr>
                <td>${transaction.id?.slice(-8) || 'N/A'}</td>
                <td>${transaction.clientInfo?.name || 'Walk-in Client'}</td>
                <td>${transaction.services?.[0]?.serviceName || 'Service'}</td>
                <td>${transaction.services?.[0]?.stylistName || 'Unassigned'}</td>
                <td>₱${transaction.total?.toFixed(2) || '0.00'}</td>
                <td class="status-${transaction.status}">${transaction.status || 'N/A'}</td>
                <td>${transaction.paymentMethod || 'N/A'}</td>
                <td>${transaction.createdAt ? new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt).toLocaleString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>This report was generated by David's Salon Management System</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintSingleTransaction = async (transaction) => {
    try {
      setPrintingSingleTransaction(transaction.id);
      await generateSingleTransactionReport(transaction);
    } catch (error) {
      console.error('Error printing single transaction:', error);
      alert('Failed to print transaction: ' + error.message);
    } finally {
      setPrintingSingleTransaction(null);
    }
  };

  const generateSingleTransactionReport = async (transaction) => {
    const printWindow = window.open('', '_blank');
    
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Transaction Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; max-width: 600px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .transaction-details { margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; }
          .services { margin: 20px 0; }
          .service-item { background: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 5px; }
          .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>David's Salon</h1>
          <h2>Service Transaction Receipt</h2>
          <p>Transaction ID: ${transaction.id?.slice(-8) || 'N/A'}</p>
        </div>
        
        <div class="transaction-details">
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span>${transaction.createdAt ? new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt).toLocaleString() : 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Client:</span>
            <span>${transaction.clientInfo?.name || 'Walk-in Client'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span>${transaction.clientInfo?.phone || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span>${transaction.status || 'N/A'}</span>
          </div>
          ${transaction.paymentMethod ? `
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span>${transaction.paymentMethod}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="services">
          <h3>Services</h3>
          ${transaction.services?.map(service => `
            <div class="service-item">
              <div><strong>${service.serviceName || 'Service'}</strong></div>
              <div>Stylist: ${service.stylistName || 'Unassigned'}</div>
              <div>Price: ₱${service.price?.toFixed(2) || '0.00'}</div>
            </div>
          `).join('') || '<p>No services</p>'}
        </div>
        
        <div class="total">
          Total: ₱${transaction.total?.toFixed(2) || '0.00'}
        </div>
        
        <div class="footer">
          <p>Thank you for choosing David's Salon!</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(reportContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
    <DashboardLayout menuItems={menuItems} pageTitle="Service Transactions">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-3">
            <Button 
              onClick={handleOpenPrintModal}
              variant="outline"
              className="border-[#160B53] text-[#160B53] hover:bg-[#160B53] hover:text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
          <Button 
            onClick={() => setShowServiceForm(true)}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Service Invoice
          </Button>
        </div>

        {/* Filter Status Indicator */}
        {(searchTerm || statusFilter !== 'all' || dateFilter) && (
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 w-fit">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters Applied</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Scissors className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(t => t.status === 'pending').length}
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
              <Clock className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transactions</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadTransactions} className="bg-[#160B53] hover:bg-[#160B53]/90 text-white">
              Try Again
            </Button>
          </Card>
        ) : transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Service Transactions</h3>
            <p className="text-gray-600 mb-4">Create your first service invoice to get started.</p>
            <Button 
              onClick={() => setShowServiceForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Service Invoice
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Filter Section */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                {/* Date Filter */}
                <div className="sm:w-48">
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                {/* Clear Filters */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('');
                  }}
                  className="whitespace-nowrap"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </Card>

            {/* Filter Results */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
            </div>

            {/* Transaction List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:p-6">
                <div className="flow-root">
                  <ul className="divide-y divide-gray-200">
                    {filteredTransactions.map((transaction) => (
                    <li key={transaction.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Scissors className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                {transaction.services?.length || 0} Service(s)
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
                                Service Invoice #{transaction.id.slice(-8)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Created: {formatDate(transaction.createdAt)}
                              </p>
                              {transaction.services?.map((service, index) => (
                                <p key={index} className="text-sm text-gray-500">
                                  {service.serviceName} - {service.stylistName || 'Unassigned'}
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
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintSingleTransaction(transaction)}
                                  disabled={printingSingleTransaction === transaction.id}
                                  title="Print Transaction Receipt"
                                  className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {printingSingleTransaction === transaction.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                  ) : (
                                    <Printer className="h-4 w-4" />
                                  )}
                                </Button>
                                {transaction.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessPayment(transaction)}
                                    title="Process Payment"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <CreditCard className="h-4 w-4" />
                                  </Button>
                                )}
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
          </div>
        )}

        {/* Service Transaction Form Modal */}
        {showServiceForm && (
          <ServiceTransactionForm
            isOpen={showServiceForm}
            onClose={() => setShowServiceForm(false)}
            onSubmit={handleServiceTransactionSubmit}
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
                {/* Transaction Status */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Transaction Status</h4>
                  {getStatusBadge(selectedTransaction.status)}
                </div>

                {/* Transaction Details */}
                <div>
                  <h4 className="font-medium text-gray-900">Transaction Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md mt-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Transaction ID:</span> {selectedTransaction.id?.slice(-8) || 'N/A'}
                    </p>
                    {selectedTransaction.createdAt && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Created:</span> {new Date(selectedTransaction.createdAt.toDate()).toLocaleString()}
                      </p>
                    )}
                    {selectedTransaction.appointmentId && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">From Appointment:</span> {selectedTransaction.appointmentId?.slice(-8) || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>

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
                  <h4 className="font-medium text-gray-900">Services</h4>
                  {selectedTransaction.services?.map((service, index) => (
                    <div key={index} className="flex justify-between py-2 border-b">
                      <div>
                        <p className="text-sm font-medium">{service.serviceName}</p>
                        <p className="text-xs text-gray-500">
                          Stylist: {service.stylistName || 'Unassigned'}
                        </p>
                      </div>
                      <p className="text-sm font-medium">₱{service.price?.toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Information */}
                {selectedTransaction.status === 'completed' && (
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Information</h4>
                    <div className="bg-gray-50 p-3 rounded-md mt-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Payment Method</p>
                          <p className="text-sm font-medium">
                            {selectedTransaction.paymentMethod === 'cash' && (
                              <span className="flex items-center">
                                <Banknote className="h-4 w-4 mr-1 text-green-600" />
                                Cash
                              </span>
                            )}
                            {selectedTransaction.paymentMethod === 'card' && (
                              <span className="flex items-center">
                                <CreditCard className="h-4 w-4 mr-1 text-blue-600" />
                                Credit/Debit Card
                              </span>
                            )}
                            {selectedTransaction.paymentMethod === 'digital' && (
                              <span className="flex items-center">
                                <Smartphone className="h-4 w-4 mr-1 text-purple-600" />
                                Digital Payment
                              </span>
                            )}
                            {!selectedTransaction.paymentMethod && 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Loyalty Points</p>
                          <p className="text-sm font-medium">
                            {selectedTransaction.loyaltyEarned || 0} points earned
                          </p>
                        </div>
                      </div>
                      {selectedTransaction.paymentProcessedAt && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Payment Processed</p>
                          <p className="text-sm text-gray-600">
                            {new Date(selectedTransaction.paymentProcessedAt).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
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

        {/* Payment Processing Modal */}
        {showPaymentModal && paymentTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Process Payment</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Transaction Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Client:</span> {paymentTransaction.clientInfo?.name || 'Walk-in Client'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Service:</span> {paymentTransaction.services?.[0]?.serviceName || 'Service'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Total Amount:</span> ₱{paymentTransaction.total?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <Banknote className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Cash</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Credit/Debit Card</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="digital"
                        checked={paymentMethod === 'digital'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <Smartphone className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Digital Payment (GCash, PayMaya, etc.)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Loyalty Points:</span> {Math.floor((paymentTransaction.total || 0) / 100)} points will be earned
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setShowPaymentModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={processingPayment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={!paymentMethod || processingPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  >
                    {processingPayment ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Process Payment'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Print Report Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={printDateRange.startDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <Input
                        type="date"
                        value={printDateRange.endDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={printStatusFilter}
                    onChange={(e) => setPrintStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    onClick={() => setShowPrintModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={isGeneratingReport}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="flex-1 bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50"
                  >
                    {isGeneratingReport ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </div>
                    ) : (
                      'Generate Report'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceTransactions;
