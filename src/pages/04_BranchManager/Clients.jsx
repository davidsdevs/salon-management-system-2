// src/pages/04_BranchManager/Clients.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { branchManagerMenuItems } from './menuItems';
import { transactionApiService } from '../../services/transactionApiService';
import {
  Users,
  Search,
  DollarSign,
  Calendar,
  TrendingUp,
  Award,
  BarChart3,
  RefreshCw,
  ArrowUpDown,
  Phone,
  Mail,
  Clock,
  ShoppingBag,
  Activity,
  Filter,
  Download,
  Eye,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { openaiService } from '../../services/openaiService';
import { Sparkles, Loader2 as Loader2Icon } from 'lucide-react';

const Clients = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalSpending'); // 'totalSpending', 'visitCount', 'lastVisit', 'avgTransaction'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [dateRange, setDateRange] = useState('all'); // 'all', '7days', '30days', '90days', '1year'
  
  // Selected client for details
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // AI Insights states
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [clientRecommendations, setClientRecommendations] = useState(null);
  const [loadingClientAI, setLoadingClientAI] = useState(false);

  // Load transactions and aggregate client data
  const loadClientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userData?.branchId) {
        throw new Error('Branch ID not found');
      }

      // Calculate date range
      let startDate = null;
      const now = new Date();
      switch (dateRange) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      // Fetch all transactions for the branch
      // We'll fetch a large batch to get comprehensive data
      const allTransactions = [];
      let page = 1;
      let hasMore = true;
      const primaryRole = userData.roles?.[0] || userData.role || 'branchManager';

      while (hasMore && page <= 10) { // Limit to 10 pages to avoid infinite loops
        const response = await transactionApiService.getBranchTransactions(
          userData.branchId,
          primaryRole,
          {
            page,
            limit: 100,
            statusFilter: 'Paid' // Only get paid/completed transactions
          }
        );

        if (response.success && response.transactions) {
          const filteredTransactions = response.transactions.filter(t => {
            if (dateRange === 'all') return true;
            if (!t.createdAt) return false;
            const transactionDate = t.createdAt?.toDate 
              ? t.createdAt.toDate() 
              : new Date(t.createdAt);
            return transactionDate >= startDate;
          });
          
          allTransactions.push(...filteredTransactions);
          hasMore = response.hasMore && response.transactions.length > 0;
          page++;
        } else {
          hasMore = false;
        }
      }

      setTransactions(allTransactions);

      // Aggregate client data
      const clientMap = {};

      allTransactions.forEach(transaction => {
        const clientId = transaction.clientId;
        if (!clientId) return; // Skip transactions without clientId

        const clientName = transaction.clientInfo?.name || 'Unknown Client';
        const clientPhone = transaction.clientInfo?.phone || '';
        const clientEmail = transaction.clientInfo?.email || '';
        const transactionDate = transaction.createdAt?.toDate 
          ? transaction.createdAt.toDate() 
          : new Date(transaction.createdAt);
        const total = transaction.total || transaction.totalAmount || 0;

        if (!clientMap[clientId]) {
          clientMap[clientId] = {
            clientId,
            clientName,
            clientPhone,
            clientEmail,
            totalSpending: 0,
            visitCount: 0,
            transactions: [],
            services: {}, // Service name -> count
            products: {}, // Product name -> count
            firstVisit: transactionDate,
            lastVisit: transactionDate,
            totalDiscount: 0,
            totalLoyaltyEarned: 0
          };
        }

        clientMap[clientId].totalSpending += total;
        clientMap[clientId].visitCount += 1;
        clientMap[clientId].transactions.push(transaction);
        clientMap[clientId].totalDiscount += transaction.discount || 0;
        clientMap[clientId].totalLoyaltyEarned += transaction.loyaltyEarned || 0;

        // Update dates
        if (transactionDate < clientMap[clientId].firstVisit) {
          clientMap[clientId].firstVisit = transactionDate;
        }
        if (transactionDate > clientMap[clientId].lastVisit) {
          clientMap[clientId].lastVisit = transactionDate;
        }

        // Track services
        if (transaction.services && Array.isArray(transaction.services)) {
          transaction.services.forEach(service => {
            const serviceName = service.serviceName || service.name || 'Unknown Service';
            clientMap[clientId].services[serviceName] = (clientMap[clientId].services[serviceName] || 0) + 1;
          });
        }

        // Track products
        if (transaction.products && Array.isArray(transaction.products)) {
          transaction.products.forEach(product => {
            const productName = product.name || product.productName || 'Unknown Product';
            const quantity = product.quantity || 1;
            clientMap[clientId].products[productName] = (clientMap[clientId].products[productName] || 0) + quantity;
          });
        }
      });

      // Convert to array and calculate averages
      const clientsArray = Object.values(clientMap).map(client => {
        // Get top services
        const topServices = Object.entries(client.services)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));

        // Get top products
        const topProducts = Object.entries(client.products)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));

        return {
          ...client,
          avgTransactionValue: client.visitCount > 0 ? client.totalSpending / client.visitCount : 0,
          topServices,
          topProducts,
          daysSinceLastVisit: Math.floor((new Date() - client.lastVisit) / (1000 * 60 * 60 * 24))
        };
      });

      setClients(clientsArray);
    } catch (err) {
      console.error('Error loading client data:', err);
      setError(err.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  }, [userData, dateRange]);

  useEffect(() => {
    if (userData?.branchId) {
      loadClientData();
    }
  }, [userData?.branchId, dateRange, loadClientData]);

  // Calculate statistics (moved before useEffects that use it)
  const statistics = useMemo(() => {
    if (clients.length === 0) {
      return {
        totalClients: 0,
        totalRevenue: 0,
        totalVisits: 0,
        avgSpending: 0,
        avgVisits: 0
      };
    }

    const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpending, 0);
    const totalVisits = clients.reduce((sum, c) => sum + c.visitCount, 0);

    return {
      totalClients: clients.length,
      totalRevenue,
      totalVisits,
      avgSpending: totalRevenue / clients.length,
      avgVisits: totalVisits / clients.length
    };
  }, [clients]);

  // Load AI insights for overall analytics
  const loadAIInsights = async () => {
    if (!openaiService.isConfigured()) return;
    
    try {
      setLoadingInsights(true);
      const topSpenders = [...clients]
        .sort((a, b) => b.totalSpending - a.totalSpending)
        .slice(0, 5)
        .map(c => ({ name: c.clientName, totalSpending: c.totalSpending }));
      
      const insights = await openaiService.generateClientInsights({
        ...statistics,
        topSpenders
      });
      
      if (insights) {
        setAiInsights(insights);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Load AI insights when clients data is available
  useEffect(() => {
    if (clients.length > 0 && statistics && statistics.totalClients > 0 && openaiService.isConfigured()) {
      loadAIInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients.length, statistics?.totalClients]);

  // Load AI recommendations for individual client
  const loadClientAIRecommendations = async (client) => {
    if (!openaiService.isConfigured()) return;
    
    try {
      setLoadingClientAI(true);
      const recommendations = await openaiService.generateClientRecommendations(client);
      if (recommendations) {
        setClientRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error loading client AI recommendations:', error);
    } finally {
      setLoadingClientAI(false);
    }
  };

  // Filter and sort clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client =>
        client.clientName.toLowerCase().includes(searchLower) ||
        client.clientPhone?.includes(searchTerm) ||
        client.clientEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'totalSpending':
          aValue = a.totalSpending;
          bValue = b.totalSpending;
          break;
        case 'visitCount':
          aValue = a.visitCount;
          bValue = b.visitCount;
          break;
        case 'lastVisit':
          aValue = a.lastVisit.getTime();
          bValue = b.lastVisit.getTime();
          break;
        case 'avgTransaction':
          aValue = a.avgTransactionValue;
          bValue = b.avgTransactionValue;
          break;
        case 'name':
          aValue = a.clientName.toLowerCase();
          bValue = b.clientName.toLowerCase();
          break;
        default:
          aValue = a.totalSpending;
          bValue = b.totalSpending;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return filtered;
  }, [clients, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setShowDetailsModal(true);
    setClientRecommendations(null);
    if (openaiService.isConfigured()) {
      loadClientAIRecommendations(client);
    }
  };

  const getTopServicesList = (client) => {
    if (!client.topServices || client.topServices.length === 0) {
      return 'No services yet';
    }
    return client.topServices.map(s => `${s.name} (${s.count}x)`).join(', ');
  };

  return (
    <DashboardLayout
      menuItems={branchManagerMenuItems}
      pageTitle="Clients Analytics"
      pageDescription="View client spending, visit frequency, and service preferences"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients Analytics</h1>
            <p className="text-gray-600">View client spending, visit frequency, and service preferences</p>
          </div>
        </div>

        {/* AI Insights Card */}
        {openaiService.isConfigured() && (
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-600">Actionable recommendations based on your data</p>
                </div>
              </div>
              {loadingInsights && (
                <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
              )}
            </div>
            
            {aiInsights && !loadingInsights ? (
              <div className="space-y-4">
                {aiInsights.insights && aiInsights.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Insights</h4>
                    <ul className="space-y-1">
                      {aiInsights.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-purple-600 mt-1">•</span>
                          <span>{typeof insight === 'string' ? insight : insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {aiInsights.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">→</span>
                          <span>{typeof rec === 'string' ? rec : rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {aiInsights.opportunities && aiInsights.opportunities.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Growth Opportunities</h4>
                    <ul className="space-y-1">
                      {aiInsights.opportunities.map((opp, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">★</span>
                          <span>{typeof opp === 'string' ? opp : opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : !loadingInsights && (
              <Button
                onClick={loadAIInsights}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Generate AI Insights
              </Button>
            )}
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-[#160B53]" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{statistics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalVisits}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Spending</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{statistics.avgSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Visits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.avgVisits.toFixed(1)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>

              <Button
                onClick={loadClientData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Clients Table */}
        {loading ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#160B53] mb-4" />
            <p className="text-gray-600">Loading client data...</p>
          </Card>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadClientData} className="mt-4">
              Try Again
            </Button>
          </Card>
        ) : filteredAndSortedClients.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No clients found</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-2">
                        Client Name
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('visitCount')}>
                      <div className="flex items-center gap-2">
                        Visits
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('totalSpending')}>
                      <div className="flex items-center gap-2">
                        Total Spending
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('avgTransaction')}>
                      <div className="flex items-center gap-2">
                        Avg. Transaction
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('lastVisit')}>
                      <div className="flex items-center gap-2">
                        Last Visit
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Top Services
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedClients.map((client) => (
                    <tr key={client.clientId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.clientName}</div>
                          {client.clientPhone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.clientPhone}
                            </div>
                          )}
                          {client.clientEmail && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.clientEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.visitCount}</div>
                        <div className="text-xs text-gray-500">
                          {client.daysSinceLastVisit === 0 
                            ? 'Today' 
                            : client.daysSinceLastVisit === 1 
                            ? 'Yesterday' 
                            : `${client.daysSinceLastVisit} days ago`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₱{client.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {client.totalDiscount > 0 && (
                          <div className="text-xs text-green-600">
                            Saved: ₱{client.totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ₱{client.avgTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(client.lastVisit, 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(client.firstVisit, 'MMM dd, yyyy')} (first)
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={getTopServicesList(client)}>
                          {getTopServicesList(client)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          onClick={() => handleViewDetails(client)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Client Details Modal */}
        {showDetailsModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedClient.clientName}</h2>
                      <p className="text-white/80 text-sm mt-1">Client Analytics & Transaction History</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowDetailsModal(false)}
                    variant="ghost"
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* Client Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Spending</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{selectedClient.totalSpending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total Visits</p>
                    <p className="text-xl font-bold text-gray-900">{selectedClient.visitCount}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Avg. Transaction</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{selectedClient.avgTransactionValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Loyalty Points</p>
                    <p className="text-xl font-bold text-gray-900">{selectedClient.totalLoyaltyEarned}</p>
                  </div>
                </div>

                {/* Contact Info */}
                {(selectedClient.clientPhone || selectedClient.clientEmail) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <div className="flex flex-wrap gap-4">
                      {selectedClient.clientPhone && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="h-4 w-4" />
                          {selectedClient.clientPhone}
                        </div>
                      )}
                      {selectedClient.clientEmail && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4" />
                          {selectedClient.clientEmail}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Top Services */}
                {selectedClient.topServices && selectedClient.topServices.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Used Services</h3>
                    <div className="space-y-2">
                      {selectedClient.topServices.map((service, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">{service.name}</span>
                          <span className="text-sm font-semibold text-[#160B53]">{service.count}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Products */}
                {selectedClient.topProducts && selectedClient.topProducts.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Purchased Products</h3>
                    <div className="space-y-2">
                      {selectedClient.topProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-gray-900">{product.name}</span>
                          <span className="text-sm font-semibold text-[#160B53]">{product.count} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Client Recommendations */}
                {openaiService.isConfigured() && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
                      </div>
                      {loadingClientAI && (
                        <Loader2Icon className="h-5 w-5 animate-spin text-purple-600" />
                      )}
                    </div>
                    
                    {clientRecommendations && !loadingClientAI ? (
                      <div className="space-y-3">
                        {clientRecommendations.valueAssessment && (
                          <div className="p-3 bg-white rounded-lg">
                            <p className="text-sm font-semibold text-gray-700 mb-1">Client Value</p>
                            <p className="text-sm text-gray-900">{clientRecommendations.valueAssessment}</p>
                          </div>
                        )}
                        
                        {clientRecommendations.recommendations && clientRecommendations.recommendations.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Personalized Recommendations</p>
                            <ul className="space-y-1">
                              {clientRecommendations.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-blue-600 mt-1">→</span>
                                  <span>{typeof rec === 'string' ? rec : rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {clientRecommendations.reEngagement && clientRecommendations.reEngagement.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-2">Re-engagement Strategies</p>
                            <ul className="space-y-1">
                              {clientRecommendations.reEngagement.map((strategy, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-green-600 mt-1">★</span>
                                  <span>{typeof strategy === 'string' ? strategy : strategy}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : !loadingClientAI && (
                      <p className="text-sm text-gray-600">AI recommendations will appear here...</p>
                    )}
                  </div>
                )}

                {/* Recent Transactions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Transactions</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedClient.transactions
                      .sort((a, b) => {
                        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                        return bDate - aDate;
                      })
                      .slice(0, 10)
                      .map((transaction, index) => {
                        const transactionDate = transaction.createdAt?.toDate 
                          ? transaction.createdAt.toDate() 
                          : new Date(transaction.createdAt);
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(transactionDate, 'MMM dd, yyyy HH:mm')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.services?.map(s => s.serviceName || s.name).join(', ') || 'No services'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                ₱{(transaction.total || transaction.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {transaction.discount > 0 && (
                                <p className="text-xs text-green-600">
                                  -₱{transaction.discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Clients;

