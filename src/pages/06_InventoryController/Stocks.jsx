// src/pages/06_InventoryController/Stocks.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import { productService } from '../../services/productService';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { 
  Package, 
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
  Calendar,
  DollarSign,
  Tag,
  Building,
  Clock,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpDown,
  Package2,
  Activity,
  Home,
  ArrowRightLeft,
  QrCode,
  ShoppingCart,
  Truck,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';

const Stocks = () => {
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
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isCreateStockModalOpen, setIsCreateStockModalOpen] = useState(false);
  
  // Create stock form states
  const [createStockForm, setCreateStockForm] = useState({
    productId: '',
    beginningStock: '',
    startPeriod: '',
    endPeriod: '',
    weekTrackingMode: 'manual', // 'manual' or 'auto'
    weekOneStock: '',
    weekTwoStock: '',
    weekThreeStock: '',
    weekFourStock: '',
    endStockMode: 'manual', // 'manual' or 'auto'
    realTimeStock: ''
  });
  const [createStockErrors, setCreateStockErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    branch: 'all',
    status: 'all',
    category: 'all',
    stockRange: { min: '', max: '' },
    lowStock: false
  });

  // Mock stock data - in real app, this would come from API
  const mockStocks = [
    {
      id: '1',
      productId: 'prod1',
      productName: 'Olaplex No.3 Hair Perfector',
      brand: 'Olaplex',
      category: 'Hair Care',
      upc: '123456789114',
      currentStock: 45,
      minStock: 10,
      maxStock: 100,
      unitCost: 900,
      totalValue: 40500,
      lastUpdated: new Date('2024-01-15'),
      status: 'In Stock',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf A-1',
      supplier: 'Olaplex Philippines',
      lastRestocked: new Date('2024-01-10'),
      expiryDate: new Date('2025-12-31')
    },
    {
      id: '2',
      productId: 'prod2',
      productName: 'L\'Oréal Professional Hair Color',
      brand: 'L\'Oréal',
      category: 'Hair Color',
      upc: '123456789115',
      currentStock: 5,
      minStock: 15,
      maxStock: 50,
      unitCost: 1200,
      totalValue: 6000,
      lastUpdated: new Date('2024-01-14'),
      status: 'Low Stock',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf B-2',
      supplier: 'L\'Oréal Philippines',
      lastRestocked: new Date('2024-01-05'),
      expiryDate: new Date('2025-06-30')
    },
    {
      id: '3',
      productId: 'prod3',
      productName: 'Kerastase Shampoo',
      brand: 'Kerastase',
      category: 'Hair Care',
      upc: '123456789116',
      currentStock: 0,
      minStock: 5,
      maxStock: 30,
      unitCost: 800,
      totalValue: 0,
      lastUpdated: new Date('2024-01-13'),
      status: 'Out of Stock',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf C-1',
      supplier: 'Kerastase Philippines',
      lastRestocked: new Date('2024-01-01'),
      expiryDate: new Date('2025-03-15')
    }
  ];

  // Load stocks and products
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load products
      const productsResult = await productService.getAllProducts();
      if (productsResult.success) {
        setProducts(productsResult.products);
      }
      
      // Load stocks from Firestore for the current branch
      if (!userData?.branchId) {
        setStocks([]);
      } else {
        const stocksRef = collection(db, 'stocks');
        const q = query(stocksRef, where('branchId', '==', userData.branchId));
        const snapshot = await getDocs(q);
        const stocksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStocks(stocksData);
      }
      
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

  // Get unique branches
  const branches = [...new Set(stocks.map(s => s.branchName))].filter(Boolean);
  
  // Get unique categories
  const categories = [...new Set(stocks.map(s => s.category))].filter(Boolean);

  // Filter and sort stocks
  const filteredStocks = stocks
    .filter(stock => {
      const matchesSearch = stock.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           stock.upc.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesBranch = filters.branch === 'all' || stock.branchName === filters.branch;
      const matchesStatus = filters.status === 'all' || stock.status === filters.status;
      const matchesCategory = filters.category === 'all' || stock.category === filters.category;
      
      const matchesStockRange = (!filters.stockRange.min || stock.currentStock >= parseFloat(filters.stockRange.min)) &&
                               (!filters.stockRange.max || stock.currentStock <= parseFloat(filters.stockRange.max));
      
      const matchesLowStock = !filters.lowStock || stock.currentStock <= stock.minStock;
      
      return matchesSearch && matchesBranch && matchesStatus && matchesCategory && matchesStockRange && matchesLowStock;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'lastUpdated' || sortBy === 'lastRestocked' || sortBy === 'expiryDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle stock details
  const handleViewDetails = (stock) => {
    setSelectedStock(stock);
    setIsDetailsModalOpen(true);
  };

  // Handle stock adjustment
  const handleAdjustStock = (stock) => {
    setSelectedStock(stock);
    setIsAdjustModalOpen(true);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Stock': return <CheckCircle className="h-4 w-4" />;
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />;
      case 'Out of Stock': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate stock statistics
  const stockStats = {
    totalItems: stocks.length,
    inStock: stocks.filter(s => s.status === 'In Stock').length,
    lowStock: stocks.filter(s => s.status === 'Low Stock').length,
    outOfStock: stocks.filter(s => s.status === 'Out of Stock').length,
    totalValue: stocks.reduce((sum, s) => sum + s.totalValue, 0),
    lowStockItems: stocks.filter(s => s.currentStock <= s.minStock)
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading stock data...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Stock Data</h3>
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
    <DashboardLayout menuItems={menuItems} pageTitle="Stocks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600">Track inventory levels and stock movements</p>
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
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsCreateStockModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Create Stock
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-xl font-bold text-gray-900">{stockStats.totalItems}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-xl font-bold text-gray-900">{stockStats.inStock}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-xl font-bold text-gray-900">{stockStats.lowStock}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-xl font-bold text-gray-900">{stockStats.outOfStock}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">₱{stockStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by product name, brand, or UPC..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filters.branch}
                onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
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
                  branch: 'all',
                  status: 'all',
                  category: 'all',
                  stockRange: { min: '', max: '' },
                  lowStock: false
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Stock Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min/Max
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStocks.map((stock) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stock.productName}</div>
                        <div className="text-sm text-gray-500">{stock.brand} • {stock.upc}</div>
                        <div className="text-xs text-gray-400">{stock.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stock.currentStock}</div>
                      <div className="text-xs text-gray-500">units</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stock.minStock} / {stock.maxStock}</div>
                      <div className="text-xs text-gray-500">min / max</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(stock.status)}`}>
                        {getStatusIcon(stock.status)}
                        {stock.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₱{stock.totalValue.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">₱{stock.unitCost}/unit</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{stock.location}</div>
                      <div className="text-xs text-gray-500">{stock.branchName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(stock.lastUpdated), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-gray-500">{format(new Date(stock.lastUpdated), 'HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(stock)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAdjustStock(stock)}
                          className="flex items-center gap-1"
                        >
                          <ArrowUpDown className="h-3 w-3" />
                          Adjust
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
        {filteredStocks.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Items Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')
                ? 'Try adjusting your search or filters'
                : 'Get started by adding stock items'
              }
            </p>
            <Button className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Add Stock Item
            </Button>
          </Card>
        )}

        {/* Stock Details Modal */}
        {isDetailsModalOpen && selectedStock && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedStock(null);
            }}
            title="Stock Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Stock Header */}
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedStock.productName}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStock.status)}`}>
                      {getStatusIcon(selectedStock.status)}
                      {selectedStock.status}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mb-2">{selectedStock.brand}</p>
                  <p className="text-sm text-gray-500">UPC: {selectedStock.upc}</p>
                </div>
              </div>

              {/* Stock Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stock</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedStock.currentStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Min Stock Level</label>
                    <p className="text-lg font-semibold text-red-600">{selectedStock.minStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max Stock Level</label>
                    <p className="text-lg font-semibold text-blue-600">{selectedStock.maxStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedStock.location}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <p className="text-2xl font-bold text-green-600">₱{selectedStock.totalValue.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                    <p className="text-lg font-semibold text-gray-900">₱{selectedStock.unitCost.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Branch</label>
                    <p className="text-gray-900">{selectedStock.branchName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-gray-900">{selectedStock.supplier}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Restocked</label>
                  <p className="text-gray-900">{format(new Date(selectedStock.lastRestocked), 'MMM dd, yyyy HH:mm')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                  <p className="text-gray-900">{format(new Date(selectedStock.expiryDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>

              {/* Stock Level Indicator */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Stock Level Indicator</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      selectedStock.currentStock <= selectedStock.minStock ? 'bg-red-500' :
                      selectedStock.currentStock <= selectedStock.minStock * 1.5 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((selectedStock.currentStock / selectedStock.maxStock) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>{selectedStock.minStock} (Min)</span>
                  <span>{selectedStock.maxStock} (Max)</span>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Stock Adjustment Modal */}
        {isAdjustModalOpen && selectedStock && (
          <Modal
            isOpen={isAdjustModalOpen}
            onClose={() => {
              setIsAdjustModalOpen(false);
              setSelectedStock(null);
            }}
            title="Adjust Stock"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <p className="text-gray-900">{selectedStock.productName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                <p className="text-lg font-semibold text-gray-900">{selectedStock.currentStock} units</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="set">Set Stock Level</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="restock">Restock</option>
                  <option value="sale">Sale</option>
                  <option value="damage">Damage</option>
                  <option value="theft">Theft</option>
                  <option value="adjustment">Manual Adjustment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional notes..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                  Cancel
                </Button>
                <Button>
                  Adjust Stock
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Stock Modal */}
        {isCreateStockModalOpen && (
          <Modal
            isOpen={isCreateStockModalOpen}
            onClose={() => {
              setIsCreateStockModalOpen(false);
              setCreateStockForm({
                productId: '',
                beginningStock: '',
                startPeriod: '',
                endPeriod: '',
                weekTrackingMode: 'manual',
                weekOneStock: '',
                weekTwoStock: '',
                weekThreeStock: '',
                weekFourStock: '',
                endStockMode: 'manual',
                realTimeStock: ''
              });
              setCreateStockErrors({});
            }}
            title="Create Stock Record"
            size="lg"
          >
            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  value={createStockForm.productId}
                  onChange={(e) => {
                    setCreateStockForm(prev => ({ ...prev, productId: e.target.value }));
                    setCreateStockErrors(prev => ({ ...prev, productId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    createStockErrors.productId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.brand}
                    </option>
                  ))}
                </select>
                {createStockErrors.productId && (
                  <p className="text-red-500 text-xs mt-1">{createStockErrors.productId}</p>
                )}
              </div>

              {/* Period Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Period <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={createStockForm.startPeriod}
                    onChange={(e) => {
                      setCreateStockForm(prev => ({ ...prev, startPeriod: e.target.value }));
                      setCreateStockErrors(prev => ({ ...prev, startPeriod: '' }));
                    }}
                    className={createStockErrors.startPeriod ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Usually the 1st of the month</p>
                  {createStockErrors.startPeriod && (
                    <p className="text-red-500 text-xs mt-1">{createStockErrors.startPeriod}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Period <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={createStockForm.endPeriod}
                    onChange={(e) => {
                      setCreateStockForm(prev => ({ ...prev, endPeriod: e.target.value }));
                      setCreateStockErrors(prev => ({ ...prev, endPeriod: '' }));
                    }}
                    className={createStockErrors.endPeriod ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">Usually the last day of the month</p>
                  {createStockErrors.endPeriod && (
                    <p className="text-red-500 text-xs mt-1">{createStockErrors.endPeriod}</p>
                  )}
                </div>
              </div>

              {/* Beginning Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beginning Stock <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter beginning stock quantity"
                  value={createStockForm.beginningStock}
                  onChange={(e) => {
                    setCreateStockForm(prev => ({ ...prev, beginningStock: e.target.value }));
                    setCreateStockErrors(prev => ({ ...prev, beginningStock: '' }));
                  }}
                  className={createStockErrors.beginningStock ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">Physical count at the start of the month (1st day)</p>
                {createStockErrors.beginningStock && (
                  <p className="text-red-500 text-xs mt-1">{createStockErrors.beginningStock}</p>
                )}
              </div>

              {/* Weekly Tracking Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weekly Tracking Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="weekTrackingMode"
                      value="manual"
                      checked={createStockForm.weekTrackingMode === 'manual'}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekTrackingMode: e.target.value }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manual Entry</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="weekTrackingMode"
                      value="auto"
                      checked={createStockForm.weekTrackingMode === 'auto'}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekTrackingMode: e.target.value }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto Calculate</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {createStockForm.weekTrackingMode === 'manual' 
                    ? 'Enter stock levels manually each week'
                    : 'Auto-calculate based on beginning stock and usage patterns'
                  }
                </p>
              </div>

              {/* Weekly Stocks */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Stock Levels</h4>
                {createStockForm.weekTrackingMode === 'manual' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Week 1 Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Week 1"
                      value={createStockForm.weekOneStock}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekOneStock: e.target.value }));
                        setCreateStockErrors(prev => ({ ...prev, weekOneStock: '' }));
                      }}
                      className={createStockErrors.weekOneStock ? 'border-red-500' : ''}
                    />
                    {createStockErrors.weekOneStock && (
                      <p className="text-red-500 text-xs mt-1">{createStockErrors.weekOneStock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Week 2 Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Week 2"
                      value={createStockForm.weekTwoStock}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekTwoStock: e.target.value }));
                        setCreateStockErrors(prev => ({ ...prev, weekTwoStock: '' }));
                      }}
                      className={createStockErrors.weekTwoStock ? 'border-red-500' : ''}
                    />
                    {createStockErrors.weekTwoStock && (
                      <p className="text-red-500 text-xs mt-1">{createStockErrors.weekTwoStock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Week 3 Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Week 3"
                      value={createStockForm.weekThreeStock}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekThreeStock: e.target.value }));
                        setCreateStockErrors(prev => ({ ...prev, weekThreeStock: '' }));
                      }}
                      className={createStockErrors.weekThreeStock ? 'border-red-500' : ''}
                    />
                    {createStockErrors.weekThreeStock && (
                      <p className="text-red-500 text-xs mt-1">{createStockErrors.weekThreeStock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Week 4 Stock <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Week 4"
                      value={createStockForm.weekFourStock}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, weekFourStock: e.target.value }));
                        setCreateStockErrors(prev => ({ ...prev, weekFourStock: '' }));
                      }}
                      className={createStockErrors.weekFourStock ? 'border-red-500' : ''}
                    />
                    {createStockErrors.weekFourStock && (
                      <p className="text-red-500 text-xs mt-1">{createStockErrors.weekFourStock}</p>
                    )}
                  </div>
                </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Auto-Calculate Weekly Stocks</h5>
                    <p className="text-xs text-gray-600 mb-4">
                      The system will automatically calculate weekly stock levels based on the beginning stock. 
                      You can adjust these values later when actual counts are available.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-300 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Week 1 (Projected)</label>
                        <div className="text-sm font-semibold text-gray-900">
                          {createStockForm.beginningStock ? Math.max(0, parseInt(createStockForm.beginningStock) - Math.floor(parseInt(createStockForm.beginningStock) * 0.25)) : '0'} units
                        </div>
                        <p className="text-xs text-gray-500">-25% from beginning</p>
                      </div>
                      <div className="bg-white border border-gray-300 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Week 2 (Projected)</label>
                        <div className="text-sm font-semibold text-gray-900">
                          {createStockForm.beginningStock ? Math.max(0, parseInt(createStockForm.beginningStock) - Math.floor(parseInt(createStockForm.beginningStock) * 0.50)) : '0'} units
                        </div>
                        <p className="text-xs text-gray-500">-50% from beginning</p>
                      </div>
                      <div className="bg-white border border-gray-300 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Week 3 (Projected)</label>
                        <div className="text-sm font-semibold text-gray-900">
                          {createStockForm.beginningStock ? Math.max(0, parseInt(createStockForm.beginningStock) - Math.floor(parseInt(createStockForm.beginningStock) * 0.75)) : '0'} units
                        </div>
                        <p className="text-xs text-gray-500">-75% from beginning</p>
                      </div>
                      <div className="bg-white border border-gray-300 rounded-lg p-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Week 4 (Projected)</label>
                        <div className="text-sm font-semibold text-gray-900">
                          {createStockForm.beginningStock ? Math.max(0, parseInt(createStockForm.beginningStock) - Math.floor(parseInt(createStockForm.beginningStock) * 0.90)) : '0'} units
                        </div>
                        <p className="text-xs text-gray-500">-90% from beginning</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* End Stock Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Stock Calculation
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="endStockMode"
                      value="manual"
                      checked={createStockForm.endStockMode === 'manual'}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, endStockMode: e.target.value }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Manual Entry</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="endStockMode"
                      value="auto"
                      checked={createStockForm.endStockMode === 'auto'}
                      onChange={(e) => {
                        setCreateStockForm(prev => ({ ...prev, endStockMode: e.target.value }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto Calculate</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {createStockForm.endStockMode === 'manual' 
                    ? 'Enter the actual end stock count manually'
                    : 'Auto-calculate based on weekly tracking data'
                  }
                </p>
              </div>

              {/* Real-time Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Real-time Stock <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Enter current real-time stock quantity"
                  value={createStockForm.realTimeStock}
                  onChange={(e) => {
                    setCreateStockForm(prev => ({ ...prev, realTimeStock: e.target.value }));
                    setCreateStockErrors(prev => ({ ...prev, realTimeStock: '' }));
                  }}
                  className={createStockErrors.realTimeStock ? 'border-red-500' : ''}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This represents the actual physical count of stock on hand
                </p>
                {createStockErrors.realTimeStock && (
                  <p className="text-red-500 text-xs mt-1">{createStockErrors.realTimeStock}</p>
                )}
              </div>

              {/* Stock Summary */}
              {createStockForm.beginningStock && createStockForm.weekFourStock && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Stock Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-blue-700">Beginning:</span>
                      <span className="font-semibold text-blue-900 ml-2">{createStockForm.beginningStock || 0} units</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Week 4 End:</span>
                      <span className="font-semibold text-blue-900 ml-2">{createStockForm.weekFourStock || 0} units</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Change:</span>
                      <span className={`font-semibold ml-2 ${
                        (parseInt(createStockForm.weekFourStock) - parseInt(createStockForm.beginningStock)) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {parseInt(createStockForm.weekFourStock || 0) - parseInt(createStockForm.beginningStock || 0)} units
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Real-time:</span>
                      <span className="font-semibold text-blue-900 ml-2">{createStockForm.realTimeStock || 0} units</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {Object.keys(createStockErrors).length > 0 && createStockErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{createStockErrors.general}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreateStockModalOpen(false);
                    setCreateStockForm({
                      productId: '',
                      beginningStock: '',
                      startPeriod: '',
                      endPeriod: '',
                      weekTrackingMode: 'manual',
                      weekOneStock: '',
                      weekTwoStock: '',
                      weekThreeStock: '',
                      weekFourStock: '',
                      endStockMode: 'manual',
                      realTimeStock: ''
                    });
                    setCreateStockErrors({});
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    // Validation
                    const errors = {};
                    
                    if (!createStockForm.productId) {
                      errors.productId = 'Please select a product';
                    }
                    
                    if (!createStockForm.startPeriod) {
                      errors.startPeriod = 'Start period is required';
                    }
                    
                    if (!createStockForm.endPeriod) {
                      errors.endPeriod = 'End period is required';
                    }
                    
                    if (createStockForm.startPeriod && createStockForm.endPeriod) {
                      if (new Date(createStockForm.endPeriod) <= new Date(createStockForm.startPeriod)) {
                        errors.endPeriod = 'End period must be after start period';
                      }
                    }
                    
                    if (!createStockForm.beginningStock || parseInt(createStockForm.beginningStock) < 0) {
                      errors.beginningStock = 'Beginning stock must be 0 or greater';
                    }
                    
                    // Validate weekly stocks based on tracking mode
                    if (createStockForm.weekTrackingMode === 'manual') {
                      if (!createStockForm.weekOneStock || parseInt(createStockForm.weekOneStock) < 0) {
                        errors.weekOneStock = 'Week 1 stock must be 0 or greater';
                      }
                      
                      if (!createStockForm.weekTwoStock || parseInt(createStockForm.weekTwoStock) < 0) {
                        errors.weekTwoStock = 'Week 2 stock must be 0 or greater';
                      }
                      
                      if (!createStockForm.weekThreeStock || parseInt(createStockForm.weekThreeStock) < 0) {
                        errors.weekThreeStock = 'Week 3 stock must be 0 or greater';
                      }
                      
                      if (!createStockForm.weekFourStock || parseInt(createStockForm.weekFourStock) < 0) {
                        errors.weekFourStock = 'Week 4 stock must be 0 or greater';
                      }
                    }
                    
                    if (!createStockForm.realTimeStock || parseInt(createStockForm.realTimeStock) < 0) {
                      errors.realTimeStock = 'Real-time stock must be 0 or greater';
                    }
                    
                    if (Object.keys(errors).length > 0) {
                      setCreateStockErrors(errors);
                      return;
                    }
                    
                    // Submit
                    try {
                      setIsSubmitting(true);
                      setCreateStockErrors({});
                      
                      const selectedProduct = products.find(p => p.id === createStockForm.productId);
                      const beginningStock = parseInt(createStockForm.beginningStock);
                      
                      // Calculate weekly stocks if auto mode
                      let weekOneStock, weekTwoStock, weekThreeStock, weekFourStock;
                      
                      if (createStockForm.weekTrackingMode === 'auto') {
                        weekOneStock = Math.max(0, beginningStock - Math.floor(beginningStock * 0.25));
                        weekTwoStock = Math.max(0, beginningStock - Math.floor(beginningStock * 0.50));
                        weekThreeStock = Math.max(0, beginningStock - Math.floor(beginningStock * 0.75));
                        weekFourStock = Math.max(0, beginningStock - Math.floor(beginningStock * 0.90));
                      } else {
                        weekOneStock = parseInt(createStockForm.weekOneStock);
                        weekTwoStock = parseInt(createStockForm.weekTwoStock);
                        weekThreeStock = parseInt(createStockForm.weekThreeStock);
                        weekFourStock = parseInt(createStockForm.weekFourStock);
                      }
                      
                      // Calculate end stock if auto mode
                      let endStock;
                      if (createStockForm.endStockMode === 'auto') {
                        endStock = weekFourStock; // Use week 4 as end stock
                      } else {
                        endStock = parseInt(createStockForm.realTimeStock);
                      }
                      
                      const stockData = {
                        productId: createStockForm.productId,
                        productName: selectedProduct?.name || 'Unknown',
                        branchId: userData?.branchId,
                        beginningStock: beginningStock,
                        startPeriod: createStockForm.startPeriod,
                        weekTrackingMode: createStockForm.weekTrackingMode,
                        weekOneStock: weekOneStock,
                        weekTwoStock: weekTwoStock,
                        weekThreeStock: weekThreeStock,
                        weekFourStock: weekFourStock,
                        endPeriod: createStockForm.endPeriod,
                        endStockMode: createStockForm.endStockMode,
                        endStock: endStock,
                        realTimeStock: parseInt(createStockForm.realTimeStock),
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        createdBy: userData?.uid,
                        status: 'active'
                      };
                      
                      await addDoc(collection(db, 'stocks'), stockData);
                      
                      // Reset form and close modal
                      setCreateStockForm({
                        productId: '',
                        beginningStock: '',
                        startPeriod: '',
                        endPeriod: '',
                        weekTrackingMode: 'manual',
                        weekOneStock: '',
                        weekTwoStock: '',
                        weekThreeStock: '',
                        weekFourStock: '',
                        endStockMode: 'manual',
                        realTimeStock: ''
                      });
                      setIsCreateStockModalOpen(false);
                      
                      // Reload data
                      await loadData();
                      
                      alert('Stock record created successfully!');
                    } catch (error) {
                      console.error('Error creating stock:', error);
                      setCreateStockErrors({ general: 'Failed to create stock record. Please try again.' });
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Stock
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min Stock"
                    value={filters.stockRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockRange: { ...prev.stockRange, min: e.target.value }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max Stock"
                    value={filters.stockRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      stockRange: { ...prev.stockRange, max: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lowStock"
                  checked={filters.lowStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, lowStock: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="lowStock" className="ml-2 block text-sm text-gray-900">
                  Show only low stock items
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  branch: 'all',
                  status: 'all',
                  category: 'all',
                  stockRange: { min: '', max: '' },
                  lowStock: false
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

export default Stocks;