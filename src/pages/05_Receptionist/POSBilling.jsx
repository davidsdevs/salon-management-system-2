import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { transactionService, TRANSACTION_STATUS } from '../../services/transactionService';
import { promotionService } from '../../services/promotionService';
import { hasPermission } from '../../utils/roles';
import { 
  Scissors, 
  Package, 
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Users,
  Home,
  Receipt,
  UserCog,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Search,
  Printer,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  HandCoins,
  Filter
} from 'lucide-react';
import SalonTransactionForm from '../../components/pos/SalonTransactionForm';
import TransactionDetails from '../../components/pos/TransactionDetails';
import POSFilterModal from '../../components/pos/POSFilterModal';
import VoidModal from '../../components/pos/VoidModal';

const POSBilling = () => {
  const { userData } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  // Payment processing states
  const [paymentTransaction, setPaymentTransaction] = useState(null);
  const [formMode, setFormMode] = useState('create'); // 'create', 'edit', 'payment'
  
  // Transaction details states
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Void modal states
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidTransaction, setVoidTransaction] = useState(null);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [discountFilter, setDiscountFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Staff data
  const [staffMap, setStaffMap] = useState({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  
  // Print report states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [printStatusFilter, setPrintStatusFilter] = useState('all');
  const [printTransactionTypeFilter, setPrintTransactionTypeFilter] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [printingSingleTransaction, setPrintingSingleTransaction] = useState(null);
  const [printAfterProcessing, setPrintAfterProcessing] = useState(false);
  
  // Toast notification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [highlightedTransactionId, setHighlightedTransactionId] = useState(null);
  const [initialQueryHandled, setInitialQueryHandled] = useState(false);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => setShowErrorMessage(false), 5000);
  };

  useEffect(() => {
    if (!highlightedTransactionId) return;
    const timer = setTimeout(() => setHighlightedTransactionId(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightedTransactionId]);

  // Print receipt refs
  const receiptPrintRef = useRef();
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptPrintRef.current,
    documentTitle: (receiptToPrint) => {
      const receiptNumber = receiptToPrint?.transactionId || (receiptToPrint?.id ? receiptToPrint.id.slice(-8) : 'N/A');
      return `Receipt_${receiptNumber}`;
    },
    onBeforeGetContent: () => {
      return Promise.resolve();
    },
  });

  const printTransactionReceipt = (tx) => {
    try {
      const transaction = tx || printingSingleTransaction;
      if (!transaction) return;
      setReceiptToPrint(transaction);
      // Small delay to ensure state is set
      setTimeout(() => {
        handlePrintReceipt();
      }, 100);
    } catch (e) {
      console.error('Print failed', e);
      showError('Failed to open print dialog');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions when filters change
  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter, transactionTypeFilter, dateRange.start, dateRange.end, paymentMethodFilter, clientFilter, staffFilter, amountRange.min, amountRange.max, discountFilter, sortColumn, sortDirection]);

  useEffect(() => {
    if (initialQueryHandled || !transactions.length) return;
    const params = new URLSearchParams(location.search);
    const transactionId = params.get('transactionId');
    const appointmentId = params.get('appointmentId');

    let target = null;
    if (transactionId) {
      target = transactions.find(tx => tx.id === transactionId || tx.transactionId === transactionId);
    }
    if (!target && appointmentId) {
      target = transactions.find(tx => tx.appointmentId === appointmentId);
    }

    if (target) {
      if (target.status) {
        setStatusFilter(target.status);
      }
      setCurrentPage(1);
      setHighlightedTransactionId(target.id);
      setTimeout(() => {
        const row = document.getElementById(`txn-row-${target.id}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      setInitialQueryHandled(true);
    }
  }, [location.search, transactions, initialQueryHandled]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await transactionService.getTransactionsByBranch(
        userData?.branchId || 'unknown',
        { limit: 50 }
      );
      
      setTransactions(result);
      
      // Load staff names for all unique createdBy IDs
      const uniqueStaffIds = [...new Set(result.map(tx => tx.createdBy).filter(Boolean))];
      if (uniqueStaffIds.length > 0) {
        const staffData = {};
        await Promise.all(
          uniqueStaffIds.map(async (userId) => {
            try {
              const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
              if (!userDoc.empty) {
                const user = userDoc.docs[0].data();
                staffData[userId] = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || userId;
              } else {
                staffData[userId] = userId;
              }
            } catch (err) {
              console.error('Error loading user:', userId, err);
              staffData[userId] = userId;
            }
          })
        );
        setStaffMap(staffData);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions: ' + error.message);
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
        transaction.products?.[0]?.productName?.toLowerCase().includes(searchLower) ||
        transaction.services?.[0]?.stylistName?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Transaction type filter
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.transactionType === transactionTypeFilter);
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(transaction => {
        if (transaction.createdAt) {
          const transactionDate = new Date(transaction.createdAt.toDate ? transaction.createdAt.toDate() : transaction.createdAt);
          const matchesStart = !dateRange.start || transactionDate >= new Date(dateRange.start);
          const matchesEnd = !dateRange.end || transactionDate <= new Date(dateRange.end + 'T23:59:59');
          return matchesStart && matchesEnd;
        }
        return false;
      });
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(transaction => 
        transaction.clientInfo?.name?.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Staff filter
    if (staffFilter) {
      filtered = filtered.filter(transaction => 
        staffMap[transaction.createdBy] === staffFilter
      );
    }

    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(transaction => {
        const total = transaction.totalAmount || 0;
        const matchesMin = !amountRange.min || total >= parseFloat(amountRange.min);
        const matchesMax = !amountRange.max || total <= parseFloat(amountRange.max);
        return matchesMin && matchesMax;
      });
    }

    // Discount filter
    if (discountFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        const hasDiscount = transaction.discount && transaction.discount > 0;
        return discountFilter === 'with' ? hasDiscount : !hasDiscount;
      });
    }

    // Apply sorting
    const sortedFiltered = sortTransactions(filtered);
    setFilteredTransactions(sortedFiltered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, transactionTypeFilter, dateRange.start, dateRange.end, paymentMethodFilter, clientFilter, staffFilter, amountRange.min, amountRange.max, discountFilter]);

  // Calculate tab counts (memoized to prevent unnecessary recalculations)
  const tabCounts = React.useMemo(() => ({
    all: transactions.length,
    in_service: transactions.filter(t => t.status === TRANSACTION_STATUS.IN_SERVICE).length,
    paid: transactions.filter(t => t.status === TRANSACTION_STATUS.PAID).length,
    voided: transactions.filter(t => t.status === TRANSACTION_STATUS.VOIDED).length
  }), [transactions]);

  // Generate unique clients and staff for filter dropdowns
  const uniqueClients = React.useMemo(() => {
    const clients = new Set();
    transactions.forEach(tx => {
      if (tx.clientInfo?.name) clients.add(tx.clientInfo.name);
    });
    return Array.from(clients).sort();
  }, [transactions]);

  const uniqueStaff = React.useMemo(() => {
    const staff = new Set();
    transactions.forEach(tx => {
      if (tx.createdBy && staffMap[tx.createdBy]) {
        staff.add(staffMap[tx.createdBy]);
      }
    });
    return Array.from(staff).sort();
  }, [transactions, staffMap]);



  const handleTransactionSubmit = async (transactionData) => {
    try {
      console.log('Creating transaction:', transactionData);
      
      const transactionPayload = {
        clientId: transactionData.clientId || null,
        clientInfo: {
          name: transactionData.clientName,
          phone: transactionData.clientPhone || '',
          email: transactionData.clientEmail || ''
        },
        branchId: userData?.branchId || 'unknown',
        transactionType: transactionData.services.length > 0 && transactionData.products.length > 0 
          ? 'mixed' 
          : transactionData.services.length > 0 
            ? 'service' 
            : 'product',
        subtotal: transactionData.subtotal,
        discount: transactionData.discount || 0,
        tax: transactionData.tax || 0,
        total: transactionData.total,
        paymentMethod: null, // Payment method will be set when processing payment
        status: TRANSACTION_STATUS.IN_SERVICE, // All new transactions start as in_service (invoice creation)
        createdBy: userData?.id || userData?.uid || 'unknown',
        notes: transactionData.notes || '',
        // Always include both services and products arrays
        services: transactionData.services.map(service => ({
          serviceId: service.id,
          serviceName: service.name,
          basePrice: service.price,
          adjustedPrice: service.adjustedPrice || service.price,
          priceAdjustment: service.priceAdjustment || 0,
          adjustmentReason: service.adjustmentReason || '',
          stylistId: service.stylistId || null,
          stylistName: service.stylistName || null,
          clientType: service.clientType || 'X',
          total: service.adjustedPrice || service.price
        })),
        products: transactionData.products.map(product => ({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: product.quantity,
          total: product.price * product.quantity
        }))
      };

      console.log('Creating transaction:', transactionPayload);
      const transactionId = await transactionService.createTransaction(transactionPayload);
      
      showSuccess(`Invoice created successfully! Transaction ID: ${transactionId}. Process payment when service is done.`);
      setShowTransactionForm(false);
      
      // Reload transactions
      await loadTransactions();
      
      // Highlight the newly created transaction
      setStatusFilter(TRANSACTION_STATUS.IN_SERVICE);
      setCurrentPage(1);
      setHighlightedTransactionId(transactionId);
      setTimeout(() => {
        const row = document.getElementById(`txn-row-${transactionId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    } catch (error) {
      console.error('Error creating transaction:', error);
      showError('Failed to create transaction: ' + error.message);
    }
  };

  const handleEditInvoice = (transaction) => {
    setPaymentTransaction(transaction);
    setFormMode('edit');
    setShowTransactionForm(true);
  };

  const handleProcessPayment = (transaction) => {
    setPaymentTransaction(transaction);
    setFormMode('payment');
    setShowTransactionForm(true);
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetails(true);
    if (transaction.status) {
      setStatusFilter(transaction.status);
    }
    setCurrentPage(1);
    setHighlightedTransactionId(transaction.id);
    setTimeout(() => {
      const row = document.getElementById(`txn-row-${transaction.id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleEditSubmit = async (editData) => {
    try {
      // Update invoice details WITHOUT processing payment
      await transactionService.updateTransaction(paymentTransaction.id, {
        services: editData.services || [],
        products: editData.products || [],
        subtotal: editData.subtotal || 0,
        discount: editData.discount || 0,
        tax: editData.tax || 0,
        total: editData.total || 0,
        // Keep status as IN_SERVICE
        status: TRANSACTION_STATUS.IN_SERVICE
      });
      
      showSuccess('Invoice updated successfully!');
      setShowTransactionForm(false);
      
      // Reload transactions
      await loadTransactions();
      
      // Stay on IN_SERVICE tab
      setStatusFilter(TRANSACTION_STATUS.IN_SERVICE);
      setCurrentPage(1);
      setHighlightedTransactionId(paymentTransaction.id);
      setTimeout(() => {
        const row = document.getElementById(`txn-row-${paymentTransaction.id}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      
      setPaymentTransaction(null);
    } catch (error) {
      console.error('Error updating invoice:', error);
      showError('Failed to update invoice: ' + error.message);
    }
  };

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const change = Math.max(0, (paymentData.amountReceived || 0) - (paymentData.total || 0));
      
      await transactionService.updateTransaction(paymentTransaction.id, {
        status: TRANSACTION_STATUS.PAID,
        paymentMethod: paymentData.paymentMethod,
        processedAt: new Date(),
        amountReceived: paymentData.amountReceived || 0,
        change: change,
        // Update transaction details in case items were added/removed during payment
        services: paymentData.services || [],
        products: paymentData.products || [],
        subtotal: paymentData.subtotal || 0,
        discount: paymentData.discount || 0,
        tax: paymentData.tax || 0,
        total: paymentData.total || 0,
        appliedPromotion: paymentData.appliedPromotion || null
      });

      // Track promotion usage if promotion was applied
      if (paymentData.appliedPromotion?.id) {
        try {
          await promotionService.trackPromotionUsage(
            paymentData.appliedPromotion.id,
            paymentData.clientId || null
          );
        } catch (error) {
          console.error('Error tracking promotion usage:', error);
          // Don't fail the transaction if promotion tracking fails
        }
      }
      
      showSuccess(`Payment processed successfully! Change: ₱${change.toFixed(2)}`);
      setShowTransactionForm(false);
      
      // Reload transactions
      await loadTransactions();
      
      // Highlight the paid transaction
      setStatusFilter(TRANSACTION_STATUS.PAID);
      setCurrentPage(1);
      setHighlightedTransactionId(paymentTransaction.id);
      setTimeout(() => {
        const row = document.getElementById(`txn-row-${paymentTransaction.id}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      
      setPaymentTransaction(null);
    } catch (error) {
      console.error('Error processing payment:', error);
      showError('Failed to process payment: ' + error.message);
    }
  };

  const handleOpenVoid = (transaction) => {
    // Authorization check for PAID transactions
    if (transaction.status === TRANSACTION_STATUS.PAID) {
      // Only Manager/Admin can void PAID transactions
      if (!hasPermission(userData?.role, 'voidTransactions')) {
        showError('Only Branch Manager or Admin can void paid transactions. Please contact your manager.');
        return;
      }
    } else if (transaction.status === TRANSACTION_STATUS.IN_SERVICE) {
      // Receptionist can void IN_SERVICE, but also Manager/Admin
      if (!hasPermission(userData?.role, 'voidUnpaidTransactions') && 
          !hasPermission(userData?.role, 'voidTransactions')) {
        showError('You do not have permission to void transactions.');
        return;
      }
    }
    
    setVoidTransaction(transaction);
    setShowVoidModal(true);
  };

  const handleVoidTransaction = async (voidData) => {
    try {
      await transactionService.voidTransaction(
        voidData.transactionId,
        voidData.reason,
        voidData.notes,
        userData?.uid
      );
      
      showSuccess('Transaction voided successfully!');
      setShowVoidModal(false);
      setVoidTransaction(null);
      
      // Reload transactions
      await loadTransactions();
      
      // Switch to voided tab
      setStatusFilter(TRANSACTION_STATUS.VOIDED);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error voiding transaction:', error);
      showError('Failed to void transaction: ' + error.message);
    }
  };

  const sortTransactions = (transactions) => {
    if (!sortColumn) {
      return [...transactions].sort((a, b) => {
        const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
        const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
        return bDate - aDate; // Descending order (newest first)
      });
    }

    return [...transactions].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'client':
          aValue = a.clientInfo?.name || '';
          bValue = b.clientInfo?.name || '';
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'date':
          aValue = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          bValue = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4 text-gray-600" /> : 
      <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [TRANSACTION_STATUS.IN_SERVICE]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Service' },
      [TRANSACTION_STATUS.PAID]: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      [TRANSACTION_STATUS.VOIDED]: { color: 'bg-red-100 text-red-800', label: 'Voided' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/receptionist-appointments', label: 'Appointments', icon: Calendar },
    { path: '/pos-billing', label: 'POS & Billing', icon: Receipt },
    { path: '/receptionist/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog }
  ];

  return (
    <>
    <DashboardLayout menuItems={menuItems} pageTitle="POS & Billing">
      <div className="max-w-7xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent w-full sm:w-64"
              />
            </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilterModal(true)}
              className={`border-gray-300 hover:border-[#160B53] ${
                (dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || paymentMethodFilter !== 'all' || clientFilter || staffFilter || amountRange.min || amountRange.max || discountFilter !== 'all') ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {(dateRange.start || dateRange.end || transactionTypeFilter !== 'all' || paymentMethodFilter !== 'all' || clientFilter || staffFilter || amountRange.min || amountRange.max || discountFilter !== 'all') && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[dateRange.start, dateRange.end, transactionTypeFilter !== 'all' ? transactionTypeFilter : null, paymentMethodFilter !== 'all' ? paymentMethodFilter : null, clientFilter, staffFilter, amountRange.min, amountRange.max, discountFilter !== 'all' ? discountFilter : null].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>

          {/* New Invoice Button */}
          <Button 
            onClick={() => {
              setFormMode('create');
              setPaymentTransaction(null);
              setShowTransactionForm(true);
            }}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 p-4 pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.all}</span>
              <span>All</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(TRANSACTION_STATUS.IN_SERVICE)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === TRANSACTION_STATUS.IN_SERVICE
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.in_service}</span>
              <span>In Service</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(TRANSACTION_STATUS.PAID)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === TRANSACTION_STATUS.PAID
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.paid}</span>
              <span>Paid</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(TRANSACTION_STATUS.VOIDED)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === TRANSACTION_STATUS.VOIDED
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.voided}</span>
              <span>Voided</span>
            </div>
          </button>
        </div>

        {/* Transactions Table */}
        <Card className="-mt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction #
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date & Time</span>
                      {getSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {getSortIcon('client')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Total</span>
                      {getSortIcon('total')}
                    </div>
                  </th>
                  {statusFilter === 'all' && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={statusFilter === 'all' ? 7 : 6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#160B53]"></div>
                        <span className="ml-2">Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={statusFilter === 'all' ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id}
                      id={`txn-row-${transaction.id}`}
                      className={`transition-colors ${
                        highlightedTransactionId === transaction.id
                          ? 'bg-yellow-50 ring-2 ring-yellow-300'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-mono text-xs">
                          #{transaction.id?.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{formatDate(transaction.createdAt)}</div>
                          <div className="text-gray-500">{formatTime(transaction.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{transaction.clientInfo?.name || 'Walk-in Client'}</div>
                          <div className="text-gray-500">{transaction.clientInfo?.phone || 'No phone'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="space-y-1">
                          {/* Services */}
                          {transaction.services?.map((service, index) => (
                            <div key={`service-${index}`} className="text-sm">
                              <span className="font-medium">{service.serviceName}</span>
                              {service.stylistName && (
                                <span className="text-gray-500 ml-2">({service.stylistName})</span>
                              )}
                              <div className="text-gray-500 ml-2">
                                {service.adjustedPrice && service.adjustedPrice !== service.basePrice ? (
                                  <div>
                                    <span className="line-through text-gray-400">₱{service.basePrice?.toFixed(2)}</span>
                                    <span className="ml-2 font-semibold text-green-600">₱{service.adjustedPrice.toFixed(2)}</span>
                                    {service.adjustmentReason && (
                                      <div className="text-xs text-gray-400">({service.adjustmentReason})</div>
                                    )}
                                  </div>
                                ) : (
                                  <span>₱{service.basePrice?.toFixed(2) || service.price?.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          {/* Products */}
                          {transaction.products?.map((product, index) => (
                            <div key={`product-${index}`} className="text-sm">
                              <span className="font-medium">{product.productName}</span>
                              <span className="text-gray-500 ml-2">x{product.quantity}</span>
                              <span className="text-gray-500 ml-2">₱{(product.price * product.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₱{transaction.total?.toFixed(2)}
                      </td>
                      {statusFilter === 'all' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(transaction)}
                            title="View Details"
                            className="p-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => printTransactionReceipt(transaction)}
                            title="Print Receipt"
                            className="p-2 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-200"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          
                          {transaction.status === TRANSACTION_STATUS.IN_SERVICE && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditInvoice(transaction)}
                                title="Edit Invoice"
                                className="p-2 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayment(transaction)}
                                title="Process Payment"
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 transition-all duration-200 hover:shadow-md"
                              >
                                <HandCoins className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {/* Void Button - for IN_SERVICE or PAID transactions */}
                          {(transaction.status === TRANSACTION_STATUS.IN_SERVICE || 
                            transaction.status === TRANSACTION_STATUS.PAID) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenVoid(transaction)}
                              title="Void Transaction"
                              className="p-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredTransactions.length)}</span> of{' '}
                    <span className="font-medium">{filteredTransactions.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="rounded-l-md"
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={currentPage === page ? "bg-[#160B53] text-white" : ""}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="rounded-r-md"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Card>

      {/* Salon Transaction Form Modal - Used for creating invoices, editing invoices, and processing payments */}
      {showTransactionForm && (
        <SalonTransactionForm
          isOpen={showTransactionForm}
          onClose={() => {
            setShowTransactionForm(false);
            setPaymentTransaction(null);
            setFormMode('create');
          }}
          onSubmit={
            formMode === 'edit' ? handleEditSubmit :
            formMode === 'payment' ? handlePaymentSubmit :
            handleTransactionSubmit
          }
          userData={userData}
          showSuccess={showSuccess}
          showError={showError}
          mode={formMode}
          existingTransaction={paymentTransaction}
        />
      )}

      {/* Transaction Details Modal */}
      <TransactionDetails
        isOpen={showTransactionDetails}
        onClose={() => {
          setShowTransactionDetails(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      {/* Filter Modal */}
      <POSFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        dateRange={dateRange}
        setDateRange={setDateRange}
        transactionTypeFilter={transactionTypeFilter}
        setTransactionTypeFilter={setTransactionTypeFilter}
        paymentMethodFilter={paymentMethodFilter}
        setPaymentMethodFilter={setPaymentMethodFilter}
        clientFilter={clientFilter}
        setClientFilter={setClientFilter}
        staffFilter={staffFilter}
        setStaffFilter={setStaffFilter}
        amountRange={amountRange}
        setAmountRange={setAmountRange}
        discountFilter={discountFilter}
        setDiscountFilter={setDiscountFilter}
        uniqueClients={uniqueClients}
        uniqueStaff={uniqueStaff}
      />

      {/* Void Modal */}
      {showVoidModal && voidTransaction && (
        <VoidModal
          isOpen={showVoidModal}
          onClose={() => {
            setShowVoidModal(false);
            setVoidTransaction(null);
          }}
          transaction={voidTransaction}
          onVoid={handleVoidTransaction}
          loading={false}
        />
      )}
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {showErrorMessage && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[60] flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {errorMessage}
        </div>
      )}
    </DashboardLayout>
    
    {/* Hidden Receipt Print Content */}
    {receiptToPrint && (
      <div ref={receiptPrintRef} style={{ display: 'none' }}>
        <div style={{ 
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu',
          color: '#111827',
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .receipt-content,
              .receipt-content * {
                visibility: visible;
              }
              .receipt-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
            }
            .muted { color: #6b7280; }
            .total { font-weight: 700; color: #160B53; }
            table { width: 100%; border-collapse: collapse; }
          `}</style>
          <div className="receipt-content">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '16px' }}>Salon Receipt</div>
              <div className="muted" style={{ fontSize: '12px' }}>
                {userData?.branchName || 'Branch'} • {userData?.branchId || ''}
              </div>
            </div>
            <hr />
            <div style={{ fontSize: '12px' }}>
              <div>
                <span className="muted">Receipt #:</span> {receiptToPrint.transactionId || (receiptToPrint.id ? receiptToPrint.id.slice(-8) : 'N/A')}
              </div>
              <div>
                <span className="muted">Date:</span> {
                  receiptToPrint.createdAt?.toDate ? receiptToPrint.createdAt.toDate().toLocaleString() :
                  receiptToPrint.createdAt ? new Date(receiptToPrint.createdAt).toLocaleString() :
                  new Date().toLocaleString()
                }
              </div>
              <div>
                <span className="muted">Client:</span> {receiptToPrint.clientInfo?.name || 'Walk-in Client'}
              </div>
              <div>
                <span className="muted">Cashier:</span> {userData?.firstName || ''} {userData?.lastName || ''}
              </div>
            </div>
            <hr />
            <table>
              <tbody>
                {Array.isArray(receiptToPrint.services) && receiptToPrint.services.map((s, idx) => (
                  <tr key={`service-${idx}`}>
                    <td style={{ padding: '4px 0' }}>
                      {s.serviceName}{s.stylistName ? <span className="muted"> ( {s.stylistName} )</span> : ''}
                    </td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>
                      ₱{(s.adjustedPrice ?? s.basePrice ?? s.price ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {Array.isArray(receiptToPrint.products) && receiptToPrint.products.map((p, idx) => (
                  <tr key={`product-${idx}`}>
                    <td style={{ padding: '4px 0' }}>{p.productName} x{p.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '4px 0' }}>
                      ₱{(p.price * p.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <table>
              <tbody>
                <tr>
                  <td className="muted">Subtotal</td>
                  <td style={{ textAlign: 'right' }}>₱{(receiptToPrint.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="muted">Discount {receiptToPrint.discount ? `(${receiptToPrint.discount}%)` : ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    -₱{(((receiptToPrint.subtotal || 0) * (receiptToPrint.discount || 0)) / 100).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="muted">Tax</td>
                  <td style={{ textAlign: 'right' }}>₱{(receiptToPrint.tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="total">TOTAL</td>
                  <td style={{ textAlign: 'right' }} className="total">₱{(receiptToPrint.total || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="muted">Payment</td>
                  <td style={{ textAlign: 'right' }}>{receiptToPrint.paymentMethod || 'N/A'}</td>
                </tr>
                {receiptToPrint.amountReceived != null && (
                  <tr>
                    <td className="muted">Amount Received</td>
                    <td style={{ textAlign: 'right' }}>₱{Number(receiptToPrint.amountReceived).toFixed(2)}</td>
                  </tr>
                )}
                {receiptToPrint.change != null && (
                  <tr>
                    <td className="muted">Change</td>
                    <td style={{ textAlign: 'right' }}>₱{Number(receiptToPrint.change).toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <hr />
            <div style={{ textAlign: 'center', fontSize: '12px' }} className="muted">
              Thank you for visiting!
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default POSBilling;
