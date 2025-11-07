// src/pages/06_InventoryController/Suppliers.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { SearchInput } from '../ui/search-input';
import Modal from '../ui/modal';
import {
  Building,
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
  Phone,
  Mail,
  MapPin,
  Globe,
  DollarSign,
  Package,
  Calendar,
  Star,
  Users,
  Truck,
  FileText,
  Home,
  TrendingUp,
  ArrowRightLeft,
  QrCode,
  ShoppingCart,
  BarChart3,
  ClipboardList,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';

const Suppliers = () => {
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
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    rating: 'all',
    paymentTerms: 'all'
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    category: '',
    paymentTerms: '',
    rating: 5,
    notes: '',
    isActive: true
  });

  // Mock supplier data - in real app, this would come from API
  const mockSuppliers = [
    {
      id: '1',
      name: 'Olaplex Philippines',
      contactPerson: 'Maria Santos',
      email: 'maria@olaplex.ph',
      phone: '+63 2 8888 1234',
      address: '123 Business Ave, Makati City, Metro Manila',
      website: 'https://olaplex.ph',
      category: 'Hair Care',
      paymentTerms: 'Net 30',
      rating: 5,
      totalOrders: 45,
      totalValue: 1250000,
      lastOrder: new Date('2024-01-10'),
      notes: 'Reliable supplier with excellent product quality',
      isActive: true,
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'L\'Oréal Professional Philippines',
      contactPerson: 'John Rodriguez',
      email: 'john.rodriguez@loreal.com',
      phone: '+63 2 9999 5678',
      address: '456 Corporate Plaza, BGC, Taguig City',
      website: 'https://lorealprofessional.ph',
      category: 'Hair Color',
      paymentTerms: 'Net 15',
      rating: 4,
      totalOrders: 32,
      totalValue: 890000,
      lastOrder: new Date('2024-01-08'),
      notes: 'Good pricing and fast delivery',
      isActive: true,
      createdAt: new Date('2023-08-20'),
      updatedAt: new Date('2024-01-12')
    },
    {
      id: '3',
      name: 'Kerastase Philippines',
      contactPerson: 'Ana Garcia',
      email: 'ana.garcia@kerastase.ph',
      phone: '+63 2 7777 9012',
      address: '789 Luxury Tower, Ortigas Center, Pasig City',
      website: 'https://kerastase.ph',
      category: 'Hair Care',
      paymentTerms: 'Net 45',
      rating: 4,
      totalOrders: 28,
      totalValue: 650000,
      lastOrder: new Date('2024-01-05'),
      notes: 'Premium products, longer payment terms',
      isActive: true,
      createdAt: new Date('2023-09-10'),
      updatedAt: new Date('2024-01-08')
    },
    {
      id: '4',
      name: 'Wella Professionals',
      contactPerson: 'Carlos Mendoza',
      email: 'carlos.mendoza@wella.com',
      phone: '+63 2 6666 3456',
      address: '321 Industry St, Quezon City',
      website: 'https://wella.ph',
      category: 'Hair Color',
      paymentTerms: 'Net 30',
      rating: 3,
      totalOrders: 15,
      totalValue: 320000,
      lastOrder: new Date('2023-12-20'),
      notes: 'Occasional delivery delays',
      isActive: false,
      createdAt: new Date('2023-10-05'),
      updatedAt: new Date('2023-12-25')
    }
  ];

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, use mock data
      setSuppliers(mockSuppliers);
      
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, []);

  // Get unique categories
  const categories = [...new Set(suppliers.map(s => s.category))].filter(Boolean);
  
  // Get unique payment terms
  const paymentTerms = [...new Set(suppliers.map(s => s.paymentTerms))].filter(Boolean);

  // Filter and sort suppliers
  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           supplier.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || 
                           (filters.status === 'active' && supplier.isActive) ||
                           (filters.status === 'inactive' && !supplier.isActive);
      const matchesCategory = filters.category === 'all' || supplier.category === filters.category;
      const matchesRating = filters.rating === 'all' || supplier.rating >= parseInt(filters.rating);
      const matchesPaymentTerms = filters.paymentTerms === 'all' || supplier.paymentTerms === filters.paymentTerms;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesRating && matchesPaymentTerms;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'lastOrder') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle supplier details
  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailsModalOpen(true);
  };

  // Handle edit supplier
  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      website: supplier.website,
      category: supplier.category,
      paymentTerms: supplier.paymentTerms,
      rating: supplier.rating,
      notes: supplier.notes,
      isActive: supplier.isActive
    });
    setIsEditModalOpen(true);
  };

  // Handle add supplier
  const handleAddSupplier = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      category: '',
      paymentTerms: '',
      rating: 5,
      notes: '',
      isActive: true
    });
    setIsAddModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
  };

  // Get status color
  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  // Get status icon
  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />;
  };

  // Get rating stars
  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  // Calculate supplier statistics
  const supplierStats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.isActive).length,
    inactiveSuppliers: suppliers.filter(s => !s.isActive).length,
    totalValue: suppliers.reduce((sum, s) => sum + s.totalValue, 0),
    averageRating: suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading suppliers...</span>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Suppliers</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadSuppliers} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Suppliers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600">Manage your supplier relationships and information</p>
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
            <Button onClick={handleAddSupplier} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Suppliers</p>
                <p className="text-xl font-bold text-gray-900">{supplierStats.totalSuppliers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-xl font-bold text-gray-900">{supplierStats.activeSuppliers}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold text-gray-900">{supplierStats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-xl font-bold text-gray-900">₱{supplierStats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Search suppliers by name, contact person, or email..."
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                  rating: 'all',
                  paymentTerms: 'all'
                })}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </Card>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Supplier Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                      <p className="text-sm text-gray-500">{supplier.category}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.isActive)}`}>
                    {getStatusIcon(supplier.isActive)}
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    {getRatingStars(supplier.rating)}
                  </div>
                  <span className="text-sm text-gray-500">({supplier.rating}/5)</span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{supplier.notes}</p>
              </div>

              {/* Supplier Info */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{supplier.contactPerson}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 line-clamp-1">{supplier.address}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Orders:</span>
                    <span className="ml-1 font-medium">{supplier.totalOrders}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <span className="ml-1 font-medium">₱{supplier.totalValue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Terms:</span>
                    <span className="ml-1 font-medium">{supplier.paymentTerms}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Order:</span>
                    <span className="ml-1 font-medium">{format(new Date(supplier.lastOrder), 'MMM dd')}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(supplier)}
                    className="flex-1 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSupplier(supplier)}
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
        {filteredSuppliers.length === 0 && (
          <Card className="p-12 text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suppliers Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || Object.values(filters).some(f => f !== 'all')
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first supplier'
              }
            </p>
            <Button onClick={handleAddSupplier} className="flex items-center gap-2 mx-auto">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Button>
          </Card>
        )}

        {/* Supplier Details Modal */}
        {isDetailsModalOpen && selectedSupplier && (
          <Modal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedSupplier(null);
            }}
            title="Supplier Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Supplier Header */}
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-16 w-16 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{selectedSupplier.name}</h2>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSupplier.isActive)}`}>
                      {getStatusIcon(selectedSupplier.isActive)}
                      {selectedSupplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 mb-2">{selectedSupplier.category}</p>
                  <div className="flex items-center gap-1">
                    {getRatingStars(selectedSupplier.rating)}
                    <span className="ml-2 text-sm text-gray-500">({selectedSupplier.rating}/5)</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Contact Person</label>
                    <p className="text-gray-900">{selectedSupplier.contactPerson}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedSupplier.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedSupplier.phone}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{selectedSupplier.address}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Website</label>
                    <p className="text-blue-600">
                      <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer">
                        {selectedSupplier.website}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Business Information</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                    <p className="text-gray-900">{selectedSupplier.paymentTerms}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Orders</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedSupplier.totalOrders}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Value</label>
                    <p className="text-lg font-semibold text-green-600">₱{selectedSupplier.totalValue.toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Order</label>
                    <p className="text-gray-900">{format(new Date(selectedSupplier.lastOrder), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rating</label>
                    <div className="flex items-center gap-1">
                      {getRatingStars(selectedSupplier.rating)}
                      <span className="ml-2 text-sm text-gray-500">({selectedSupplier.rating}/5)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-500">Notes</label>
                <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{selectedSupplier.notes}</p>
              </div>

              {/* Timestamps */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {format(new Date(selectedSupplier.createdAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {format(new Date(selectedSupplier.updatedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Add/Edit Supplier Modal */}
        {(isAddModalOpen || isEditModalOpen) && (
          <Modal
            isOpen={isAddModalOpen || isEditModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedSupplier(null);
            }}
            title={isAddModalOpen ? 'Add Supplier' : 'Edit Supplier'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person *</label>
                  <Input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Hair Care">Hair Care</option>
                    <option value="Hair Color">Hair Color</option>
                    <option value="Styling">Styling</option>
                    <option value="Tools">Tools</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms *</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Payment Terms</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <Input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={1}>1 Star</option>
                    <option value={2}>2 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={5}>5 Stars</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active Supplier
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Additional notes about this supplier..."
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedSupplier(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isAddModalOpen ? 'Add Supplier' : 'Update Supplier'}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <select
                  value={filters.paymentTerms}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Payment Terms</option>
                  {paymentTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setFilters({
                  status: 'all',
                  category: 'all',
                  rating: 'all',
                  paymentTerms: 'all'
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

export default Suppliers;