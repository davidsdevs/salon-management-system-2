// src/pages/06_InventoryController/Products.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import { productService } from '../../services/productService';
import {
  Package,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
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
  Home,
  TrendingUp,
  ArrowRightLeft,
  QrCode,
  ShoppingCart,
  Truck,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';

const Products = () => {
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    supplier: 'all',
    priceRange: { min: '', max: '' },
    commissionRange: { min: '', max: '' }
  });

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await productService.getAllProducts();
      if (result.success) {
        setProducts(result.products);
      } else {
        throw new Error(result.message || 'Failed to load products');
      }
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
  
  // Get unique suppliers
  const suppliers = [...new Set(products.map(p => p.supplier))].filter(Boolean);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesStatus = filters.status === 'all' || product.status === filters.status;
      const matchesSupplier = filters.supplier === 'all' || product.supplier === filters.supplier;
      
      const matchesPriceRange = (!filters.priceRange.min || product.otcPrice >= parseFloat(filters.priceRange.min)) &&
                               (!filters.priceRange.max || product.otcPrice <= parseFloat(filters.priceRange.max));
      
      const matchesCommissionRange = (!filters.commissionRange.min || product.commissionPercentage >= parseFloat(filters.commissionRange.min)) &&
                                    (!filters.commissionRange.max || product.commissionPercentage <= parseFloat(filters.commissionRange.max));
      
      return matchesSearch && matchesCategory && matchesStatus && matchesSupplier && matchesPriceRange && matchesCommissionRange;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
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

  // Handle filter reset
  const resetFilters = () => {
    setFilters({
      category: 'all',
      status: 'all',
      supplier: 'all',
      priceRange: { min: '', max: '' },
      commissionRange: { min: '', max: '' }
    });
    setSearchTerm('');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-red-600 bg-red-100';
      case 'Discontinued': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircle className="h-4 w-4" />;
      case 'Inactive': return <XCircle className="h-4 w-4" />;
      case 'Discontinued': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading products...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h3>
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
    <DashboardLayout menuItems={menuItems} pageTitle="Products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product inventory and details</p>
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
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search products by name, brand, or description..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
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
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Discontinued">Discontinued</option>
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
                onClick={resetFilters}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {getStatusIcon(product.status)}
                    {product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                  <span className="text-xs text-gray-500 ml-2">#{product.upc}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Supplier:</span>
                    <span className="font-medium">{product.supplier}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">OTC Price:</span>
                    <span className="font-medium text-green-600">₱{product.otcPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Commission:</span>
                    <span className="font-medium">{product.commissionPercentage}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(product)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="p-12 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first product'
              }
            </p>
            <Button className="flex items-center gap-2 mx-auto">
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
            title="Product Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Product Header */}
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  {selectedProduct.imageUrl ? (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" />
                  )}
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
                  <p className="text-sm text-gray-500">UPC: {selectedProduct.upc}</p>
                </div>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.description}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.category}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Supplier</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.supplier}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Variants</label>
                    <p className="text-gray-900 mt-1">{selectedProduct.variants || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">OTC Price</label>
                    <p className="text-lg font-semibold text-green-600 mt-1">₱{selectedProduct.otcPrice.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Salon Use Price</label>
                    <p className="text-lg font-semibold text-blue-600 mt-1">₱{selectedProduct.salonUsePrice.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">₱{selectedProduct.unitCost.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Commission</label>
                    <p className="text-lg font-semibold text-purple-600 mt-1">{selectedProduct.commissionPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Shelf Life</label>
                  <p className="text-gray-900 mt-1">{selectedProduct.shelfLife} months</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Branches</label>
                  <p className="text-gray-900 mt-1">{selectedProduct.branches?.length || 0} branch(es)</p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(selectedProduct.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {format(new Date(selectedProduct.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                <select
                  value={filters.supplier}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min Price"
                    value={filters.priceRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, min: e.target.value }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max Price"
                    value={filters.priceRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      priceRange: { ...prev.priceRange, max: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commission Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder="Min %"
                    value={filters.commissionRange.min}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      commissionRange: { ...prev.commissionRange, min: e.target.value }
                    }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max %"
                    value={filters.commissionRange.max}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      commissionRange: { ...prev.commissionRange, max: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={resetFilters}>
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

export default Products;