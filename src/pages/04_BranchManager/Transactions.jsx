import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { transactionApiService } from '../../services/transactionApiService';
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Package,
  Scissors,
  Users,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  UserCog,
  Settings,
  BarChart3,
  Receipt,
  RefreshCw,
  Plus,
  Printer,
  FileText,
  X,
  ChevronDown,
  ArrowUpDown,
  Trash2,
  Sparkles
} from 'lucide-react';
import { branchManagerMenuItems } from './menuItems';
import Modal from '../ui/modal';

const BranchManagerTransactions = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Advanced Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('All'); // All, Today, This Week, This Month, Last Month, Custom
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [stylistFilter, setStylistFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, amountDesc, amountAsc, clientAsc
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // Increased default for big data
  const [totalItems, setTotalItems] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  
  // Performance states
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState('');
  
  // Modal state
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [branchName, setBranchName] = useState(null);
  const [createdByName, setCreatedByName] = useState(null);
  const [appointmentInfo, setAppointmentInfo] = useState(null);
  
  // Print refs
  const printReportRef = useRef();
  const printReceiptRef = useRef();



  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load transactions from API with server-side pagination
  const loadTransactions = useCallback(async (page = 1, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      if (!userData?.branchId) {
        throw new Error('Branch ID not found');
      }

      // Get primary role from roles array
      const primaryRole = userData.roles?.[0] || userData.role || 'branchManager';
      
      if (!primaryRole) {
        throw new Error('User role not found. Please refresh the page.');
      }

      const response = await transactionApiService.getBranchTransactions(
        userData.branchId,
        primaryRole,
        {
          page,
          limit: itemsPerPage,
          search: searchDebounce,
          typeFilter,
          statusFilter,
          lastDoc: reset ? null : lastDoc
        }
      );

      if (response.success) {
        const newTransactions = response.transactions || [];
        
        if (reset) {
          setTransactions(newTransactions);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
        }
        
        setTotalItems(response.totalCount || newTransactions.length);
        setHasMore(response.hasMore || false);
        setLastDoc(response.lastDoc || null);
      } else {
        // Provide detailed error information
        const errorDetails = response.errorDetails ? ` (Details: ${JSON.stringify(response.errorDetails)})` : '';
        const errorCode = response.errorCode ? ` [Code: ${response.errorCode}]` : '';
        throw new Error(response.error || 'Failed to load transactions' + errorCode + errorDetails);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      console.error('Error stack:', err.stack);
      console.error('Full error object:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to load transactions';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Add context information
      if (userData?.branchId) {
        errorMessage += ` (Branch ID: ${userData.branchId})`;
      }
      
      setError(errorMessage);
      if (reset) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [userData, searchDebounce, typeFilter, statusFilter, itemsPerPage, lastDoc]);

  // Initial load
  useEffect(() => {
    if (userData) {
      loadTransactions(1, true);
    }
  }, [userData]);

  // Reload when filters change
  useEffect(() => {
    if (userData && (searchDebounce !== searchTerm || typeFilter !== 'All' || statusFilter !== 'All')) {
      loadTransactions(1, true);
    }
  }, [searchDebounce, typeFilter, statusFilter, userData]);

  // Enhanced filtering with all filters
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        const clientInfo = transaction.clientInfo || {};
        return (
          transaction.customerName?.toLowerCase().includes(searchLower) ||
          clientInfo.name?.toLowerCase().includes(searchLower) ||
          clientInfo.email?.toLowerCase().includes(searchLower) ||
          clientInfo.phone?.toLowerCase().includes(searchLower) ||
          transaction.clientId?.toLowerCase().includes(searchLower) ||
          transaction.appointmentId?.toLowerCase().includes(searchLower) ||
          transaction.serviceName?.toLowerCase().includes(searchLower) ||
          transaction.services?.some(s => (s.serviceName || s.name)?.toLowerCase().includes(searchLower)) ||
          transaction.stylistName?.toLowerCase().includes(searchLower) ||
          transaction.services?.some(s => s.stylistName?.toLowerCase().includes(searchLower)) ||
          transaction.products?.some(p => p.name?.toLowerCase().includes(searchLower)) ||
          transaction.id?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(transaction =>
        transaction.type?.toLowerCase() === typeFilter.toLowerCase() ||
        transaction.transactionType?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(transaction =>
        transaction.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(transaction => {
        if (!transaction.createdAt) return false;
        const transactionDate = new Date(
          transaction.createdAt?.toDate ? transaction.createdAt.toDate() : transaction.createdAt
        );
        transactionDate.setHours(0, 0, 0, 0);
        
        const matchesStart = !dateRange.start || transactionDate >= new Date(dateRange.start);
        const matchesEnd = !dateRange.end || transactionDate <= new Date(dateRange.end + 'T23:59:59');
        return matchesStart && matchesEnd;
      });
    }

    // Payment method filter
    if (paymentMethodFilter !== 'All') {
      filtered = filtered.filter(transaction =>
        transaction.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()
      );
    }

    // Stylist filter
    if (stylistFilter !== 'All') {
      filtered = filtered.filter(transaction =>
        transaction.services?.some(s => s.stylistName === stylistFilter)
      );
    }

    // Service filter
    if (serviceFilter !== 'All') {
      filtered = filtered.filter(transaction =>
        transaction.services?.some(s => (s.serviceName || s.name) === serviceFilter)
      );
    }

    // Client filter
    if (clientFilter) {
      const clientLower = clientFilter.toLowerCase();
      filtered = filtered.filter(transaction => {
        const clientInfo = transaction.clientInfo || {};
        return (
          clientInfo.name?.toLowerCase().includes(clientLower) ||
          transaction.clientName?.toLowerCase().includes(clientLower) ||
          transaction.clientId?.toLowerCase().includes(clientLower)
        );
      });
    }

    // Amount range filter
    if (amountRange.min || amountRange.max) {
      filtered = filtered.filter(transaction => {
        const total = transaction.total || transaction.totalAmount || 0;
        const min = amountRange.min ? parseFloat(amountRange.min) : 0;
        const max = amountRange.max ? parseFloat(amountRange.max) : Infinity;
        return total >= min && total <= max;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dateDesc':
          const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
          const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
          return dateB - dateA;
        case 'dateAsc':
          const dateA2 = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
          const dateB2 = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
          return dateA2 - dateB2;
        case 'amountDesc':
          return (b.total || b.totalAmount || 0) - (a.total || a.totalAmount || 0);
        case 'amountAsc':
          return (a.total || a.totalAmount || 0) - (b.total || b.totalAmount || 0);
        case 'clientAsc':
          const nameA = (a.clientInfo?.name || a.clientName || '').toLowerCase();
          const nameB = (b.clientInfo?.name || b.clientName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, statusFilter, dateRange, paymentMethodFilter, stylistFilter, serviceFilter, clientFilter, amountRange, sortBy]);

  // Memoized unique values for filters (extracted from all transactions)
  const transactionTypes = useMemo(() => {
    const types = new Set(['All']);
    transactions.forEach(t => {
      if (t.type) types.add(t.type);
      if (t.transactionType) types.add(t.transactionType);
    });
    return Array.from(types);
  }, [transactions]);

  const transactionStatuses = useMemo(() => {
    // Match the actual database statuses: in_service, paid, voided
    return ['All', 'In Service', 'Paid', 'Voided'];
  }, []);

  const paymentMethods = useMemo(() => {
    const methods = new Set(['All']);
    transactions.forEach(t => {
      if (t.paymentMethod) methods.add(t.paymentMethod);
    });
    return Array.from(methods);
  }, [transactions]);

  const stylists = useMemo(() => {
    const stylistSet = new Set(['All']);
    transactions.forEach(t => {
      t.services?.forEach(s => {
        if (s.stylistName) stylistSet.add(s.stylistName);
      });
    });
    return Array.from(stylistSet);
  }, [transactions]);

  const services = useMemo(() => {
    const serviceSet = new Set(['All']);
    transactions.forEach(t => {
      t.services?.forEach(s => {
        if (s.serviceName || s.name) serviceSet.add(s.serviceName || s.name);
      });
    });
    return Array.from(serviceSet);
  }, [transactions]);

  // Apply date preset
  const applyDatePreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = '';
    let endDate = '';

    switch (preset) {
      case 'Today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'This Week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'This Month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'Last Month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        startDate = lastMonth.toISOString().split('T')[0];
        endDate = lastMonthEnd.toISOString().split('T')[0];
        break;
      case 'Last 7 Days':
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);
        startDate = last7Days.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'Last 30 Days':
        const last30Days = new Date(today);
        last30Days.setDate(today.getDate() - 30);
        startDate = last30Days.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        startDate = '';
        endDate = '';
    }

    setDateRange({ start: startDate, end: endDate });
    setDatePreset(preset);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);
  
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, startIndex, endIndex]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadTransactions(currentPage + 1, false);
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore, isLoadingMore, currentPage, loadTransactions]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateRange, paymentMethodFilter, stylistFilter, serviceFilter, clientFilter, amountRange, sortBy]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('All');
    setStatusFilter('All');
    setDateRange({ start: '', end: '' });
    setDatePreset('All');
    setPaymentMethodFilter('All');
    setStylistFilter('All');
    setServiceFilter('All');
    setClientFilter('');
    setAmountRange({ min: '', max: '' });
    setSortBy('dateDesc');
  };

  // Get active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== 'All') count++;
    if (statusFilter !== 'All') count++;
    if (dateRange.start || dateRange.end) count++;
    if (paymentMethodFilter !== 'All') count++;
    if (stylistFilter !== 'All') count++;
    if (serviceFilter !== 'All') count++;
    if (clientFilter) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  }, [typeFilter, statusFilter, dateRange, paymentMethodFilter, stylistFilter, serviceFilter, clientFilter, amountRange]);



  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'In Service': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Voided': { color: 'bg-red-100 text-red-800', icon: XCircle },
      // Legacy statuses for backward compatibility
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Refunded': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig['In Service'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status}
      </span>
    );
  };

  // Type badge component
  const TypeBadge = ({ type }) => {
    const typeConfig = {
      'Service': { color: 'bg-blue-100 text-blue-800', icon: Scissors },
      'Product': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'Mixed': { color: 'bg-indigo-100 text-indigo-800', icon: DollarSign },
      'service': { color: 'bg-blue-100 text-blue-800', icon: Scissors },
      'product': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'mixed': { color: 'bg-indigo-100 text-indigo-800', icon: DollarSign }
    };
    
    const config = typeConfig[type] || typeConfig['Service'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {type?.charAt(0).toUpperCase() + type?.slice(1)}
      </span>
    );
  };

  // Open transaction details modal
  const openTransactionModal = async (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
    
    // Reset cached data
    setBranchName(null);
    setCreatedByName(null);
    setAppointmentInfo(null);
    
    // Fetch branch name
    if (transaction.branchId) {
      try {
        const { branchService } = await import('../../services/branchService');
        const branchInfo = await branchService.getBranch(transaction.branchId, userData?.roles?.[0] || 'branchManager', userData?.uid);
        if (branchInfo?.name) {
          setBranchName(branchInfo.name);
        }
      } catch (err) {
        console.warn('Could not fetch branch name:', err);
      }
    }
    
    // Fetch created by user name
    if (transaction.createdBy) {
      try {
        const { userService } = await import('../../services/userService');
        const userInfo = await userService.getUserById(transaction.createdBy);
        if (userInfo) {
          const fullName = `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim();
          setCreatedByName(fullName || userInfo.email || `User ${transaction.createdBy.slice(-4)}`);
        }
      } catch (err) {
        console.warn('Could not fetch created by user:', err);
      }
    }
    
    // Fetch appointment info if available
    if (transaction.appointmentId) {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../lib/firebase');
        const appointmentRef = doc(db, 'appointments', transaction.appointmentId);
        const appointmentDoc = await getDoc(appointmentRef);
        if (appointmentDoc.exists()) {
          const aptData = appointmentDoc.data();
          const appointmentDate = aptData.appointmentDate?.toDate ? aptData.appointmentDate.toDate() : new Date(aptData.appointmentDate);
          setAppointmentInfo({
            date: appointmentDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            time: aptData.appointmentTime || 'N/A',
            fullInfo: `${appointmentDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} at ${aptData.appointmentTime || 'N/A'}`
          });
        }
      } catch (err) {
        console.warn('Could not fetch appointment info:', err);
      }
    }
  };

  // Close modal
  const closeTransactionModal = () => {
    setShowDetailsModal(false);
    setSelectedTransaction(null);
    setBranchName(null);
    setCreatedByName(null);
    setAppointmentInfo(null);
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // React-to-print handler for transaction report (MUST be before early returns)
  const handlePrintReport = useReactToPrint({
    content: () => printReportRef.current,
    documentTitle: 'Transaction Report',
    onBeforeGetContent: async () => {
      // Fetch branch name before printing
      if (userData?.branchId) {
        try {
          const { branchService } = await import('../../services/branchService');
          const branchInfo = await branchService.getBranch(userData.branchId, 'branchManager', userData.uid);
          if (branchInfo?.name) setBranchName(branchInfo.name);
        } catch (err) {
          console.warn('Could not fetch branch name:', err);
        }
      }
    }
  });

  // React-to-print handler for receipt (MUST be before early returns)
  const handlePrintReceipt = useReactToPrint({
    content: () => printReceiptRef.current,
    documentTitle: `Receipt-${selectedTransaction?.id || 'Receipt'}`,
    onBeforeGetContent: async () => {
      // Fetch branch info before printing
      if (userData?.branchId && selectedTransaction) {
        try {
          const { branchService } = await import('../../services/branchService');
          const branchInfo = await branchService.getBranch(userData.branchId, 'branchManager', userData.uid);
          if (branchInfo) {
            setBranchName(branchInfo.name || 'Branch');
          }
        } catch (err) {
          console.warn('Could not fetch branch info:', err);
        }
      }
    }
  });

  if (loading) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="p-8 max-w-2xl w-full">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Transactions</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                <p className="text-sm text-red-700 break-words">{error}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-xs font-medium text-gray-700 mb-2">Debug Information:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>Branch ID: {userData?.branchId || 'Not available'}</li>
                  <li>User Role: {userData?.roles?.[0] || userData?.role || 'Not available'}</li>
                  <li>All Roles: {userData?.roles ? userData.roles.join(', ') : 'Not available'}</li>
                  <li>User ID: {userData?.uid || 'Not available'}</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => {
                    setError(null);
                    loadTransactions(1, true);
                  }}
                  className="bg-[#160B53] hover:bg-[#12094A] text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => {
                    console.log('User Data:', userData);
                    console.log('Current Error:', error);
                    alert('Error details logged to console. Check browser developer tools.');
                  }}
                  variant="outline"
                  className="border-gray-300"
                >
                  View Logs
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Export to Excel function
  const exportToExcel = async (rows = filteredTransactions, filename = "transactions.xlsx") => {
    if (!rows.length) {
      alert("No data to export.");
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = rows.map((transaction, index) => {
        const clientInfo = transaction.clientInfo || {};
        const services = transaction.services || [];
        const products = transaction.products || [];
        
        return {
          'Row #': index + 1,
          'Transaction ID': transaction.id || 'N/A',
          'Appointment ID': transaction.appointmentId || 'N/A',
          'Client Name': clientInfo.name || transaction.clientName || 'N/A',
          'Client Email': clientInfo.email || 'N/A',
          'Client Phone': clientInfo.phone || 'N/A',
          'Services': services.map(s => s.serviceName || s.name || 'N/A').join('; '),
          'Stylists': services.map(s => s.stylistName || 'N/A').join('; '),
          'Products': products.map(p => `${p.name} (Qty: ${p.quantity})`).join('; '),
          'Subtotal': transaction.subtotal || 0,
          'Tax': transaction.tax || 0,
          'Discount': transaction.discount || 0,
          'Total': transaction.total || transaction.totalAmount || 0,
          'Payment Method': transaction.paymentMethod || 'N/A',
          'Status': transaction.status || 'N/A',
          'Transaction Type': transaction.transactionType || transaction.type || 'N/A',
          'Created At': formatDate(transaction.createdAt),
          'Updated At': transaction.updatedAt ? formatDate(transaction.updatedAt) : 'N/A',
          'Notes': transaction.notes || 'N/A',
          'Loyalty Earned': transaction.loyaltyEarned || 0
        };
      });
      
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const finalFilename = filename.includes('.xlsx') ? filename : `${filename}_${date}.xlsx`;
      
      // Download
      XLSX.writeFile(workbook, finalFilename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export to Excel. Please try again.');
    }
  };

  // Print transaction report
  const printTransactionReport = () => {
    handlePrintReport();
  };

  // Reprint receipt for individual transaction
  const reprintReceipt = async (transaction) => {
    try {
      setSelectedTransaction(transaction);
      // Small delay to ensure state is set before printing
      setTimeout(() => {
        handlePrintReceipt();
      }, 100);
    } catch (error) {
      console.error('Error reprinting receipt:', error);
      alert('Failed to reprint receipt. Please try again.');
    }
  };

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Transactions">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Simple Summary === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-full">
                <Receipt className="h-6 w-6 text-green-600"/>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Transactions</p>
                <p className="text-2xl font-semibold">{transactions.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600"/>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold">₱{transactions.reduce((sum, t) => sum + (t.total || t.totalAmount || 0), 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-full">
                <CheckCircle className="h-6 w-6 text-purple-600"/>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-semibold">{transactions.filter(t => t.status === 'Paid' || t.status === 'Completed').length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* === Filter + Actions === */}
        <Card className="p-4">
          {/* Top Row: Actions and Quick Filters */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
            {/* Left Side: Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={() => exportToExcel(filteredTransactions, `transactions_${new Date().toISOString().split('T')[0]}.xlsx`)}
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" /> Export All
              </Button>
              <Button
                onClick={printTransactionReport}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <Printer className="h-4 w-4" /> Print Report
              </Button>
              <Button
                onClick={() => setShowAdvancedFilters(true)}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-[#160B53] text-white text-xs rounded-full px-2 py-0.5">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>
            
            {/* Center: Search, Stylist Filter, and Sort */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <Search className="absolute left-3 top-8 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions, clients, services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                />
              </div>
              
              {/* Stylist Filter Dropdown */}
              <div className="min-w-[180px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Stylist</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={stylistFilter}
                    onChange={(e) => setStylistFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] appearance-none bg-white"
                  >
                    {stylists.length > 1 ? (
                      stylists.map(stylist => (
                        <option key={stylist} value={stylist}>{stylist}</option>
                      ))
                    ) : (
                      <option value="All">No stylists found</option>
                    )}
                  </select>
                </div>
              </div>
              
              {/* Sort Dropdown */}
              <div className="min-w-[150px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] appearance-none bg-white"
                  >
                    <option value="dateDesc">Newest First</option>
                    <option value="dateAsc">Oldest First</option>
                    <option value="amountDesc">Highest Amount</option>
                    <option value="amountAsc">Lowest Amount</option>
                    <option value="clientAsc">Client Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-medium text-gray-700 self-center">Quick Date:</span>
            {['All', 'Today', 'Last 7 Days', 'Last 30 Days', 'This Week', 'This Month', 'Last Month'].map(preset => (
              <Button
                key={preset}
                variant={datePreset === preset ? "default" : "outline"}
                size="sm"
                onClick={() => applyDatePreset(preset)}
                className={`text-xs ${datePreset === preset ? 'bg-[#160B53] text-white' : ''}`}
              >
                {preset}
              </Button>
            ))}
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-xs font-medium text-gray-700">Active Filters:</span>
              {typeFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Type: {typeFilter}
                  <button onClick={() => setTypeFilter('All')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('All')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(dateRange.start || dateRange.end) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Date: {dateRange.start || 'Start'} to {dateRange.end || 'End'}
                  <button onClick={() => { setDateRange({ start: '', end: '' }); setDatePreset('All'); }} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {paymentMethodFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Payment: {paymentMethodFilter}
                  <button onClick={() => setPaymentMethodFilter('All')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {stylistFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Stylist: {stylistFilter}
                  <button onClick={() => setStylistFilter('All')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {serviceFilter !== 'All' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Service: {serviceFilter}
                  <button onClick={() => setServiceFilter('All')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {clientFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Client: {clientFilter}
                  <button onClick={() => setClientFilter('')} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(amountRange.min || amountRange.max) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Amount: {amountRange.min || '0'} - {amountRange.max || '∞'}
                  <button onClick={() => setAmountRange({ min: '', max: '' })} className="hover:text-blue-600">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <div>
              Showing <span className="font-semibold text-gray-900">{paginatedTransactions.length}</span> of{' '}
              <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> transactions
              {filteredTransactions.length !== transactions.length && (
                <span className="text-blue-600 ml-2">
                  (filtered from {transactions.length} total)
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* === Transactions Table === */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                        <p className="text-gray-500 mb-4">
                          {filteredTransactions.length === 0 
                            ? "Try adjusting your search or filter criteria"
                            : "No transactions match your current filters"
                          }
                        </p>
                        <Button
                          onClick={() => {
                            setSearchTerm('');
                            setTypeFilter('All');
                            setStatusFilter('All');
                          }}
                          className="bg-[#160B53] hover:bg-[#12094A] text-white"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction, index) => {
                    const clientInfo = transaction.clientInfo || {};
                    const services = transaction.services || [];
                    const products = transaction.products || [];
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <Receipt className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                              <div className="ml-3 min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {transaction.id || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  <TypeBadge type={transaction.transactionType || transaction.type} />
                                </div>
                                {transaction.appointmentId && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    Apt: {transaction.appointmentId}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                {clientInfo.name || transaction.clientName || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-600">
                                {clientInfo.email || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {clientInfo.phone || 'N/A'}
                              </div>
                              <div className="text-xs text-blue-600">
                                ID: {transaction.clientId || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {services.length > 0 ? (
                              <div className="space-y-1">
                                {services.map((service, idx) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {service.serviceName || service.name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Stylist: {service.stylistName || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ₱{service.price?.toLocaleString() || '0.00'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No services</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {products.length > 0 ? (
                              <div className="space-y-1">
                                {products.slice(0, 2).map((product, idx) => (
                                  <div key={idx} className="text-sm">
                                    <div className="font-medium text-gray-900">
                                      {product.name || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Qty: {product.quantity || 0} × ₱{product.price?.toLocaleString() || '0.00'}
                                    </div>
                                  </div>
                                ))}
                                {products.length > 2 && (
                                  <div className="text-xs text-blue-600">
                                    +{products.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No products</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900">
                                ₱{transaction.total?.toLocaleString() || transaction.totalAmount?.toLocaleString() || '0.00'}
                              </div>
                              <div className="text-xs text-gray-600">
                                Subtotal: ₱{transaction.subtotal?.toLocaleString() || '0.00'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Tax: ₱{transaction.tax?.toLocaleString() || '0.00'}
                              </div>
                              {transaction.discount > 0 && (
                                <div className="text-xs text-green-600">
                                  Discount: ₱{transaction.discount?.toLocaleString() || '0.00'}
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {transaction.paymentMethod || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <StatusBadge status={transaction.status || 'pending'} />
                              <div className="text-xs text-gray-500">
                                {formatDate(transaction.createdAt)}
                              </div>
                              {transaction.updatedAt && (
                                <div className="text-xs text-gray-500">
                                  Updated: {formatDate(transaction.updatedAt)}
                                </div>
                              )}
                              {transaction.loyaltyEarned > 0 && (
                                <div className="text-xs text-purple-600">
                                  {transaction.loyaltyEarned} pts
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTransactionModal(transaction);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reprintReceipt(transaction);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Printer className="h-3 w-3" />
                                Print
                              </Button>
                            </div>
                          </td>
                        </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Enhanced Pagination Controls with Infinite Scroll */}
          <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              {/* Top row: Items per page and page info */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                      loadTransactions(1, true);
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                  <span className="text-xs text-gray-600">per page</span>
                </div>

                <div className="text-xs text-gray-600">
                  Showing <span className="font-medium">{transactions.length}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> total transactions
                  {hasMore && <span className="text-blue-600 ml-2">(More available)</span>}
                </div>
              </div>

              {/* Bottom row: Navigation buttons and Load More */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Prev
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 text-xs min-w-[32px] ${
                          currentPage === pageNum 
                            ? 'bg-[#160B53] text-white' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-xs min-w-[40px]"
                >
                  Last
                </Button>

                {/* Load More Button for Infinite Scroll */}
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
                        Loading...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        Load More
                      </div>
                    )}
                  </Button>
                )}
              </div>

              {/* Performance indicator */}
              <div className="text-center">
                <div className="text-xs text-gray-500">
                  {transactions.length > 1000 && (
                    <span className="text-green-600">
                      ⚡ Optimized for large datasets ({transactions.length.toLocaleString()} records)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* === Transaction Details Modal === */}
        {showDetailsModal && selectedTransaction && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 p-4"
            onClick={closeTransactionModal}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Transaction Details</h2>
                      <p className="text-white/80 text-sm">Transaction ID: {selectedTransaction.id || 'N/A'}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeTransactionModal}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {(() => {
                  const transaction = selectedTransaction;
                  const clientInfo = transaction.clientInfo || {};
                  const services = transaction.services || [];
                  const products = transaction.products || [];
                  
                  return (
                    <div className="space-y-6">
                      {/* Top Summary Bar */}
                      <div className="bg-gradient-to-r from-[#160B53]/5 to-[#12094A]/5 rounded-lg p-6 border border-[#160B53]/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Left: Client & Status */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Client</p>
                              <p className="text-lg font-bold text-gray-900">{clientInfo.name || transaction.clientName || 'N/A'}</p>
                              {clientInfo.phone && (
                                <p className="text-sm text-gray-600 mt-1">{clientInfo.phone}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={transaction.status || 'pending'} />
                              <TypeBadge type={transaction.transactionType || transaction.type} />
                            </div>
                          </div>
                          
                          {/* Center: Transaction Info */}
                          <div className="space-y-3 border-l border-r border-gray-200 px-6">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                              <p className="text-sm font-mono text-gray-700">{transaction.id || 'N/A'}</p>
                            </div>
                            {transaction.appointmentId && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Appointment</p>
                                <p className="text-sm text-gray-900">
                                  {appointmentInfo ? appointmentInfo.fullInfo : transaction.appointmentId}
                                </p>
                              </div>
                            )}
                            {branchName && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Branch</p>
                                <p className="text-sm text-gray-900">{branchName}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Right: Financial Summary */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                              <p className="text-2xl font-bold text-[#160B53]">
                                ₱{(transaction.total || transaction.totalAmount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Payment:</span>
                              <span className="font-medium text-gray-900">{transaction.paymentMethod || 'Cash'}</span>
                            </div>
                            {transaction.loyaltyEarned > 0 && (
                              <div className="flex items-center gap-1 text-sm">
                                <span className="text-purple-600 font-medium">⭐ {transaction.loyaltyEarned} points earned</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Main Content Grid - Two Columns */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Services & Products */}
                        <div className="space-y-6">
                          {/* Services */}
                          {services.length > 0 && (
                            <Card className="p-5">
                              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                  <Scissors className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Services</h4>
                                  <p className="text-xs text-gray-500">{services.length} service{services.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {services.map((service, idx) => (
                                  <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{service.serviceName || service.name || 'N/A'}</p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Stylist:</span> {service.stylistName || 'N/A'}
                                      </p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="font-bold text-[#160B53] text-lg">₱{service.price?.toLocaleString() || '0.00'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}

                          {/* Products */}
                          {products.length > 0 && (
                            <Card className="p-5">
                              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                  <Package className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Products</h4>
                                  <p className="text-xs text-gray-500">{products.length} product{products.length !== 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                {products.map((product, idx) => (
                                  <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex-1">
                                      <p className="font-semibold text-gray-900">{product.name || 'N/A'}</p>
                                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                        <span>Qty: <span className="font-medium">{product.quantity || 0}</span></span>
                                        <span>× ₱{product.price?.toLocaleString() || '0.00'}</span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className="font-bold text-[#160B53] text-lg">
                                        ₱{((product.price || 0) * (product.quantity || 1)).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          )}
                        </div>

                        {/* Right Column: Details & Financial Breakdown */}
                        <div className="space-y-6">
                          {/* Financial Breakdown */}
                          <Card className="p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                              <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-green-600" />
                              </div>
                              <h4 className="font-semibold text-gray-900">Financial Breakdown</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">₱{transaction.subtotal?.toLocaleString() || '0.00'}</span>
                              </div>
                              {transaction.tax > 0 && (
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-600">Tax</span>
                                  <span className="font-medium text-gray-900">₱{transaction.tax?.toLocaleString() || '0.00'}</span>
                                </div>
                              )}
                              {transaction.discount > 0 && (
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-gray-600">Discount</span>
                                  <span className="font-medium text-green-600">-₱{transaction.discount?.toLocaleString() || '0.00'}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-gray-300">
                                <span className="text-lg font-semibold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-[#160B53]">
                                  ₱{(transaction.total || transaction.totalAmount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </Card>

                          {/* Transaction Information */}
                          <Card className="p-5">
                            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Receipt className="h-5 w-5 text-blue-600" />
                              </div>
                              <h4 className="font-semibold text-gray-900">Transaction Information</h4>
                            </div>
                            <div className="space-y-3 text-sm">
                              {transaction.clientId && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Client</span>
                                  <span className="font-medium text-gray-900 text-right">
                                    {clientInfo.name || transaction.clientName || transaction.clientId}
                                  </span>
                                </div>
                              )}
                              {clientInfo.email && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Email</span>
                                  <span className="font-medium text-gray-900 text-right">{clientInfo.email}</span>
                                </div>
                              )}
                              {clientInfo.phone && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Phone</span>
                                  <span className="font-medium text-gray-900 text-right">{clientInfo.phone}</span>
                                </div>
                              )}
                              {transaction.createdBy && (
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                  <span className="text-gray-600">Created By</span>
                                  <span className="font-medium text-gray-900 text-right">
                                    {createdByName || transaction.createdBy}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-600">Created At</span>
                                <span className="font-medium text-gray-900 text-right">{formatDate(transaction.createdAt)}</span>
                              </div>
                              {transaction.updatedAt && (
                                <div className="flex justify-between py-2">
                                  <span className="text-gray-600">Updated At</span>
                                  <span className="font-medium text-gray-900 text-right">{formatDate(transaction.updatedAt)}</span>
                                </div>
                              )}
                            </div>
                          </Card>

                          {/* Additional Info */}
                          {transaction.notes && (
                            <Card className="p-5">
                              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                  <FileText className="h-5 w-5 text-indigo-600" />
                                </div>
                                <h4 className="font-semibold text-gray-900">Notes</h4>
                              </div>
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-sm text-gray-700">{transaction.notes}</p>
                              </div>
                            </Card>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
                <Button
                  onClick={() => {
                    if (selectedTransaction) {
                      exportToExcel([selectedTransaction], `transaction_${selectedTransaction.id}.xlsx`);
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" /> Export to Excel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedTransaction) {
                      reprintReceipt(selectedTransaction);
                    }
                  }}
                  className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                >
                  <Printer className="h-4 w-4" /> Reprint Receipt
                </Button>
                <Button
                  onClick={closeTransactionModal}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === Advanced Filters Modal === */}
        <Modal
          isOpen={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          title="Advanced Filters"
          size="xl"
        >
          <div className="space-y-6">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }));
                      setDatePreset('Custom');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }));
                      setDatePreset('Custom');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Stylist Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stylist</label>
              <select
                value={stylistFilter}
                onChange={(e) => setStylistFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                {stylists.map(stylist => (
                  <option key={stylist} value={stylist}>{stylist}</option>
                ))}
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                {services.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
              <input
                type="text"
                placeholder="Search by client name..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              />
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min Amount (₱)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Amount (₱)</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear All
              </Button>
              <Button
                onClick={() => setShowAdvancedFilters(false)}
                className="bg-[#160B53] text-white hover:bg-[#12094A]"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      {/* Hidden Print Components */}
      {/* Transaction Report Print Component */}
      {paginatedTransactions && paginatedTransactions.length > 0 && (
        <div style={{ display: 'none' }}>
          <div ref={printReportRef} style={{ padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
          <style>{`
            @page { margin: 1cm; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #160B53; padding-bottom: 10px; }
            .header h1 { color: #160B53; margin: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #160B53; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-top: 20px; padding: 10px; background-color: #f0f0f0; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #666; }
          `}</style>
          <div className="header">
            <h1>Transaction Report</h1>
            <p><strong>{branchName || 'Branch'}</strong></p>
            <p>Generated on {new Date().toLocaleString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Client</th>
                <th>Total</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map(t => {
                const clientInfo = t.clientInfo || {};
                return (
                  <tr key={t.id}>
                    <td>{t.id || 'N/A'}</td>
                    <td>{clientInfo.name || t.clientName || 'N/A'}</td>
                    <td>₱{(t.total || t.totalAmount || 0).toLocaleString()}</td>
                    <td>{t.paymentMethod || 'N/A'}</td>
                    <td>{t.status || 'N/A'}</td>
                    <td>{formatDate(t.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="summary">
            <p><strong>Summary:</strong></p>
            <p>Total Transactions: {paginatedTransactions.length}</p>
            <p>Total Revenue: ₱{paginatedTransactions.reduce((sum, t) => sum + (t.total || t.totalAmount || 0), 0).toLocaleString()}</p>
          </div>
          <div className="footer">
            <p>This report was generated by Salon Management System</p>
          </div>
        </div>
        </div>
      )}

      {/* Receipt Print Component */}
      {selectedTransaction && (
        <div style={{ display: 'none' }}>
          <div ref={printReceiptRef} style={{ 
            fontFamily: "'Courier New', monospace",
            fontSize: '9px',
            width: '48mm',
            maxWidth: '48mm',
            margin: '0',
            padding: '2mm',
            lineHeight: '1.2'
          }}>
            <style>{`
              @page {
                margin: 0;
                size: 48mm 58mm;
              }
              @media print {
                body {
                  width: 48mm;
                  max-width: 48mm;
                }
                @page {
                  margin: 0;
                  size: 48mm 58mm;
                }
              }
            `}</style>
            {(() => {
              const transaction = selectedTransaction;
              const clientInfo = transaction.clientInfo || {};
              const services = transaction.services || [];
              const products = transaction.products || [];
              const currentBranchName = branchName || 'Branch';
              
              return (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '3mm', paddingBottom: '2mm', borderBottom: '1px dashed #000' }}>
                    <h2 style={{ margin: 0, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {currentBranchName}
                    </h2>
                    <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }}></div>
                    <p style={{ margin: '1px 0', fontSize: '7px' }}><strong>RECEIPT</strong></p>
                    <p style={{ margin: '1px 0', fontSize: '7px' }}>ID: {(transaction.id || 'N/A').substring(0, 12)}</p>
                    <p style={{ margin: '1px 0', fontSize: '7px' }}>{formatDate(transaction.createdAt)}</p>
                  </div>
                  
                  <div style={{ margin: '2mm 0', fontSize: '8px' }}>
                    <p style={{ margin: '1px 0' }}><strong>Client:</strong> {(clientInfo.name || transaction.clientName || 'Walk-in').substring(0, 25)}</p>
                    {clientInfo.phone && <p style={{ margin: '1px 0' }}>Tel: {clientInfo.phone}</p>}
                  </div>
                  
                  <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }}></div>
                  
                  <div style={{ margin: '2mm 0' }}>
                    {services.map((s, idx) => {
                      const serviceName = (s.serviceName || s.name || 'Service').substring(0, 20);
                      return (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                            <span style={{ flex: 1, wordBreak: 'break-word' }}>{serviceName}</span>
                            <span style={{ textAlign: 'right', marginLeft: '2mm', whiteSpace: 'nowrap' }}>
                              ₱{(s.price || 0).toLocaleString()}
                            </span>
                          </div>
                          {s.stylistName && (
                            <div style={{ fontSize: '7px', color: '#666', marginLeft: '2mm', marginBottom: '1px' }}>
                              Stylist: {s.stylistName.substring(0, 18)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {products.map((p, idx) => {
                      const productName = (p.name || 'Product').substring(0, 18);
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                          <span style={{ flex: 1, wordBreak: 'break-word' }}>{productName} x{p.quantity || 1}</span>
                          <span style={{ textAlign: 'right', marginLeft: '2mm', whiteSpace: 'nowrap' }}>
                            ₱{((p.price || 0) * (p.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div style={{ marginTop: '3mm', paddingTop: '2mm', borderTop: '2px solid #000' }}>
                    {transaction.subtotal && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                        <span>Subtotal:</span>
                        <span>₱{transaction.subtotal.toLocaleString()}</span>
                      </div>
                    )}
                    {transaction.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                        <span>Discount:</span>
                        <span>-₱{transaction.discount.toLocaleString()}</span>
                      </div>
                    )}
                    {transaction.tax > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                        <span>Tax:</span>
                        <span>₱{transaction.tax.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '10px', fontWeight: 'bold', marginTop: '2px', paddingTop: '2px', borderTop: '1px solid #000' }}>
                      <span>TOTAL:</span>
                      <span>₱{(transaction.total || transaction.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px', marginTop: '2px' }}>
                      <span>Payment:</span>
                      <span>{transaction.paymentMethod || 'Cash'}</span>
                    </div>
                    {transaction.loyaltyEarned > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1px 0', fontSize: '8px' }}>
                        <span>Points:</span>
                        <span>{transaction.loyaltyEarned}</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ borderTop: '1px dashed #000', margin: '2mm 0' }}></div>
                  
                  <div style={{ textAlign: 'center', marginTop: '3mm', paddingTop: '2mm', borderTop: '1px dashed #000', fontSize: '7px', color: '#666' }}>
                    <p style={{ margin: '1px 0' }}>Thank you!</p>
                    <p style={{ margin: '1px 0' }}>REPRINT</p>
                    <p style={{ margin: '1px 0' }}>
                      {new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default BranchManagerTransactions;
