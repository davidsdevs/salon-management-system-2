// src/pages/04_BranchManager/InventoryReports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { branchManagerMenuItems } from './menuItems';
import { inventoryService } from '../../services/inventoryService';
import {
  BarChart3,
  Search,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  FileText,
  PieChart,
  LineChart,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const InventoryReports = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date range
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // Data
  const [salesData, setSalesData] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load reports data
  const loadReports = async () => {
    if (!userData?.branchId) {
      setError('Branch ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load inventory sales
      const salesResult = await inventoryService.getInventorySales(
        userData.branchId,
        startDate,
        endDate
      );

      if (salesResult.success) {
        setSalesData(salesResult.salesData);
        
        // Calculate top selling products
        const sorted = [...salesResult.salesData].sort((a, b) => 
          (b.totalRevenue || 0) - (a.totalRevenue || 0)
        );
        setTopSellingProducts(sorted.slice(0, 10));
      }

      // Load inventory statistics
      const statsResult = await inventoryService.getInventoryStats(userData.branchId);
      if (statsResult.success) {
        setInventoryStats(statsResult.stats);
        
        // Get low stock products
        const stocksResult = await inventoryService.getBranchStocks(userData.branchId, {
          status: 'Low Stock'
        });
        if (stocksResult.success) {
          setLowStockProducts(stocksResult.stocks.slice(0, 10));
        }
      }

    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [userData?.branchId, startDate, endDate]);

  // Filter and sort sales data
  const filteredSalesData = useMemo(() => {
    let filtered = salesData.filter(item => {
      const matchesSearch = 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || 0;
      let bValue = b[sortBy] || 0;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [salesData, searchTerm, sortBy, sortOrder]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRevenue = salesData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
    const totalQuantitySold = salesData.reduce((sum, item) => sum + (item.quantitySold || 0), 0);
    const totalCost = salesData.reduce((sum, item) => {
      const cost = (item.quantitySold || 0) * (item.unitCost || 0);
      return sum + cost;
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = salesData.length > 0 ? totalRevenue / salesData.length : 0;

    return {
      totalRevenue,
      totalQuantitySold,
      totalCost,
      totalProfit,
      profitMargin,
      avgOrderValue,
      totalProducts: salesData.length
    };
  }, [salesData]);

  if (loading && !salesData.length) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Inventory Reports">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading reports...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Inventory Reports">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Reports</h1>
            <p className="text-gray-600">Sales analysis and inventory insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={loadReports}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button
              onClick={loadReports}
              variant="outline"
              className="ml-4"
            >
              Apply
            </Button>
          </div>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{summaryStats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className="text-2xl font-bold text-gray-900">₱{summaryStats.totalProfit.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Units Sold</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalQuantitySold}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.profitMargin.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Inventory Statistics */}
        {inventoryStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStats.totalProducts}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStats.inStockCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{inventoryStats.lowStockCount}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">₱{inventoryStats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Top Selling Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Selling Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Margin</th>
                </tr>
              </thead>
              <tbody>
                {topSellingProducts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">
                      No sales data for this period
                    </td>
                  </tr>
                ) : (
                  topSellingProducts.map((product, index) => {
                    const profit = (product.totalRevenue || 0) - ((product.quantitySold || 0) * (product.unitCost || 0));
                    const margin = (product.totalRevenue || 0) > 0 
                      ? (profit / product.totalRevenue) * 100 
                      : 0;
                    return (
                      <tr key={product.productId || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{product.productName || 'Unknown'}</p>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{product.quantitySold || 0}</td>
                        <td className="py-4 px-4 text-gray-700">₱{(product.totalRevenue || 0).toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-700">₱{profit.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-700">{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Sales Data Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sales by Product</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="totalRevenue-desc">Revenue: High to Low</option>
                <option value="totalRevenue-asc">Revenue: Low to High</option>
                <option value="quantitySold-desc">Quantity: High to Low</option>
                <option value="quantitySold-asc">Quantity: Low to High</option>
                <option value="profit-desc">Profit: High to Low</option>
                <option value="profit-asc">Profit: Low to High</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity Sold</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Unit Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Profit</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Margin</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      {loading ? 'Loading...' : 'No sales data found'}
                    </td>
                  </tr>
                ) : (
                  filteredSalesData.map((item, index) => {
                    const totalCost = (item.quantitySold || 0) * (item.unitCost || 0);
                    const profit = (item.totalRevenue || 0) - totalCost;
                    const margin = (item.totalRevenue || 0) > 0 
                      ? (profit / item.totalRevenue) * 100 
                      : 0;
                    return (
                      <tr key={item.productId || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{item.productName || 'Unknown'}</p>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{item.quantitySold || 0}</td>
                        <td className="py-4 px-4 text-gray-700">₱{(item.unitCost || 0).toFixed(2)}</td>
                        <td className="py-4 px-4 text-gray-700">₱{totalCost.toLocaleString()}</td>
                        <td className="py-4 px-4 text-gray-700">₱{(item.totalRevenue || 0).toLocaleString()}</td>
                        <td className={`py-4 px-4 font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{profit.toLocaleString()}
                        </td>
                        <td className={`py-4 px-4 font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {margin.toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 text-gray-700">{item.currentStock || 0}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-yellow-800">Low Stock Products</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-yellow-200">
                    <th className="text-left py-3 px-4 font-semibold text-yellow-800">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-yellow-800">Current Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-yellow-800">Min Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-yellow-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((product) => (
                    <tr key={product.id} className="border-b border-yellow-100">
                      <td className="py-4 px-4">
                        <p className="font-medium text-yellow-900">{product.productName || 'Unknown'}</p>
                      </td>
                      <td className="py-4 px-4 text-yellow-800">{product.currentStock || 0}</td>
                      <td className="py-4 px-4 text-yellow-800">{product.minStock || 0}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-800 bg-yellow-200">
                          {product.status || 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default InventoryReports;

