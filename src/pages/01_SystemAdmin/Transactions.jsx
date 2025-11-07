import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
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
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  UserCog,
  Settings,
  BarChart3
} from 'lucide-react';

const Transactions = () => {
  const { userData } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // System Admin menu items (consistent across all pages)
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Building2 },
    { path: '/service-management', label: 'Services', icon: Scissors },
    { path: '/master-products', label: 'Master Products', icon: Package },
    { path: '/suppliers', label: 'Suppliers', icon: Building },
    { path: '/admin/transactions', label: 'Transactions', icon: DollarSign },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  // Mock data for frontend development
  const mockTransactions = [
    {
      id: 'TXN001',
      type: 'Service',
      customerName: 'Maria Santos',
      serviceName: 'Hair Cut & Style',
      stylistName: 'Ana Garcia',
      branchName: 'Ayala Branch',
      amount: 850,
      commission: 127.50,
      status: 'Completed',
      date: '2024-01-15T10:30:00Z',
      paymentMethod: 'Cash',
      items: [
        { name: 'Hair Cut & Style', price: 850, quantity: 1 }
      ]
    },
    {
      id: 'TXN002',
      type: 'Product',
      customerName: 'John Dela Cruz',
      serviceName: 'OTC Product Sale',
      stylistName: 'Carlos Reyes',
      branchName: 'Harbor Point Branch',
      amount: 450,
      commission: 67.50,
      status: 'Completed',
      date: '2024-01-15T14:15:00Z',
      paymentMethod: 'Card',
      items: [
        { name: 'L\'Oreal Professional Shampoo', price: 450, quantity: 1 }
      ]
    },
    {
      id: 'TXN003',
      type: 'Mixed',
      customerName: 'Sarah Johnson',
      serviceName: 'Color Treatment + Product',
      stylistName: 'Lisa Wong',
      branchName: 'Ayala Branch',
      amount: 1850,
      commission: 277.50,
      status: 'Completed',
      date: '2024-01-15T16:45:00Z',
      paymentMethod: 'Card',
      items: [
        { name: 'Hair Color Treatment', price: 1200, quantity: 1 },
        { name: 'Kerastase Deep Conditioning Mask', price: 650, quantity: 1 }
      ]
    },
    {
      id: 'TXN004',
      type: 'Service',
      customerName: 'Michael Brown',
      serviceName: 'Manicure & Pedicure',
      stylistName: 'Elena Rodriguez',
      branchName: 'Harbor Point Branch',
      amount: 600,
      commission: 90.00,
      status: 'Pending',
      date: '2024-01-16T09:00:00Z',
      paymentMethod: 'Cash',
      items: [
        { name: 'Manicure & Pedicure', price: 600, quantity: 1 }
      ]
    },
    {
      id: 'TXN005',
      type: 'Product',
      customerName: 'Jennifer Lee',
      serviceName: 'Multiple Product Sale',
      stylistName: 'Maria Santos',
      branchName: 'Ayala Branch',
      amount: 920,
      commission: 138.00,
      status: 'Completed',
      date: '2024-01-16T11:30:00Z',
      paymentMethod: 'Card',
      items: [
        { name: 'OPI Nail Polish', price: true, quantity: 2 },
        { name: 'Matrix Color Sync', price: 680, quantity: 1 }
      ]
    }
  ];

  // Load transactions (mock data for now)
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setTransactions(mockTransactions);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'All' || transaction.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || transaction.status === statusFilter;
    const matchesBranch = branchFilter === 'All' || transaction.branchName === branchFilter;
    
    // Date filtering (simplified for demo)
    const matchesDate = dateFilter === 'All' || true; // For demo purposes
    
    return matchesSearch && matchesType && matchesStatus && matchesBranch && matchesDate;
  });

  // Get unique values for filters
  const transactionTypes = ['All', ...new Set(transactions.map(t => t.type))];
  const transactionStatuses = ['All', 'Completed', 'Pending', 'Cancelled', 'Refunded'];
  const branches = ['All', ...new Set(transactions.map(t => t.branchName))];

  // Pagination calculations
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, branchFilter, dateFilter]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Refunded': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    };
    
    const config = statusConfig[status] || statusConfig['Pending'];
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
      'Mixed': { color: 'bg-indigo-100 text-indigo-800', icon: DollarSign }
    };
    
    const config = typeConfig[type] || typeConfig['Service'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {type}
      </span>
    );
  };

  // Calculate totals
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0);
  const completedTransactions = transactions.filter(t => t.status === 'Completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'Pending').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Transactions">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Summary Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><DollarSign className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-center">₱{totalRevenue.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><CheckCircle className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-center">{completedTransactions}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-50 rounded-full"><Clock className="h-6 w-6 text-yellow-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-semibold text-center">{pendingTransactions}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full"><DollarSign className="h-6 w-6 text-purple-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Commission</p>
              <p className="text-2xl font-semibold text-center">₱{totalCommission.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* === Filter + Actions === */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Left Side: Export Button */}
            <div className="flex-shrink-0">
              <Button
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm"
              >
                <Download className="h-4 w-4" /> Export Data
              </Button>
            </div>
            
            {/* Center: Search and Filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <Search className="absolute left-3 top-8 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex gap-2 flex-wrap">
                {/* Type Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    {transactionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {transactionStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                {/* Branch Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                  >
                    {branches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Right Side: Status Info */}
            <div className="flex-shrink-0">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg whitespace-nowrap">
                Showing <span className="font-semibold text-gray-900">{paginatedTransactions.length}</span> of <span className="font-semibold text-gray-900">{filteredTransactions.length}</span> transactions
                {filteredTransactions.length !== transactions.length && (
                  <span className="text-blue-600"> (filtered)</span>
                )}
                {searchTerm && ` for "${searchTerm}"`}
              </div>
            </div>
          </div>
        </Card>

        {/* === Transactions Table === */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Service/Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Stylist & Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Amount & Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Status & Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
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
                            setBranchFilter('All');
                          }}
                          className="bg-[#160B53] hover:bg-[#12094A] text-white"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                        <div className="ml-4 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.id}
                          </div>
                          <div className="text-sm text-gray-500">
                            <TypeBadge type={transaction.type} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="break-words">{transaction.customerName}</div>
                      <div className="text-xs text-gray-500">{transaction.paymentMethod}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.serviceName}</div>
                        {transaction.items && transaction.items.length > 1 && (
                          <div className="text-xs text-gray-500">
                            +{transaction.items.length - 1} more items
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-medium">{transaction.stylistName}</div>
                        <div className="text-xs text-gray-500">{transaction.branchName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="font-semibold text-[#160B53]">
                          ₱{transaction.amount?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-xs text-green-600">
                          Commission: ₱{transaction.commission?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <StatusBadge status={transaction.status} />
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleTimeString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
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
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-xs text-gray-600">per page</span>
                </div>

                <div className="text-xs text-gray-600">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </div>
              </div>

              {/* Bottom row: Navigation buttons */}
              <div className="flex items-center justify-center gap-1">
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
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage <= 2) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                      pageNum = totalPages - 2 + i;
                    } else {
                      pageNum = currentPage - 1 + i;
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
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
