// src/pages/06_InventoryController/ExpiryTracker.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import {
  Calendar,
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
  Building,
  FileText,
  Bell,
  AlertCircle,
  TrendingDown,
  ShoppingCart,
  ArrowRight,
  Copy,
  Printer,
  Trash2,
  Clock3,
  CalendarDays,
  AlertCircle as AlertCircleIcon
} from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

const ExpiryTracker = () => {
  const { userData } = useAuth();
  
  // Data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('expiryDate');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    expiryRange: 'all',
    daysAhead: 30
  });

  // Mock product data with expiry information
  const mockProducts = [
    {
      id: 'prod1',
      name: 'Olaplex No.3 Hair Perfector',
      brand: 'Olaplex',
      category: 'Hair Care',
      currentStock: 15,
      expiryDate: new Date('2024-03-15'),
      batchNumber: 'BATCH-001',
      shelfLife: 24,
      supplier: 'Olaplex Philippines',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf A-1',
      unitCost: 1400,
      totalValue: 21000,
      status: 'Good',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'prod2',
      name: 'L\'Oréal Hair Color',
      brand: 'L\'Oréal',
      category: 'Hair Color',
      currentStock: 8,
      expiryDate: new Date('2024-02-28'),
      batchNumber: 'BATCH-002',
      shelfLife: 12,
      supplier: 'L\'Oréal Philippines',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf B-2',
      unitCost: 800,
      totalValue: 6400,
      status: 'Expiring Soon',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'prod3',
      name: 'Kerastase Shampoo',
      brand: 'Kerastase',
      category: 'Hair Care',
      currentStock: 12,
      expiryDate: new Date('2024-01-20'),
      batchNumber: 'BATCH-003',
      shelfLife: 18,
      supplier: 'Kerastase Philippines',
      branchId: 'branch2',
      branchName: 'SM Mall of Asia',
      location: 'Shelf C-1',
      unitCost: 1200,
      totalValue: 14400,
      status: 'Critical',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-08')
    },
    {
      id: 'prod4',
      name: 'Wella Hair Color',
      brand: 'Wella',
      category: 'Hair Color',
      currentStock: 5,
      expiryDate: new Date('2023-12-31'),
      batchNumber: 'BATCH-004',
      shelfLife: 12,
      supplier: 'Wella Philippines',
      branchId: 'branch3',
      branchName: 'Greenbelt 5',
      location: 'Shelf D-2',
      unitCost: 900,
      totalValue: 4500,
      status: 'Expired',
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2023-12-01')
    }
  ];

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data
      setProducts(mockProducts);
      
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  // Calculate expiry status
  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiryDate, today);
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 7) return 'Critical';
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Good';
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesStatus = filters.status === 'all' || product.status === filters.status;
      
      const matchesExpiryRange = filters.expiryRange === 'all' || 
        (filters.expiryRange === 'expired' && product.status === 'Expired') ||
        (filters.expiryRange === 'critical' && product.status === 'Critical') ||
        (filters.expiryRange === 'expiring' && product.status === 'Expiring Soon') ||
        (filters.expiryRange === 'good' && product.status === 'Good');
      
      const matchesDaysAhead = filters.daysAhead === 'all' || 
        differenceInDays(product.expiryDate, new Date()) <= filters.daysAhead;
      
      return matchesSearch && matchesCategory && matchesStatus && matchesExpiryRange && matchesDaysAhead;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'expiryDate' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle product details
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  // Handle create product
  const handleCreateProduct = () => {
    setIsCreateModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted');
    setIsCreateModalOpen(false);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Good': return 'text-green-600 bg-green-100';
      case 'Expiring Soon': return 'text-yellow-600 bg-yellow-100';
      case 'Critical': return 'text-orange-600 bg-orange-100';
      case 'Expired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Good': return <CheckCircle className="h-4 w-4" />;
      case 'Expiring Soon': return <Clock className="h-4 w-4" />;
      case 'Critical': return <AlertTriangle className="h-4 w-4" />;
      case 'Expired': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    goodProducts: products.filter(p => p.status === 'Good').length,
    expiringSoon: products.filter(p => p.status === 'Expiring Soon').length,
    criticalProducts: products.filter(p => p.status === 'Critical').length,
    expiredProducts: products.filter(p => p.status === 'Expired').length,
    totalValue: products.reduce((sum, p) => sum + p.totalValue, 0),
    expiringValue: products.filter(p => p.status === 'Expiring Soon' || p.status === 'Critical').reduce((sum, p) => sum + p.totalValue, 0)
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading expiry data...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Expiry Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadProducts} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expiry Tracker</h1>
            <p className="text-gray-600">Monitor product expiration dates and manage inventory</p>
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
            <Button onClick={handleCreateProduct} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Good</p>
                <p className="text-xl font-bold text-gray-900">{stats.goodProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-xl font-bold text-gray-900">{stats.expiringSoon}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-xl font-bold text-gray-900">{stats.criticalProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-xl font-bold text-gray-900">{stats.expiredProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <AlertCircleIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">At Risk Value</p>
                <p className="text-xl font-bold text-gray-900">₱{stats.expiringValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by product name, brand, or batch number..."
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
                <option value="Good">Good</option>
                <option value="Expiring Soon">Expiring Soon</option>
                <option value="Critical">Critical</option>
                <option value="Expired">Expired</option>
              </select>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
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
                  category: 'all',
                  expiryRange: 'all',
                  daysAhead: 30
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Left
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const daysLeft = differenceInDays(product.expiryDate, new Date());
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500">{product.brand} • {product.category}</div>
                          <div className="text-xs text-gray-400">{product.branchName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.batchNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{format(new Date(product.expiryDate), 'MMM dd, yyyy')}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {daysLeft < 0 ? 'Expired' : `${daysLeft} days`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusIcon(product.status)}
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.currentStock} units</div>
                        <div className="text-xs text-gray-500">{product.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₱{product.totalValue.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">₱{product.unitCost}/unit</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(product)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                          {product.status === 'Expired' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                              Dispose
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'No products with expiry tracking'
              }
            </p>
            <Button onClick={handleCreateProduct} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Card>
        )}

        {/* Product Details Modal */}
        {isDetailsModalOpen && selectedProduct && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedProduct(null);
            }}
            title="Product Expiry Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProduct.status)}`}>
                      {getStatusIcon(selectedProduct.status)}
                      {selectedProduct.status}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mb-2">{selectedProduct.brand}</p>
                  <p className="text-sm text-gray-500">{selectedProduct.category}</p>
                </div>
              </div>

              {/* Expiry Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Expiry Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                    <p className="text-lg font-semibold text-gray-900">{format(new Date(selectedProduct.expiryDate), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Days Left</label>
                    <p className={`text-lg font-semibold ${differenceInDays(selectedProduct.expiryDate, new Date()) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {differenceInDays(selectedProduct.expiryDate, new Date()) < 0 ? 'Expired' : `${differenceInDays(selectedProduct.expiryDate, new Date())} days`}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Batch Number</label>
                    <p className="text-gray-900">{selectedProduct.batchNumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Shelf Life</label>
                    <p className="text-gray-900">{selectedProduct.shelfLife} months</p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stock</label>
                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.currentStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                    <p className="text-lg font-semibold text-gray-900">₱{selectedProduct.unitCost.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <p className="text-lg font-semibold text-gray-900">₱{selectedProduct.totalValue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Branch</label>
                    <p className="text-gray-900">{selectedProduct.branchName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedProduct.location}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-gray-900">{selectedProduct.supplier}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {selectedProduct.status === 'Expired' && (
                  <Button className="flex items-center gap-2 bg-red-600 hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                    Dispose Product
                  </Button>
                )}
                {(selectedProduct.status === 'Critical' || selectedProduct.status === 'Expiring Soon') && (
                  <Button className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Create Sale
                  </Button>
                )}
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Update Expiry
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Product Modal */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Add Product for Expiry Tracking"
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select Product</option>
                  {/* Product options would be populated here */}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number *</label>
                <Input
                  type="text"
                  placeholder="Enter batch number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <Input
                  type="date"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shelf Life (months)</label>
                <Input
                  type="number"
                  placeholder="Enter shelf life in months"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Product
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Range</label>
                <select
                  value={filters.expiryRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, expiryRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Ranges</option>
                  <option value="expired">Expired</option>
                  <option value="critical">Critical (0-7 days)</option>
                  <option value="expiring">Expiring Soon (8-30 days)</option>
                  <option value="good">Good (30+ days)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days Ahead</label>
                <select
                  value={filters.daysAhead}
                  onChange={(e) => setFilters(prev => ({ ...prev, daysAhead: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  status: 'all',
                  category: 'all',
                  expiryRange: 'all',
                  daysAhead: 30
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

export default ExpiryTracker;