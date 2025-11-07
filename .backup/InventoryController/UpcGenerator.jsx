// src/pages/06_InventoryController/UpcGenerator.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import {
  QrCode,
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
  Bell,
  AlertCircle,
  TrendingDown,
  ShoppingCart,
  ArrowRight,
  Copy,
  Printer,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';

const UpcGenerator = () => {
  const { userData } = useAuth();
  
  // Data states
  const [products, setProducts] = useState([]);
  const [generatedCodes, setGeneratedCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    hasUpc: 'all'
  });

  // Generate form states
  const [generateForm, setGenerateForm] = useState({
    productId: '',
    upcCode: '',
    quantity: 1,
    format: 'UPC-A',
    size: 'medium',
    includeText: true,
    textPosition: 'bottom'
  });

  // Mock product data
  const mockProducts = [
    {
      id: 'prod1',
      name: 'Olaplex No.3 Hair Perfector',
      brand: 'Olaplex',
      category: 'Hair Care',
      upc: '123456789114',
      hasUpc: true,
      status: 'Active',
      imageUrl: 'https://res.cloudinary.com/dn0jgdjts/image/upload/v1761245057/eg9tc1wixlvsd0scwjtd.jpg',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: 'prod2',
      name: 'L\'Oréal Hair Color',
      brand: 'L\'Oréal',
      category: 'Hair Color',
      upc: '',
      hasUpc: false,
      status: 'Active',
      imageUrl: null,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10')
    },
    {
      id: 'prod3',
      name: 'Kerastase Shampoo',
      brand: 'Kerastase',
      category: 'Hair Care',
      upc: '123456789116',
      hasUpc: true,
      status: 'Active',
      imageUrl: null,
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-08')
    }
  ];

  // Mock generated codes
  const mockGeneratedCodes = [
    {
      id: 'gen-001',
      productId: 'prod1',
      productName: 'Olaplex No.3 Hair Perfector',
      upcCode: '123456789114',
      format: 'UPC-A',
      size: 'medium',
      quantity: 10,
      generatedAt: new Date('2024-01-15'),
      generatedBy: 'John Smith',
      status: 'Generated'
    },
    {
      id: 'gen-002',
      productId: 'prod2',
      productName: 'L\'Oréal Hair Color',
      upcCode: '123456789115',
      format: 'UPC-A',
      size: 'large',
      quantity: 5,
      generatedAt: new Date('2024-01-14'),
      generatedBy: 'Maria Santos',
      status: 'Generated'
    }
  ];

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data
      setProducts(mockProducts);
      setGeneratedCodes(mockGeneratedCodes);
      
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

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category))].filter(Boolean);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.upc.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filters.category === 'all' || product.category === filters.category;
      const matchesStatus = filters.status === 'all' || product.status === filters.status;
      const matchesHasUpc = filters.hasUpc === 'all' || 
                           (filters.hasUpc === 'yes' && product.hasUpc) ||
                           (filters.hasUpc === 'no' && !product.hasUpc);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesHasUpc;
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

  // Handle generate UPC
  const handleGenerateUPC = (product) => {
    setSelectedProduct(product);
    setGenerateForm({
      productId: product.id,
      upcCode: product.upc || '',
      quantity: 1,
      format: 'UPC-A',
      size: 'medium',
      includeText: true,
      textPosition: 'bottom'
    });
    setIsGenerateModalOpen(true);
  };

  // Handle form submission
  const handleGenerateSubmit = (e) => {
    e.preventDefault();
    // Handle UPC generation logic here
    console.log('Generating UPC:', generateForm);
    setIsGenerateModalOpen(false);
  };

  // Generate random UPC code
  const generateRandomUPC = () => {
    const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setGenerateForm(prev => ({ ...prev, upcCode: randomCode }));
  };

  // Copy UPC code to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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
      case 'Discontinued': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    productsWithUPC: products.filter(p => p.hasUpc).length,
    productsWithoutUPC: products.filter(p => !p.hasUpc).length,
    totalGenerated: generatedCodes.length,
    recentGenerated: generatedCodes.filter(g => 
      new Date(g.generatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">UPC Generator</h1>
            <p className="text-gray-600">Generate barcodes and UPC codes for products</p>
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
              Generate Batch
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <p className="text-sm font-medium text-gray-600">With UPC</p>
                <p className="text-xl font-bold text-gray-900">{stats.productsWithUPC}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Without UPC</p>
                <p className="text-xl font-bold text-gray-900">{stats.productsWithoutUPC}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Generated</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalGenerated}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-xl font-bold text-gray-900">{stats.recentGenerated}</p>
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
              <select
                value={filters.hasUpc}
                onChange={(e) => setFilters(prev => ({ ...prev, hasUpc: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All UPC Status</option>
                <option value="yes">Has UPC</option>
                <option value="no">No UPC</option>
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
                  category: 'all',
                  status: 'all',
                  hasUpc: 'all'
                })}
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
                {product.hasUpc && (
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <QrCode className="h-3 w-3" />
                      UPC
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                <p className="text-xs text-gray-500 mb-3">{product.category}</p>
                
                {product.upc && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-gray-500">UPC Code</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{product.upc}</code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(product.upc)}
                        className="p-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(product)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateUPC(product)}
                    className="flex items-center gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    {product.hasUpc ? 'Regenerate' : 'Generate'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <Card className="p-12 text-center">
            <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'No products available for UPC generation'
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
                  <p className="text-sm text-gray-500">{selectedProduct.category}</p>
                </div>
              </div>

              {/* UPC Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">UPC Information</h3>
                {selectedProduct.upc ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">UPC Code</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-lg bg-white px-3 py-2 rounded font-mono border">{selectedProduct.upc}</code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(selectedProduct.upc)}
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-3">No UPC code generated yet</p>
                    <Button
                      onClick={() => handleGenerateUPC(selectedProduct)}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      Generate UPC
                    </Button>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product ID</label>
                  <p className="text-gray-900">{selectedProduct.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Brand</label>
                  <p className="text-gray-900">{selectedProduct.brand}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{selectedProduct.category}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-900">{selectedProduct.status}</p>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Generate UPC Modal */}
        {isGenerateModalOpen && selectedProduct && (
          <Modal
            isOpen={isGenerateModalOpen}
            onClose={() => {
              setIsGenerateModalOpen(false);
              setSelectedProduct(null);
            }}
            title="Generate UPC Code"
            size="md"
          >
            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedProduct.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPC Code *</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={generateForm.upcCode}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, upcCode: e.target.value }))}
                    placeholder="Enter 12-digit UPC code"
                    maxLength="12"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomUPC}
                    className="whitespace-nowrap"
                  >
                    Generate Random
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                  <select
                    value={generateForm.format}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UPC-A">UPC-A</option>
                    <option value="UPC-E">UPC-E</option>
                    <option value="EAN-13">EAN-13</option>
                    <option value="EAN-8">EAN-8</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                  <select
                    value={generateForm.size}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={generateForm.quantity}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeText"
                  checked={generateForm.includeText}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, includeText: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeText" className="ml-2 block text-sm text-gray-900">
                  Include text below barcode
                </label>
              </div>
              
              {generateForm.includeText && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Text Position</label>
                  <select
                    value={generateForm.textPosition}
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, textPosition: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Generate UPC
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Brands</option>
                  {/* Brand options would be populated here */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    placeholder="Start Date"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  category: 'all',
                  status: 'all',
                  hasUpc: 'all'
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

export default UpcGenerator;