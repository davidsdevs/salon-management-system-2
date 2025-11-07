import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Home,
  Calendar,
  Users,
  Receipt,
  Settings,
  BarChart3,
  UserCog,
  Layers,
  DollarSign,
  ShoppingCart,
  ArrowRightLeft,
  QrCode,
  Truck,
  ClipboardList,
  Bell
} from 'lucide-react';

const Inventory = () => {
  const { userData } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample data - replace with actual API calls
  const [sampleProducts] = useState([
    {
      id: '1',
      name: 'Professional Shampoo',
      category: 'Hair Care',
      sku: 'SH001',
      currentStock: 15,
      minStock: 10,
      maxStock: 50,
      unitPrice: 450.00,
      totalValue: 6750.00,
      supplier: 'Beauty Supplies Inc.',
      lastRestocked: '2024-01-15',
      expiryDate: '2025-12-31',
      status: 'In Stock'
    },
    {
      id: '2',
      name: 'Hair Color #5',
      category: 'Hair Color',
      sku: 'HC005',
      currentStock: 3,
      minStock: 5,
      maxStock: 25,
      unitPrice: 320.00,
      totalValue: 960.00,
      supplier: 'Color Pro',
      lastRestocked: '2024-01-10',
      expiryDate: '2024-08-15',
      status: 'Low Stock'
    },
    {
      id: '3',
      name: 'Conditioner',
      category: 'Hair Care',
      sku: 'CON001',
      currentStock: 0,
      minStock: 8,
      maxStock: 30,
      unitPrice: 380.00,
      totalValue: 0.00,
      supplier: 'Beauty Supplies Inc.',
      lastRestocked: '2024-01-05',
      expiryDate: '2025-10-20',
      status: 'Out of Stock'
    },
    {
      id: '4',
      name: 'Massage Oil',
      category: 'Spa Products',
      sku: 'MO001',
      currentStock: 1,
      minStock: 3,
      maxStock: 15,
      unitPrice: 280.00,
      totalValue: 280.00,
      supplier: 'Spa Essentials',
      lastRestocked: '2024-01-12',
      expiryDate: '2024-06-30',
      status: 'Low Stock'
    },
    {
      id: '5',
      name: 'Hair Styling Gel',
      category: 'Styling Products',
      sku: 'HSG001',
      currentStock: 22,
      minStock: 5,
      maxStock: 40,
      unitPrice: 180.00,
      totalValue: 3960.00,
      supplier: 'Style Pro',
      lastRestocked: '2024-01-18',
      expiryDate: '2025-03-15',
      status: 'In Stock'
    }
  ]);

  const categories = ['all', 'Hair Care', 'Hair Color', 'Spa Products', 'Styling Products', 'Tools'];

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    setProducts(sampleProducts);
    setFilteredProducts(sampleProducts);
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [searchTerm, selectedCategory, sortBy, sortOrder, products]);

  const filterAndSortProducts = () => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'totalValue') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Stock': return <TrendingUp className="h-4 w-4" />;
      case 'Low Stock': return <AlertTriangle className="h-4 w-4" />;
      case 'Out of Stock': return <TrendingDown className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const calculateTotalValue = () => {
    return products.reduce((total, product) => total + product.totalValue, 0);
  };

  const getLowStockCount = () => {
    return products.filter(product => product.status === 'Low Stock' || product.status === 'Out of Stock').length;
  };

  const getOutOfStockCount = () => {
    return products.filter(product => product.status === 'Out of Stock').length;
  };

  const handleAddStock = (productId, quantity) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product, 
            currentStock: product.currentStock + quantity,
            totalValue: (product.currentStock + quantity) * product.unitPrice,
            status: product.currentStock + quantity <= product.minStock ? 'Low Stock' : 'In Stock'
          }
        : product
    ));
    setShowStockModal(false);
    setSelectedProduct(null);
  };

  const handleReduceStock = (productId, quantity) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product, 
            currentStock: Math.max(0, product.currentStock - quantity),
            totalValue: Math.max(0, product.currentStock - quantity) * product.unitPrice,
            status: product.currentStock - quantity <= 0 ? 'Out of Stock' : 
                   product.currentStock - quantity <= product.minStock ? 'Low Stock' : 'In Stock'
          }
        : product
    ));
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Inventory Management">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.status === 'In Stock').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{getLowStockCount()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₱{calculateTotalValue().toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="currentStock-asc">Stock Low-High</option>
                <option value="currentStock-desc">Stock High-Low</option>
                <option value="totalValue-asc">Value Low-High</option>
                <option value="totalValue-desc">Value High-Low</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-[#160B53] hover:bg-[#160B53]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Price</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">{product.supplier}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">{product.sku}</td>
                    <td className="py-4 px-4 text-gray-700">{product.category}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{product.currentStock}</span>
                        <span className="text-sm text-gray-500 ml-1">/ {product.maxStock}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            product.currentStock <= product.minStock ? 'bg-red-500' : 
                            product.currentStock <= product.minStock * 1.5 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(product.currentStock / product.maxStock) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {getStatusIcon(product.status)}
                        <span className="ml-1">{product.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700">₱{product.unitPrice.toFixed(2)}</td>
                    <td className="py-4 px-4 text-gray-700">₱{product.totalValue.toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowStockModal(true);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReduceStock(product.id, 1)}
                        >
                          <TrendingDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock Alert */}
        {getLowStockCount() > 0 && (
          <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
                <p className="text-yellow-700">
                  {getLowStockCount()} product{getLowStockCount() > 1 ? 's' : ''} need{getLowStockCount() === 1 ? 's' : ''} restocking
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Out of Stock Alert */}
        {getOutOfStockCount() > 0 && (
          <Card className="p-6 border-l-4 border-red-400 bg-red-50">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Out of Stock Alert</h3>
                <p className="text-red-700">
                  {getOutOfStockCount()} product{getOutOfStockCount() > 1 ? 's' : ''} out of stock
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Add Stock Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Stock - {selectedProduct.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock: {selectedProduct.currentStock}
                </label>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  id="addQuantity"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStockModal(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const quantity = parseInt(document.getElementById('addQuantity').value);
                    if (quantity > 0) {
                      handleAddStock(selectedProduct.id, quantity);
                    }
                  }}
                  className="bg-[#160B53] hover:bg-[#160B53]/90"
                >
                  Add Stock
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Inventory;


