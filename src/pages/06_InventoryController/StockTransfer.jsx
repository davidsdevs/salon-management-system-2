// src/pages/06_InventoryController/StockTransfer.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import { 
  ArrowRightLeft,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Package, 
  Calendar,
  Building,
  FileText,
  Truck,
  ArrowRight,
  Minus,
  Trash2,
  MapPin,
  Home, 
  TrendingUp,
  QrCode,
  ShoppingCart, 
  BarChart3, 
  DollarSign,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';

const StockTransfer = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/inventory/dashboard', label: 'Dashboard', icon: Home },
    { path: '/inventory/products', label: 'Products', icon: Package },
    { path: '/inventory/stocks', label: 'Stocks', icon: TrendingUp },
    { path: '/inventory/stock-transfer', label: 'Stock Transfer', icon: ArrowRightLeft },
    { path: '/inventory/upc-generator', label: 'UPC Generator', icon: QrCode },
    { path: '/inventory/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/inventory/suppliers', label: 'Suppliers', icon: Truck },
    { path: '/inventory/stock-alerts', label: 'Stock Alerts', icon: AlertTriangle },
    { path: '/inventory/reports', label: 'Reports', icon: BarChart3 },
    { path: '/inventory/cost-analysis', label: 'Cost Analysis', icon: DollarSign },
    { path: '/inventory/inventory-audit', label: 'Inventory Audit', icon: ClipboardList },
    { path: '/inventory/expiry-tracker', label: 'Expiry Tracker', icon: Calendar },
    { path: '/inventory/profile', label: 'Profile', icon: UserCog },
  ];
  
  // Data states
  const [transfers, setTransfers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFromBranch, setSelectedFromBranch] = useState('all');
  const [selectedToBranch, setSelectedToBranch] = useState('all');
  const [sortBy, setSortBy] = useState('transferDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    fromBranch: 'all',
    toBranch: 'all',
    dateRange: { start: '', end: '' }
  });

  // Form states
  const [formData, setFormData] = useState({
    fromBranchId: '',
    toBranchId: '',
    transferDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    reason: '',
    notes: '',
    items: []
  });

  // Mock transfer data
  const mockTransfers = [
    {
      id: 'TR-2024-001',
      fromBranchId: 'branch1',
      fromBranchName: 'Harbor Point Ayala',
      toBranchId: 'branch2',
      toBranchName: 'SM Mall of Asia',
      transferDate: new Date('2024-01-15'),
      expectedDelivery: new Date('2024-01-17'),
      actualDelivery: null,
      status: 'In Transit',
      reason: 'Stock Rebalancing',
      totalItems: 15,
      totalValue: 25000,
      items: [
        { productId: 'prod1', productName: 'Olaplex No.3 Hair Perfector', quantity: 10, unitCost: 1400, totalCost: 14000 },
        { productId: 'prod2', productName: 'L\'Oréal Hair Color', quantity: 5, unitCost: 800, totalCost: 4000 }
      ],
      notes: 'Urgent transfer needed',
      createdBy: 'John Smith',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'TR-2024-002',
      fromBranchId: 'branch2',
      fromBranchName: 'SM Mall of Asia',
      toBranchId: 'branch3',
      toBranchName: 'Greenbelt 5',
      transferDate: new Date('2024-01-10'),
      expectedDelivery: new Date('2024-01-12'),
      actualDelivery: new Date('2024-01-11'),
      status: 'Completed',
      reason: 'Overstock',
      totalItems: 8,
      totalValue: 12000,
      items: [
        { productId: 'prod3', productName: 'Kerastase Shampoo', quantity: 8, unitCost: 1500, totalCost: 12000 }
      ],
      notes: 'Regular stock rebalancing',
      createdBy: 'Maria Santos',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-11')
    },
    {
      id: 'TR-2024-003',
      fromBranchId: 'branch1',
      fromBranchName: 'Harbor Point Ayala',
      toBranchId: 'branch2',
      toBranchName: 'SM Mall of Asia',
      transferDate: new Date('2024-01-05'),
      expectedDelivery: new Date('2024-01-07'),
      actualDelivery: null,
      status: 'Pending',
      reason: 'Emergency Stock',
      totalItems: 12,
      totalValue: 18000,
      items: [
        { productId: 'prod4', productName: 'Wella Hair Color', quantity: 12, unitCost: 1500, totalCost: 18000 }
      ],
      notes: 'Emergency restock for weekend rush',
      createdBy: 'Carlos Mendoza',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-05')
    }
  ];

  // Mock branches and products
  const mockBranches = [
    { id: 'branch1', name: 'Harbor Point Ayala', address: 'Harbor Point, Ayala Center, Makati City' },
    { id: 'branch2', name: 'SM Mall of Asia', address: 'SM Mall of Asia, Pasay City' },
    { id: 'branch3', name: 'Greenbelt 5', address: 'Greenbelt 5, Makati City' }
  ];

  const mockProducts = [
    { id: 'prod1', name: 'Olaplex No.3 Hair Perfector', unitCost: 1400 },
    { id: 'prod2', name: 'L\'Oréal Hair Color', unitCost: 800 },
    { id: 'prod3', name: 'Kerastase Shampoo', unitCost: 1500 },
    { id: 'prod4', name: 'Wella Hair Color', unitCost: 1500 }
  ];

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data
      setTransfers(mockTransfers);
      setBranches(mockBranches);
      setProducts(mockProducts);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter and sort transfers
  const filteredTransfers = transfers
    .filter(transfer => {
      const matchesSearch = transfer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.fromBranchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.toBranchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transfer.reason.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || transfer.status === filters.status;
      const matchesFromBranch = filters.fromBranch === 'all' || transfer.fromBranchId === filters.fromBranch;
      const matchesToBranch = filters.toBranch === 'all' || transfer.toBranchId === filters.toBranch;
      
      const matchesDateRange = (!filters.dateRange.start || new Date(transfer.transferDate) >= new Date(filters.dateRange.start)) &&
                              (!filters.dateRange.end || new Date(transfer.transferDate) <= new Date(filters.dateRange.end));
      
      return matchesSearch && matchesStatus && matchesFromBranch && matchesToBranch && matchesDateRange;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'transferDate' || sortBy === 'expectedDelivery' || sortBy === 'actualDelivery' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle transfer details
  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setIsDetailsModalOpen(true);
  };

  // Handle edit transfer
  const handleEditTransfer = (transfer) => {
    setSelectedTransfer(transfer);
    setFormData({
      fromBranchId: transfer.fromBranchId,
      toBranchId: transfer.toBranchId,
      transferDate: transfer.transferDate.toISOString().split('T')[0],
      expectedDelivery: transfer.expectedDelivery.toISOString().split('T')[0],
      reason: transfer.reason,
      notes: transfer.notes,
      items: transfer.items
    });
    setIsEditModalOpen(true);
  };

  // Handle create transfer
  const handleCreateTransfer = () => {
    setFormData({
      fromBranchId: '',
      toBranchId: '',
      transferDate: new Date().toISOString().split('T')[0],
      expectedDelivery: '',
      reason: '',
      notes: '',
      items: []
    });
    setIsCreateModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Add item to transfer
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitCost: 0, totalCost: 0 }]
    }));
  };

  // Remove item from transfer
  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Update item in transfer
  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitCost') {
            updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'In Transit': return 'text-blue-600 bg-blue-100';
      case 'Completed': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'In Transit': return <Truck className="h-4 w-4" />;
      case 'Completed': return <CheckCircle className="h-4 w-4" />;
      case 'Cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate transfer statistics
  const transferStats = {
    totalTransfers: transfers.length,
    pendingTransfers: transfers.filter(t => t.status === 'Pending').length,
    inTransitTransfers: transfers.filter(t => t.status === 'In Transit').length,
    completedTransfers: transfers.filter(t => t.status === 'Completed').length,
    totalValue: transfers.reduce((sum, t) => sum + t.totalValue, 0)
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading transfer data...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Transfer Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadData} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Stock Transfer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Transfer</h1>
            <p className="text-gray-600">Transfer inventory between branches</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleCreateTransfer} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Transfer
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <ArrowRightLeft className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Transfers</p>
                <p className="text-xl font-bold text-gray-900">{transferStats.totalTransfers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{transferStats.pendingTransfers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Truck className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-xl font-bold text-gray-900">{transferStats.inTransitTransfers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-xl font-bold text-gray-900">{transferStats.completedTransfers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">₱{transferStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by transfer ID, branches, or reason..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select
                value={filters.fromBranch}
                onChange={(e) => setFilters(prev => ({ ...prev, fromBranch: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">From Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <select
                value={filters.toBranch}
                onChange={(e) => setFilters(prev => ({ ...prev, toBranch: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">To Branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => setFilters({
                  status: 'all',
                  fromBranch: 'all',
                  toBranch: 'all',
                  dateRange: { start: '', end: '' }
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Transfers Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transfer Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{transfer.id}</div>
                      <div className="text-xs text-gray-500">by {transfer.createdBy}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transfer.fromBranchName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transfer.toBranchName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(transfer.transferDate), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-gray-500">Expected: {format(new Date(transfer.expectedDelivery), 'MMM dd')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                        {getStatusIcon(transfer.status)}
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transfer.totalItems} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₱{transfer.totalValue.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(transfer)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTransfer(transfer)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State */}
        {filteredTransfers.length === 0 && (
          <Card className="p-12 text-center">
            <ArrowRightLeft className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transfers Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first stock transfer'
              }
            </p>
            <Button onClick={handleCreateTransfer} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Create Transfer
            </Button>
          </Card>
        )}

        {/* Transfer Details Modal */}
        {isDetailsModalOpen && selectedTransfer && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedTransfer(null);
            }}
            title="Transfer Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Transfer Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedTransfer.id}</h2>
                  <p className="text-gray-600">{selectedTransfer.reason}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTransfer.status)}`}>
                  {getStatusIcon(selectedTransfer.status)}
                  {selectedTransfer.status}
                </span>
              </div>

              {/* Transfer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">From Branch</label>
                    <p className="text-gray-900">{selectedTransfer.fromBranchName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">To Branch</label>
                    <p className="text-gray-900">{selectedTransfer.toBranchName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transfer Date</label>
                    <p className="text-gray-900">{format(new Date(selectedTransfer.transferDate), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expected Delivery</label>
                    <p className="text-gray-900">{format(new Date(selectedTransfer.expectedDelivery), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  {selectedTransfer.actualDelivery && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Actual Delivery</label>
                      <p className="text-green-600">{format(new Date(selectedTransfer.actualDelivery), 'MMM dd, yyyy')}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <p className="text-2xl font-bold text-gray-900">₱{selectedTransfer.totalValue.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Number of Items</label>
                    <p className="text-gray-900">{selectedTransfer.totalItems} items</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="text-gray-900">{selectedTransfer.createdBy}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900">{selectedTransfer.notes || 'No notes'}</p>
                  </div>
                </div>
              </div>

              {/* Transfer Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Transfer Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedTransfer.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.productName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">₱{item.unitCost.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">₱{item.totalCost.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create/Edit Transfer Modal */}
        {(isCreateModalOpen || isEditModalOpen) && (
          <Modal
            isOpen={isCreateModalOpen || isEditModalOpen}
            onClose={() => {
              setIsCreateModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedTransfer(null);
            }}
            title={isCreateModalOpen ? 'Create Stock Transfer' : 'Edit Stock Transfer'}
            size="xl"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transfer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Branch *</label>
                  <select
                    value={formData.fromBranchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, fromBranchId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select From Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Branch *</label>
                  <select
                    value={formData.toBranchId}
                    onChange={(e) => setFormData(prev => ({ ...prev, toBranchId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select To Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Date *</label>
                  <Input
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, transferDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery *</label>
                  <Input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDelivery: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <select
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="Stock Rebalancing">Stock Rebalancing</option>
                    <option value="Overstock">Overstock</option>
                    <option value="Emergency Stock">Emergency Stock</option>
                    <option value="Seasonal Demand">Seasonal Demand</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <Input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Transfer Items</h3>
                  <Button type="button" onClick={addItem} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Unit Cost</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                        <Input
                          type="number"
                          value={item.totalCost}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {formData.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                )}
              </div>

              {/* Total */}
              {formData.items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        Total: ₱{formData.items.reduce((sum, item) => sum + item.totalCost, 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedTransfer(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isCreateModalOpen ? 'Create Transfer' : 'Update Transfer'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Advanced Filters Modal */}
        {isFilterModalOpen && (
          <Modal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            title="Advanced Filters"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  status: 'all',
                  fromBranch: 'all',
                  toBranch: 'all',
                  dateRange: { start: '', end: '' }
                })}>
                  Reset
                </Button>
                <Button onClick={() => setIsFilterModalOpen(false)}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StockTransfer;