// src/pages/04_BranchManager/Suppliers.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { branchManagerMenuItems } from './menuItems';
import {
  Building,
  Search,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Truck,
  Home,
  Calendar,
  Users,
  ShoppingCart,
  DollarSign,
  Receipt,
  Image as ImageIcon,
  Settings,
  BarChart3,
  UserCog
} from 'lucide-react';
import { format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { productService } from '../../services/productService';

const Suppliers = () => {
  const { userData } = useAuth();

  // Data states
  const [suppliers, setSuppliers] = useState([]);
  const [supplierProducts, setSupplierProducts] = useState({}); // { supplierId: [products] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // UI states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Load suppliers from Firestore
  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const suppliersRef = collection(db, 'suppliers');
      const snapshot = await getDocs(suppliersRef);
      const suppliersList = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        suppliersList.push({
          id: doc.id,
          name: data.name || 'Unknown Supplier',
          contactPerson: data.contactPerson || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || '',
          category: data.category || '',
          paymentTerms: data.paymentTerms || '',
          rating: data.rating || 0,
          notes: data.notes || '',
          isActive: data.isActive !== false,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date())
        });
      });
      
      // Sort by name
      suppliersList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      
      setSuppliers(suppliersList);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load products for a specific supplier
  const loadSupplierProducts = async (supplierId, showLoading = false) => {
    if (!supplierId) return;
    
    // Check if already loaded
    if (supplierProducts[supplierId]) {
      return;
    }

    try {
      if (showLoading) {
        setLoadingProducts(true);
      }
      const result = await productService.getProductsBySupplier(supplierId);
      
      if (result.success) {
        setSupplierProducts(prev => ({
          ...prev,
          [supplierId]: result.products
        }));
      } else {
        // If no products found or error, set empty array
        setSupplierProducts(prev => ({
          ...prev,
          [supplierId]: []
        }));
      }
    } catch (err) {
      console.error('Error loading supplier products:', err);
      setSupplierProducts(prev => ({
        ...prev,
        [supplierId]: []
      }));
    } finally {
      if (showLoading) {
        setLoadingProducts(false);
      }
    }
  };

  // Load suppliers and their products on mount
  useEffect(() => {
    const loadData = async () => {
      await loadSuppliers();
    };
    loadData();
  }, []);

  // Load products for all suppliers after suppliers are loaded
  useEffect(() => {
    if (suppliers.length > 0) {
      const loadAllProducts = async () => {
        for (const supplier of suppliers) {
          if (supplier.id && !supplierProducts[supplier.id]) {
            await loadSupplierProducts(supplier.id);
          }
        }
      };
      loadAllProducts();
    }
  }, [suppliers]);

  // Get unique categories
  const categories = ['All', ...new Set(suppliers.map(s => s.category).filter(Boolean))];
  
  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'active' && supplier.isActive !== false) ||
      (selectedStatus === 'inactive' && supplier.isActive === false);
    const matchesCategory = selectedCategory === 'all' || supplier.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate supplier statistics
  const supplierStats = {
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.isActive !== false).length,
    averageRating: suppliers.length > 0 ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length : 0
  };

  // Handle supplier details
  const handleViewDetails = (supplier) => {
    setSelectedSupplier(supplier);
    setIsDetailsModalOpen(true);
    // Load products for this supplier if not already loaded
    if (supplier.id && !supplierProducts[supplier.id]) {
      loadSupplierProducts(supplier.id, true);
    }
  };

  // Get status color
  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100 border-green-200' : 'text-red-600 bg-red-100 border-red-200';
  };

  // Get status icon
  const getStatusIcon = (isActive) => {
    return isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;
  };

  // Get rating stars
  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<span key={i} className="text-gray-300">★</span>);
    }
    return stars;
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Suppliers">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-[#160B53]" />
          <span className="ml-2 text-gray-600">Loading suppliers...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Suppliers">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            onClick={loadSuppliers}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-xl font-bold text-gray-900">{categories.length - 1}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search suppliers by name, contact person, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
              >
                {categories.map(category => (
                  <option key={category} value={category === 'All' ? 'all' : category}>{category}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('all');
                  setSelectedCategory('all');
                }}
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
                      <p className="text-sm text-gray-500">{supplier.category || 'No category'}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(supplier.isActive)}`}>
                    {getStatusIcon(supplier.isActive)}
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    {getRatingStars(supplier.rating || 0)}
                  </div>
                  <span className="text-sm text-gray-500">({supplier.rating || 0}/5)</span>
                </div>
                
                {supplier.notes && (
                  <p className="text-sm text-gray-600 line-clamp-2">{supplier.notes}</p>
                )}
              </div>

              {/* Supplier Info */}
              <div className="p-6">
                <div className="space-y-3 mb-4">
                  {supplier.contactPerson && (
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{supplier.contactPerson}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 line-clamp-1">{supplier.address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Payment Terms:</span>
                    <span className="ml-1 font-medium">{supplier.paymentTerms || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-1 font-medium">{supplier.category || 'N/A'}</span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-gray-500">Products:</span>
                      <span className="ml-1 font-semibold text-blue-600">
                        {supplierProducts[supplier.id]?.length || 0} available
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(supplier)}
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredSuppliers.length === 0 && (
          <Card className="p-12 text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suppliers Found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedStatus !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No suppliers available'}
            </p>
          </Card>
        )}

        {/* Supplier Details Modal */}
        {isDetailsModalOpen && selectedSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Building className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Supplier Details</h2>
                      <p className="text-white/80 text-sm mt-1">{selectedSupplier.name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setSelectedSupplier(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Supplier Header */}
                  <div className="flex gap-6">
                    <div className="w-32 h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="h-16 w-16 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900">{selectedSupplier.name}</h2>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedSupplier.isActive)}`}>
                          {getStatusIcon(selectedSupplier.isActive)}
                          {selectedSupplier.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-lg text-gray-600 mb-2">{selectedSupplier.category || 'No category'}</p>
                      <div className="flex items-center gap-1">
                        {getRatingStars(selectedSupplier.rating || 0)}
                        <span className="ml-2 text-sm text-gray-500">({selectedSupplier.rating || 0}/5)</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Contact Information</h3>
                      
                      {selectedSupplier.contactPerson && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Person</label>
                          <p className="text-gray-900">{selectedSupplier.contactPerson}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.email && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{selectedSupplier.email}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{selectedSupplier.phone}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.address && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Address</label>
                          <p className="text-gray-900">{selectedSupplier.address}</p>
                        </div>
                      )}
                      
                      {selectedSupplier.website && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Website</label>
                          <p className="text-blue-600">
                            <a href={selectedSupplier.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {selectedSupplier.website}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900">Business Information</h3>
                      
                      {selectedSupplier.paymentTerms && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                          <p className="text-gray-900">{selectedSupplier.paymentTerms}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Rating</label>
                        <div className="flex items-center gap-1">
                          {getRatingStars(selectedSupplier.rating || 0)}
                          <span className="ml-2 text-sm text-gray-500">({selectedSupplier.rating || 0}/5)</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Products</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {supplierProducts[selectedSupplier.id]?.length || 0} products
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Products Supplied ({supplierProducts[selectedSupplier.id]?.length || 0})
                      </h3>
                      {loadingProducts && (
                        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                    
                    {loadingProducts ? (
                      <div className="text-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Loading products...</p>
                      </div>
                    ) : supplierProducts[selectedSupplier.id] && supplierProducts[selectedSupplier.id].length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {supplierProducts[selectedSupplier.id].map((product) => (
                          <Card key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  {product.imageUrl ? (
                                    <img
                                      src={product.imageUrl}
                                      alt={product.name}
                                      className="w-16 h-16 object-cover rounded-lg"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <Package className="h-8 w-8 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                                    {product.brand && (
                                      <p className="text-sm text-gray-600">Brand: {product.brand}</p>
                                    )}
                                    {product.sku && (
                                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                    )}
                                    {product.category && (
                                      <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                        {product.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-sm font-semibold text-gray-900">
                                  ₱{(product.unitCost || 0).toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">Unit Cost</p>
                              </div>
                            </div>
                            {product.description && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No products found for this supplier</p>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedSupplier.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-lg">{selectedSupplier.notes}</p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Created:</span> {selectedSupplier.createdAt ? format(new Date(selectedSupplier.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {selectedSupplier.updatedAt ? format(new Date(selectedSupplier.updatedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      setSelectedSupplier(null);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
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

export default Suppliers;

