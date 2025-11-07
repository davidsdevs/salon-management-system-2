// src/pages/04_BranchManager/InventoryStocks.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { branchManagerMenuItems } from './menuItems';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import {
  Package,
  Search,
  Plus,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Eye,
  DollarSign,
  Calendar,
  Building,
  X
} from 'lucide-react';
import { format } from 'date-fns';

const InventoryStocks = () => {
  const { userData } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Modal states
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  
  // Form states
  const [addStockForm, setAddStockForm] = useState({
    productId: '',
    quantity: '',
    reason: 'restock',
    notes: ''
  });
  const [editStockForm, setEditStockForm] = useState({
    minStock: '',
    maxStock: '',
    unitCost: '',
    location: '',
    expiryDate: ''
  });

  // Load stocks
  const loadStocks = async () => {
    if (!userData?.branchId) {
      setError('Branch ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await inventoryService.getBranchStocks(userData.branchId, {
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      
      if (result.success) {
        setStocks(result.stocks);
      } else {
        throw new Error(result.message || 'Failed to load stocks');
      }
    } catch (err) {
      console.error('Error loading stocks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    try {
      const result = await productService.getAllProducts();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  useEffect(() => {
    loadStocks();
  }, [userData?.branchId, selectedStatus, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return stocks.filter(stock => {
      const matchesSearch = 
        stock.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.category?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [stocks, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = stocks.length;
    const totalValue = stocks.reduce((sum, stock) => 
      sum + ((stock.currentStock || 0) * (stock.unitCost || 0)), 0
    );
    const inStockCount = stocks.filter(s => s.status === 'In Stock').length;
    const lowStockCount = stocks.filter(s => s.status === 'Low Stock').length;
    const outOfStockCount = stocks.filter(s => s.status === 'Out of Stock').length;
    
    return { totalProducts, totalValue, inStockCount, lowStockCount, outOfStockCount };
  }, [stocks]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(stocks.map(s => s.category).filter(Boolean))];
  }, [stocks]);

  // Handle add stock
  const handleAddStock = async () => {
    if (!addStockForm.productId || !addStockForm.quantity) {
      alert('Please fill in all required fields');
      return;
    }

    const product = products.find(p => p.id === addStockForm.productId);
    if (!product) {
      alert('Product not found');
      return;
    }

    try {
      const result = await inventoryService.addStock({
        branchId: userData.branchId,
        productId: addStockForm.productId,
        productName: product.name,
        brand: product.brand,
        category: product.category,
        quantity: addStockForm.quantity,
        minStock: 10,
        maxStock: 100,
        unitCost: product.unitCost || 0,
        reason: addStockForm.reason,
        notes: addStockForm.notes,
        createdBy: userData.uid
      });

      if (result.success) {
        alert('Stock added successfully');
        setShowAddStockModal(false);
        setAddStockForm({ productId: '', quantity: '', reason: 'restock', notes: '' });
        loadStocks();
      } else {
        alert(result.message || 'Failed to add stock');
      }
    } catch (err) {
      console.error('Error adding stock:', err);
      alert('Failed to add stock: ' + err.message);
    }
  };

  // Handle update stock
  const handleUpdateStock = async () => {
    if (!selectedStock) return;

    try {
      const updateData = {};
      if (editStockForm.minStock) updateData.minStock = Number(editStockForm.minStock);
      if (editStockForm.maxStock) updateData.maxStock = Number(editStockForm.maxStock);
      if (editStockForm.unitCost) updateData.unitCost = Number(editStockForm.unitCost);
      if (editStockForm.location) updateData.location = editStockForm.location;
      if (editStockForm.expiryDate) updateData.expiryDate = editStockForm.expiryDate;

      const result = await inventoryService.updateStock(selectedStock.id, updateData);

      if (result.success) {
        alert('Stock updated successfully');
        setShowEditStockModal(false);
        setSelectedStock(null);
        loadStocks();
      } else {
        alert(result.message || 'Failed to update stock');
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Failed to update stock: ' + err.message);
    }
  };

  // Handle reduce stock
  const handleReduceStock = async (stockId, quantity, reason) => {
    if (!confirm(`Reduce ${quantity} units from this stock?`)) return;

    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    try {
      const result = await inventoryService.reduceStock({
        branchId: userData.branchId,
        productId: stock.productId,
        productName: stock.productName,
        quantity: quantity,
        reason: reason || 'stock_out',
        createdBy: userData.uid
      });

      if (result.success) {
        alert('Stock reduced successfully');
        loadStocks();
      } else {
        alert(result.message || 'Failed to reduce stock');
      }
    } catch (err) {
      console.error('Error reducing stock:', err);
      alert('Failed to reduce stock: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Out of Stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && stocks.length === 0) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Inventory Stocks">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading stocks...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Inventory Stocks">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inStockCount}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">₱{stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Controls */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddStockModal(true)}
                className="bg-[#160B53] hover:bg-[#160B53]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
              <Button variant="outline" onClick={loadStocks}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </Card>

        {/* Stocks Table */}
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Value</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Last Updated</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      {loading ? 'Loading...' : 'No stocks found'}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock) => (
                    <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{stock.productName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{stock.brand || ''}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-700">{stock.category || '-'}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{stock.currentStock || 0}</span>
                          {stock.maxStock && (
                            <span className="text-sm text-gray-500 ml-1">/ {stock.maxStock}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stock.status)}`}>
                          {stock.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">₱{(stock.unitCost || 0).toFixed(2)}</td>
                      <td className="py-4 px-4 text-gray-700">
                        ₱{((stock.currentStock || 0) * (stock.unitCost || 0)).toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {stock.lastUpdated ? format(new Date(stock.lastUpdated), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStock(stock);
                              setEditStockForm({
                                minStock: stock.minStock || '',
                                maxStock: stock.maxStock || '',
                                unitCost: stock.unitCost || '',
                                location: stock.location || '',
                                expiryDate: stock.expiryDate ? format(new Date(stock.expiryDate), 'yyyy-MM-dd') : ''
                              });
                              setShowEditStockModal(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStock(stock);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Alerts */}
        {stats.lowStockCount > 0 && (
          <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alert</h3>
                <p className="text-yellow-700">
                  {stats.lowStockCount} product{stats.lowStockCount > 1 ? 's' : ''} need{stats.lowStockCount === 1 ? 's' : ''} restocking
                </p>
              </div>
            </div>
          </Card>
        )}

        {stats.outOfStockCount > 0 && (
          <Card className="p-6 border-l-4 border-red-400 bg-red-50">
            <div className="flex items-center">
              <TrendingDown className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Out of Stock Alert</h3>
                <p className="text-red-700">
                  {stats.outOfStockCount} product{stats.outOfStockCount > 1 ? 's' : ''} out of stock
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Add Stock Modal */}
        {showAddStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Plus className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Add Stock</h2>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAddStockModal(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product *
                    </label>
                    <select
                      value={addStockForm.productId}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, productId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {product.brand}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={addStockForm.quantity}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, quantity: e.target.value }))}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <select
                      value={addStockForm.reason}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="restock">Restock</option>
                      <option value="purchase_order">Purchase Order</option>
                      <option value="transfer_in">Transfer In</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <Input
                      value={addStockForm.notes}
                      onChange={(e) => setAddStockForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddStockModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddStock}
                    className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  >
                    Add Stock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Stock Modal */}
        {showEditStockModal && selectedStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Edit className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Edit Stock</h2>
                      <p className="text-white/80 text-sm mt-1">{selectedStock.productName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowEditStockModal(false);
                      setSelectedStock(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Stock
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editStockForm.minStock}
                        onChange={(e) => setEditStockForm(prev => ({ ...prev, minStock: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Stock
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={editStockForm.maxStock}
                        onChange={(e) => setEditStockForm(prev => ({ ...prev, maxStock: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Cost
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editStockForm.unitCost}
                      onChange={(e) => setEditStockForm(prev => ({ ...prev, unitCost: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={editStockForm.location}
                      onChange={(e) => setEditStockForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g., Shelf A-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <Input
                      type="date"
                      value={editStockForm.expiryDate}
                      onChange={(e) => setEditStockForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditStockModal(false);
                      setSelectedStock(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStock}
                    className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  >
                    Update Stock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedStock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Eye className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Stock Details</h2>
                      <p className="text-white/80 text-sm mt-1">{selectedStock.productName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedStock(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Product Name</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.productName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Brand</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.brand || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.currentStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Min Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.minStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Max Stock</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.maxStock || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Unit Cost</p>
                    <p className="text-lg font-semibold text-gray-900">₱{(selectedStock.unitCost || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ₱{((selectedStock.currentStock || 0) * (selectedStock.unitCost || 0)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedStock.status)}`}>
                      {selectedStock.status || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.location || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Supplier</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedStock.supplier || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedStock.lastUpdated ? format(new Date(selectedStock.lastUpdated), 'MMM dd, yyyy HH:mm') : '-'}
                    </p>
                  </div>
                  {selectedStock.expiryDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Expiry Date</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(selectedStock.expiryDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedStock(null);
                    }}
                    className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  >
                    Close
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

export default InventoryStocks;



