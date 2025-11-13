// src/pages/02_OperationalManager/PriceHistory.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import { productService } from '../../services/productService';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  DollarSign,
  Search,
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Package,
  Home,
  BarChart3,
  ShoppingCart,
  Award,
  MapPin,
  Users,
  UserCog,
  ArrowUpDown,
  Download,
  Lightbulb,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PriceHistory = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/operational-manager/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-reports', label: 'Appointments', icon: Calendar },
    { path: '/branch-monitoring', label: 'Branch Monitoring', icon: MapPin },
    { path: '/operational-manager/clients', label: 'Client Reports', icon: Users },
    { path: '/operational-manager/loyalty-summary', label: 'Loyalty Summary', icon: Award },
    { path: '/operational-manager/inventory', label: 'Inventory', icon: Package },
    { path: '/operational-manager/price-history', label: 'Price History', icon: DollarSign },
    { path: '/operational-manager/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/operational-manager/deposits', label: 'Deposit Reviews', icon: DollarSign },
    { path: '/operational-manager/reports', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const [products, setProducts] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days

  // Load products
  const loadProducts = async () => {
    try {
      const result = await productService.getAllProducts();
      if (result.success) {
        setProducts(result.products);
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err.message);
    }
  };

  // Load price history from transactions with sales insights
  const loadPriceHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get transactions to track price changes and sales
      const transactionsRef = collection(db, 'transactions');
      const days = parseInt(dateRange) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Query without orderBy to avoid index requirements - we'll sort client-side
      // Use 'paid' status for completed transactions (not 'completed' which is for appointments)
      const q = query(
        transactionsRef,
        where('status', '==', 'paid'),
        limit(5000) // Increased limit to get more transaction data
      );

      const transactionsSnapshot = await getDocs(q);
      const priceMap = {}; // productId -> array of price points with sales data
      const allTransactions = [];

      // First pass: collect all transaction data
      transactionsSnapshot.forEach(doc => {
        const transaction = doc.data();
        const transactionDate = transaction.createdAt?.toDate ? transaction.createdAt.toDate() : 
                               transaction.createdAt instanceof Date ? transaction.createdAt :
                               transaction.timestamp?.toDate ? transaction.timestamp.toDate() :
                               new Date();
        
        // Filter by date range
        if (transactionDate >= startDate) {
          allTransactions.push({
            ...transaction,
            transactionDate,
            transactionId: doc.id
          });
        }
      });

      // Sort by date (descending) client-side
      allTransactions.sort((a, b) => b.transactionDate - a.transactionDate);

      // Second pass: process products and group by price
      allTransactions.forEach(transaction => {
        if (transaction.products && Array.isArray(transaction.products)) {
          transaction.products.forEach(product => {
            const productId = product.productId || product.id;
            const price = product.price || product.unitPrice || 0;
            const quantity = product.quantity || 1;
            const revenue = price * quantity;

            if (!priceMap[productId]) {
              priceMap[productId] = {
                pricePoints: [],
                salesByPrice: {} // price -> { quantity, revenue, transactionCount, dates }
              };
            }

            // Track sales by price
            const priceKey = price.toFixed(2);
            if (!priceMap[productId].salesByPrice[priceKey]) {
              priceMap[productId].salesByPrice[priceKey] = {
                price: price,
                quantity: 0,
                revenue: 0,
                transactionCount: 0,
                dates: []
              };
            }

            priceMap[productId].salesByPrice[priceKey].quantity += quantity;
            priceMap[productId].salesByPrice[priceKey].revenue += revenue;
            priceMap[productId].salesByPrice[priceKey].transactionCount += 1;
            priceMap[productId].salesByPrice[priceKey].dates.push(transaction.transactionDate);

            // Track price points
            priceMap[productId].pricePoints.push({
              date: transaction.transactionDate,
              price,
              quantity,
              revenue,
              transactionId: transaction.transactionId
            });
          });
        }
      });

      // Process price history for each product with sales insights
      const history = [];
      for (const product of products) {
        const productData = priceMap[product.id];
        if (productData && productData.pricePoints.length > 0) {
          // Get unique prices and dates
          const uniquePrices = [];
          const priceDates = {};
          
          productData.pricePoints.forEach(point => {
            const dateKey = format(point.date, 'yyyy-MM-dd');
            if (!priceDates[dateKey] || priceDates[dateKey].price !== point.price) {
              priceDates[dateKey] = point;
              uniquePrices.push({
                date: point.date,
                price: point.price,
                dateKey
              });
            }
          });

          // Sort by date
          uniquePrices.sort((a, b) => a.date - b.date);

          if (uniquePrices.length > 0) {
            const currentPrice = product.otcPrice || 0;
            const oldestPrice = uniquePrices[0].price;
            const latestPrice = uniquePrices[uniquePrices.length - 1].price;
            const priceChange = latestPrice - oldestPrice;
            const priceChangePercent = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100) : 0;

            // Analyze sales by price
            const salesByPrice = Object.values(productData.salesByPrice).map(sales => ({
              price: sales.price,
              quantity: sales.quantity,
              revenue: sales.revenue,
              transactionCount: sales.transactionCount,
              avgQuantityPerTransaction: sales.quantity / sales.transactionCount,
              dateRange: {
                start: new Date(Math.min(...sales.dates)),
                end: new Date(Math.max(...sales.dates))
              }
            })).sort((a, b) => a.price - b.price);

            // Calculate sales insights
            const insights = calculateSalesInsights(salesByPrice);

            history.push({
              productId: product.id,
              productName: product.name,
              brand: product.brand,
              category: product.category,
              currentPrice,
              oldestPrice,
              latestPrice,
              priceChange,
              priceChangePercent,
              pricePoints: uniquePrices,
              dataPoints: uniquePrices.length,
              salesByPrice,
              insights
            });
          }
        }
      }

      setPriceHistory(history);
    } catch (err) {
      console.error('Error loading price history:', err);
      setError(err.message || 'Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  // Calculate sales insights comparing different price points
  const calculateSalesInsights = (salesByPrice) => {
    if (salesByPrice.length < 2) {
      return {
        bestPrice: salesByPrice[0]?.price || 0,
        worstPrice: salesByPrice[0]?.price || 0,
        insights: []
      };
    }

    // Find best and worst performing prices
    let bestPrice = salesByPrice[0];
    let worstPrice = salesByPrice[0];
    let highestQuantity = salesByPrice[0].quantity;
    let lowestQuantity = salesByPrice[0].quantity;

    salesByPrice.forEach(sales => {
      if (sales.quantity > highestQuantity) {
        highestQuantity = sales.quantity;
        bestPrice = sales;
      }
      if (sales.quantity < lowestQuantity) {
        lowestQuantity = sales.quantity;
        worstPrice = sales;
      }
    });

    // Generate insights
    const insights = [];
    
    // Compare each price point with others
    salesByPrice.forEach((currentSales, index) => {
      const otherSales = salesByPrice.filter((_, i) => i !== index);
      
      otherSales.forEach(otherSales => {
        const quantityDiff = currentSales.quantity - otherSales.quantity;
        const quantityDiffPercent = otherSales.quantity > 0 
          ? ((quantityDiff / otherSales.quantity) * 100) 
          : 0;
        const priceDiff = currentSales.price - otherSales.price;
        const priceDiffPercent = otherSales.price > 0 
          ? ((priceDiff / otherSales.price) * 100) 
          : 0;

        if (Math.abs(quantityDiffPercent) > 10) { // Only show significant differences (>10%)
          insights.push({
            price: currentSales.price,
            comparePrice: otherSales.price,
            quantityDiff,
            quantityDiffPercent,
            priceDiff,
            priceDiffPercent,
            performance: quantityDiff > 0 ? 'better' : 'worse',
            message: `At ₱${currentSales.price.toFixed(2)}, sales were ${Math.abs(quantityDiffPercent).toFixed(1)}% ${quantityDiff > 0 ? 'higher' : 'lower'} than at ₱${otherSales.price.toFixed(2)} (${quantityDiff > 0 ? '+' : ''}${quantityDiff.toFixed(0)} units)`
          });
        }
      });
    });

    return {
      bestPrice: bestPrice.price,
      worstPrice: worstPrice.price,
      bestQuantity: bestPrice.quantity,
      worstQuantity: worstPrice.quantity,
      insights: insights.slice(0, 10) // Limit to top 10 insights
    };
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      loadPriceHistory();
    }
  }, [products.length, dateRange]);

  // Get unique categories
  const categories = useMemo(() => {
    return [...new Set(priceHistory.map(item => item.category).filter(Boolean))];
  }, [priceHistory]);

  // Filter price history
  const filteredHistory = useMemo(() => {
    return priceHistory.filter(item => {
      const matchesSearch = 
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      // Sort by price change percentage (descending)
      return Math.abs(b.priceChangePercent) - Math.abs(a.priceChangePercent);
    });
  }, [priceHistory, searchTerm, categoryFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalProducts = priceHistory.length;
    const priceIncreases = priceHistory.filter(item => item.priceChange > 0).length;
    const priceDecreases = priceHistory.filter(item => item.priceChange < 0).length;
    const noChange = priceHistory.filter(item => item.priceChange === 0).length;
    const avgChange = priceHistory.length > 0
      ? priceHistory.reduce((sum, item) => sum + item.priceChangePercent, 0) / priceHistory.length
      : 0;

    return {
      totalProducts,
      priceIncreases,
      priceDecreases,
      noChange,
      avgChange
    };
  }, [priceHistory]);

  // Handle view details
  const handleViewDetails = (item) => {
    setSelectedProduct(item);
    setIsDetailsModalOpen(true);
  };

  if (loading && priceHistory.length === 0) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Price History">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading price history...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Price History">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Price History</h1>
            <p className="text-gray-600">Track product price changes over time</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </select>
            <Button onClick={loadPriceHistory} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
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
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Price Increases</p>
                <p className="text-xl font-bold text-gray-900">{stats.priceIncreases}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Price Decreases</p>
                <p className="text-xl font-bold text-gray-900">{stats.priceDecreases}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <ArrowUpDown className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">No Change</p>
                <p className="text-xl font-bold text-gray-900">{stats.noChange}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Change</p>
                <p className={`text-xl font-bold ${stats.avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by product name, brand, or category..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Price History Table */}
        {filteredHistory.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Oldest Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Points
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredHistory.map((item) => (
                    <tr key={item.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.brand}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.category || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₱{item.currentPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₱{item.oldestPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₱{item.latestPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center gap-1 text-sm font-semibold ${
                          item.priceChange > 0 ? 'text-green-600' : item.priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {item.priceChange > 0 && <TrendingUp className="h-4 w-4" />}
                          {item.priceChange < 0 && <TrendingDown className="h-4 w-4" />}
                          {item.priceChange === 0 && <ArrowUpDown className="h-4 w-4" />}
                          <span>
                            {item.priceChange >= 0 ? '+' : ''}₱{item.priceChange.toFixed(2)}
                          </span>
                          <span className="text-xs">
                            ({item.priceChangePercent >= 0 ? '+' : ''}{item.priceChangePercent.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{item.dataPoints}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Chart
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Price History Found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No price history data available for the selected period'}
            </p>
          </Card>
        )}

        {/* Price History Chart Modal */}
        {isDetailsModalOpen && selectedProduct && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedProduct(null);
            }}
            title={`Price History & Sales Insights - ${selectedProduct.productName}`}
            size="xl"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">Current Price</label>
                  <p className="text-lg font-bold text-gray-900">₱{selectedProduct.currentPrice.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">Price Change</label>
                  <p className={`text-lg font-bold ${selectedProduct.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedProduct.priceChange >= 0 ? '+' : ''}₱{selectedProduct.priceChange.toFixed(2)}
                    <span className="text-sm ml-1">
                      ({selectedProduct.priceChangePercent >= 0 ? '+' : ''}{selectedProduct.priceChangePercent.toFixed(2)}%)
                    </span>
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="text-sm font-medium text-gray-500">Data Points</label>
                  <p className="text-lg font-bold text-gray-900">{selectedProduct.dataPoints}</p>
                </div>
              </div>

              {/* Transaction Insights */}
              {selectedProduct.insights && selectedProduct.insights.insights && selectedProduct.insights.insights.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <h4 className="font-semibold text-gray-900">Transaction Insights</h4>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedProduct.insights.insights.map((insight, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border-l-4 ${
                          insight.performance === 'better' 
                            ? 'bg-green-50 border-green-500' 
                            : 'bg-red-50 border-red-500'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {insight.performance === 'better' ? (
                            <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                          )}
                          <p className="text-sm text-gray-700">{insight.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales by Price Chart */}
              {selectedProduct.salesByPrice && selectedProduct.salesByPrice.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Sales Performance by Price</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={selectedProduct.salesByPrice.map(sales => ({
                        price: `₱${sales.price.toFixed(2)}`,
                        quantity: sales.quantity,
                        revenue: sales.revenue,
                        transactions: sales.transactionCount
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="price" 
                          tick={{ fontSize: 11 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'quantity') return [value.toFixed(0), 'Units Sold'];
                            if (name === 'revenue') return [`₱${value.toFixed(2)}`, 'Revenue'];
                            if (name === 'transactions') return [value, 'Transactions'];
                            return [value, name];
                          }}
                        />
                        <Legend />
                        <Bar dataKey="quantity" fill="#2563EB" name="Units Sold" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Price vs Sales Chart */}
              {selectedProduct.pricePoints && selectedProduct.pricePoints.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Price Trend</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedProduct.pricePoints.map(point => ({
                        date: format(point.date, 'MMM dd'),
                        price: point.price,
                        fullDate: format(point.date, 'MMM dd, yyyy')
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `₱${value.toFixed(0)}`}
                        />
                        <Tooltip 
                          formatter={(value) => [`₱${value.toFixed(2)}`, 'Price']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#2563EB" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          name="Price"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Sales by Price Table */}
              {selectedProduct.salesByPrice && selectedProduct.salesByPrice.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Sales Breakdown by Price</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg/Transaction</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedProduct.salesByPrice.map((sales, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900">
                              ₱{sales.price.toFixed(2)}
                              {sales.price === selectedProduct.insights?.bestPrice && (
                                <span className="ml-2 text-xs text-green-600 font-semibold">(Best Sales)</span>
                              )}
                              {sales.price === selectedProduct.insights?.worstPrice && (
                                <span className="ml-2 text-xs text-red-600 font-semibold">(Lowest Sales)</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-900">{sales.quantity.toFixed(0)}</td>
                            <td className="px-4 py-2 text-gray-900">₱{sales.revenue.toFixed(2)}</td>
                            <td className="px-4 py-2 text-gray-900">{sales.transactionCount}</td>
                            <td className="px-4 py-2 text-gray-900">{sales.avgQuantityPerTransaction.toFixed(2)}</td>
                            <td className="px-4 py-2 text-gray-600 text-xs">
                              {format(sales.dateRange.start, 'MMM dd')} - {format(sales.dateRange.end, 'MMM dd, yyyy')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Price Timeline</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedProduct.pricePoints && selectedProduct.pricePoints.length > 0 ? (
                    selectedProduct.pricePoints
                      .sort((a, b) => b.date - a.date)
                      .map((point, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm text-gray-600">
                            {format(point.date, 'MMM dd, yyyy')}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            ₱{point.price.toFixed(2)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-gray-500">No price history data available</p>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PriceHistory;

