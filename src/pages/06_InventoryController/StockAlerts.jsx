// src/pages/06_InventoryController/StockAlerts.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import {
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Download,
  Upload,
  RefreshCw,
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
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const StockAlerts = () => {
  const { userData } = useAuth();
  
  // Data states
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    category: 'all',
    branch: 'all'
  });

  // Mock alert data
  const mockAlerts = [
    {
      id: 'ALERT-001',
      productId: 'prod1',
      productName: 'Olaplex No.3 Hair Perfector',
      brand: 'Olaplex',
      category: 'Hair Care',
      currentStock: 5,
      minStock: 10,
      maxStock: 50,
      unitCost: 1400,
      totalValue: 7000,
      priority: 'High',
      status: 'Active',
      alertType: 'Low Stock',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf A-1',
      supplier: 'Olaplex Philippines',
      lastRestocked: new Date('2024-01-05'),
      expectedRestock: new Date('2024-01-20'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      notes: 'Urgent restock needed for weekend rush',
      actionTaken: null,
      resolvedAt: null
    },
    {
      id: 'ALERT-002',
      productId: 'prod2',
      productName: 'L\'Oréal Hair Color',
      brand: 'L\'Oréal',
      category: 'Hair Color',
      currentStock: 0,
      minStock: 15,
      maxStock: 30,
      unitCost: 800,
      totalValue: 0,
      priority: 'Critical',
      status: 'Active',
      alertType: 'Out of Stock',
      branchId: 'branch2',
      branchName: 'SM Mall of Asia',
      location: 'Shelf B-2',
      supplier: 'L\'Oréal Philippines',
      lastRestocked: new Date('2023-12-20'),
      expectedRestock: new Date('2024-01-25'),
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
      notes: 'Product completely out of stock',
      actionTaken: 'Purchase order created',
      resolvedAt: null
    },
    {
      id: 'ALERT-003',
      productId: 'prod3',
      productName: 'Kerastase Shampoo',
      brand: 'Kerastase',
      category: 'Hair Care',
      currentStock: 8,
      minStock: 12,
      maxStock: 40,
      unitCost: 1200,
      totalValue: 9600,
      priority: 'Medium',
      status: 'Resolved',
      alertType: 'Low Stock',
      branchId: 'branch1',
      branchName: 'Harbor Point Ayala',
      location: 'Shelf C-1',
      supplier: 'Kerastase Philippines',
      lastRestocked: new Date('2024-01-12'),
      expectedRestock: new Date('2024-01-18'),
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-12'),
      notes: 'Stock level below minimum threshold',
      actionTaken: 'Stock transferred from other branch',
      resolvedAt: new Date('2024-01-12')
    },
    {
      id: 'ALERT-004',
      productId: 'prod4',
      productName: 'Wella Hair Color',
      brand: 'Wella',
      category: 'Hair Color',
      currentStock: 3,
      minStock: 8,
      maxStock: 25,
      unitCost: 900,
      totalValue: 2700,
      priority: 'High',
      status: 'Active',
      alertType: 'Low Stock',
      branchId: 'branch3',
      branchName: 'Greenbelt 5',
      location: 'Shelf D-2',
      supplier: 'Wella Philippines',
      lastRestocked: new Date('2024-01-03'),
      expectedRestock: new Date('2024-01-22'),
      createdAt: new Date('2024-01-14'),
      updatedAt: new Date('2024-01-14'),
      notes: 'Running low on popular color',
      actionTaken: null,
      resolvedAt: null
    }
  ];

  // Load alerts
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data
      setAlerts(mockAlerts);
      
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);

  // Get unique categories and branches
  const categories = [...new Set(alerts.map(a => a.category))].filter(Boolean);
  const branches = [...new Set(alerts.map(a => a.branchName))].filter(Boolean);

  // Filter and sort alerts
  const filteredAlerts = alerts
    .filter(alert => {
      const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           alert.alertType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filters.priority === 'all' || alert.priority === filters.priority;
      const matchesStatus = filters.status === 'all' || alert.status === filters.status;
      const matchesCategory = filters.category === 'all' || alert.category === filters.category;
      const matchesBranch = filters.branch === 'all' || alert.branchName === filters.branch;
      
      return matchesSearch && matchesPriority && matchesStatus && matchesCategory && matchesBranch;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'resolvedAt' || sortBy === 'lastRestocked' || sortBy === 'expectedRestock') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle alert details
  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setIsDetailsModalOpen(true);
  };

  // Handle create alert
  const handleCreateAlert = () => {
    setIsCreateModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted');
    setIsCreateModalOpen(false);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'Critical': return <AlertCircle className="h-4 w-4" />;
      case 'High': return <AlertTriangle className="h-4 w-4" />;
      case 'Medium': return <Clock className="h-4 w-4" />;
      case 'Low': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'text-red-600 bg-red-100';
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'Dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <AlertTriangle className="h-4 w-4" />;
      case 'Resolved': return <CheckCircle className="h-4 w-4" />;
      case 'Dismissed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate alert statistics
  const alertStats = {
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter(a => a.status === 'Active').length,
    resolvedAlerts: alerts.filter(a => a.status === 'Resolved').length,
    criticalAlerts: alerts.filter(a => a.priority === 'Critical').length,
    highPriorityAlerts: alerts.filter(a => a.priority === 'High').length,
    totalValue: alerts.reduce((sum, a) => sum + a.totalValue, 0)
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading stock alerts...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Stock Alerts</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadAlerts} className="flex items-center gap-2">
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
            <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-600">Monitor low stock levels and inventory alerts</p>
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
            <Button onClick={handleCreateAlert} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-xl font-bold text-gray-900">{alertStats.totalAlerts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">{alertStats.activeAlerts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-xl font-bold text-gray-900">{alertStats.resolvedAlerts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-xl font-bold text-gray-900">{alertStats.criticalAlerts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-xl font-bold text-gray-900">{alertStats.highPriorityAlerts}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">₱{alertStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search by product name, brand, or alert type..."
                value={searchTerm}
                onChange={setSearchTerm}
                className="w-full"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
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
                  priority: 'all',
                  status: 'all',
                  category: 'all',
                  branch: 'all'
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Alerts Table */}
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
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alert Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{alert.productName}</div>
                        <div className="text-sm text-gray-500">{alert.brand} • {alert.category}</div>
                        <div className="text-xs text-gray-400">UPC: {alert.productId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{alert.currentStock}</div>
                      <div className="text-xs text-gray-500">Min: {alert.minStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                        {getPriorityIcon(alert.priority)}
                        {alert.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                        {getStatusIcon(alert.status)}
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{alert.branchName}</div>
                      <div className="text-xs text-gray-500">{alert.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{alert.alertType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{format(new Date(alert.createdAt), 'MMM dd, yyyy')}</div>
                      <div className="text-xs text-gray-500">{format(new Date(alert.createdAt), 'HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(alert)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        {alert.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            Order
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <Card className="p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stock Alerts Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Great! No stock alerts at the moment'
              }
            </p>
            <Button onClick={handleCreateAlert} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </Card>
        )}

        {/* Alert Details Modal */}
        {isDetailsModalOpen && selectedAlert && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedAlert(null);
            }}
            title="Alert Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Alert Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAlert.productName}</h2>
                  <p className="text-gray-600">{selectedAlert.brand} • {selectedAlert.category}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedAlert.priority)}`}>
                    {getPriorityIcon(selectedAlert.priority)}
                    {selectedAlert.priority}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAlert.status)}`}>
                    {getStatusIcon(selectedAlert.status)}
                    {selectedAlert.status}
                  </span>
                </div>
              </div>

              {/* Alert Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Stock</label>
                    <p className="text-2xl font-bold text-red-600">{selectedAlert.currentStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Minimum Stock Level</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedAlert.minStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Maximum Stock Level</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedAlert.maxStock} units</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Alert Type</label>
                    <p className="text-gray-900">{selectedAlert.alertType}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <p className="text-2xl font-bold text-gray-900">₱{selectedAlert.totalValue.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Unit Cost</label>
                    <p className="text-lg font-semibold text-gray-900">₱{selectedAlert.unitCost.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Branch</label>
                    <p className="text-gray-900">{selectedAlert.branchName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900">{selectedAlert.location}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Supplier</label>
                  <p className="text-gray-900">{selectedAlert.supplier}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Restocked</label>
                  <p className="text-gray-900">{format(new Date(selectedAlert.lastRestocked), 'MMM dd, yyyy')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Expected Restock</label>
                  <p className="text-gray-900">{format(new Date(selectedAlert.expectedRestock), 'MMM dd, yyyy')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">{format(new Date(selectedAlert.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {/* Notes and Action Taken */}
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">{selectedAlert.notes}</p>
              </div>

              {selectedAlert.actionTaken && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Action Taken</label>
                  <p className="text-gray-900 bg-green-50 p-3 rounded-lg mt-1">{selectedAlert.actionTaken}</p>
                </div>
              )}

              {selectedAlert.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Resolved At</label>
                  <p className="text-gray-900">{format(new Date(selectedAlert.resolvedAt), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              )}

              {/* Stock Level Indicator */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Stock Level Indicator</h4>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      selectedAlert.currentStock <= selectedAlert.minStock ? 'bg-red-500' :
                      selectedAlert.currentStock <= selectedAlert.minStock * 1.5 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((selectedAlert.currentStock / selectedAlert.maxStock) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>0</span>
                  <span>{selectedAlert.minStock} (Min)</span>
                  <span>{selectedAlert.maxStock} (Max)</span>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Create Alert Modal */}
        {isCreateModalOpen && (
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Create Stock Alert"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select Priority</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
                  <option value="">Select Alert Type</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Overstock">Overstock</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional notes about this alert..."
                ></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Create Alert
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Branch</label>
                <select
                  value={filters.branch}
                  onChange={(e) => setFilters(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  priority: 'all',
                  status: 'all',
                  category: 'all',
                  branch: 'all'
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

export default StockAlerts;