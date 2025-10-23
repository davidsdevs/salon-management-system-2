import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { 
  Package, 
  Plus,
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Eye,
  Trash2
} from 'lucide-react';

const BranchProducts = () => {
  const { userData } = useAuth();
  const [branchProducts, setBranchProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [addModalCategories, setAddModalCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [showRemoveSuccessModal, setShowRemoveSuccessModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [productToView, setProductToView] = useState(null);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Package },
    { path: '/branch-appointments', label: 'Appointments', icon: Package },
    { path: '/staff', label: 'Staff Management', icon: Package },
    { path: '/branch-settings', label: 'Branch Settings', icon: Package },
    { path: '/service-config', label: 'Service Configuration', icon: Package },
    { path: '/branch-products', label: 'Branch Products', icon: Package },
    { path: '/holiday-management', label: 'Holiday Management', icon: Package },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: Package },
  ];

  useEffect(() => {
    loadBranchProducts();
    loadAvailableProducts();
  }, []);

  // Extract unique categories from products
  const extractCategories = (products) => {
    const categories = new Set();
    products.forEach(product => {
      if (product.category && product.category.trim() !== '') {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  };

  const loadBranchProducts = async () => {
    try {
      setLoading(true);
      
      if (!userData?.branchId) {
        console.warn('No branch ID found for user');
        return;
      }

      // Get products that are available to this branch (where branchId is in branches array)
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      const branchProductsList = [];
      productsSnapshot.forEach((doc) => {
        const productData = doc.data();
        
        // Check if the product is available to this branch
        const isAvailableToBranch = productData.branches && 
          productData.branches.includes(userData.branchId);
        
        if (isAvailableToBranch) {
          branchProductsList.push({
            id: doc.id,
            name: productData.name,
            category: productData.category,
            brand: productData.brand,
            unitCost: productData.unitCost,
            salonUsePrice: productData.salonUsePrice,
            otcPrice: productData.otcPrice,
            description: productData.description,
            imageUrl: productData.imageUrl,
            upc: productData.upc,
            supplier: productData.supplier,
            variants: productData.variants,
            shelfLife: productData.shelfLife,
            status: productData.status,
            branches: productData.branches,
            createdAt: productData.createdAt,
            updatedAt: productData.updatedAt,
            isAvailable: true // Default to available since they're in the branches array
          });
        }
      });
      
      setBranchProducts(branchProductsList);
      
      // Extract categories from branch products
      const categories = extractCategories(branchProductsList);
      setAvailableCategories(categories);
    } catch (error) {
      console.error('Error loading branch products:', error);
      setError('Failed to load branch products');
    } finally {
      setLoading(false);
    }
  };


  const filteredProducts = branchProducts.filter(product => {
    const productName = product.name || '';
    const productBrand = product.brand || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
                         productBrand.toLowerCase().includes(searchTermLower);
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (isAvailable) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getStatusIcon = (isAvailable) => {
    return isAvailable ? CheckCircle : XCircle;
  };

  const loadAvailableProducts = async () => {
    try {
      // Get all products from master products collection
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      const availableProductsList = [];
      productsSnapshot.forEach((doc) => {
        const productData = doc.data();
        
        // Check if the product is NOT available to this branch (for adding)
        const isNotAvailableToBranch = !productData.branches || 
          !productData.branches.includes(userData.branchId);
        
        if (isNotAvailableToBranch) {
          availableProductsList.push({
            id: doc.id,
            name: productData.name,
            category: productData.category,
            brand: productData.brand,
            unitCost: productData.unitCost,
            salonUsePrice: productData.salonUsePrice,
            otcPrice: productData.otcPrice,
            description: productData.description,
            imageUrl: productData.imageUrl,
            upc: productData.upc,
            supplier: productData.supplier,
            variants: productData.variants,
            shelfLife: productData.shelfLife,
            status: productData.status,
            branches: productData.branches || [],
            createdAt: productData.createdAt,
            updatedAt: productData.updatedAt
          });
        }
      });
      
      setAvailableProducts(availableProductsList);
      
      // Extract categories from available products for the add modal
      const addModalCategoriesList = extractCategories(availableProductsList);
      setAddModalCategories(addModalCategoriesList);
    } catch (error) {
      console.error('Error loading available products:', error);
    }
  };

  const handleRemoveProductClick = (product) => {
    setProductToRemove(product);
    setShowRemoveConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    try {
      const productRef = doc(db, 'products', productToRemove.id);
      const currentDate = new Date().toISOString();
      
      // Remove branchId from branches array and update modified date
      await updateDoc(productRef, {
        branches: arrayRemove(userData.branchId),
        updatedAt: currentDate
      });
      
      // Reload products to reflect changes
      await loadBranchProducts();
      await loadAvailableProducts();
      
      // Show success modal
      setShowRemoveConfirmModal(false);
      setShowRemoveSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowRemoveSuccessModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error removing product from branch:', error);
      alert('Failed to remove product from branch');
      setShowRemoveConfirmModal(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmModal(false);
    setProductToRemove(null);
  };

  const handleViewProduct = (product) => {
    setProductToView(product);
    setShowViewModal(true);
  };

  const handleAddProductClick = (product) => {
    setProductToAdd(product);
    setShowConfirmModal(true);
  };

  const handleConfirmAdd = async () => {
    try {
      const productRef = doc(db, 'products', productToAdd.id);
      const currentDate = new Date().toISOString();
      
      // Add branchId to branches array and update add date
      await updateDoc(productRef, {
        branches: arrayUnion(userData.branchId),
        addedDate: currentDate,
        updatedAt: currentDate
      });
      
      // Reload products to reflect changes
      await loadBranchProducts();
      await loadAvailableProducts();
      
      // Show success modal
      setShowConfirmModal(false);
      setShowSuccessModal(true);
      
      // Auto close success modal after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error adding product to branch:', error);
      alert('Failed to add product to branch');
      setShowConfirmModal(false);
    }
  };

  const handleCancelAdd = () => {
    setShowConfirmModal(false);
    setProductToAdd(null);
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Branch Products">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Products">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Branch Products</p>
              <p className="text-2xl font-bold text-gray-900">{branchProducts.length}</p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available to Add</p>
              <p className="text-2xl font-bold text-gray-900">{availableProducts.length}</p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{branchProducts.length}</p>
            </div>
          </Card>
        </div>

        {/* Filter and Actions */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            {/* Left Side: Add Product Button */}
            <div className="flex-shrink-0">
              <Button
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm"
                onClick={() => setShowAddModal(true)}
              >
                <Plus className="h-4 w-4" /> Add Product
              </Button>
            </div>
            
            {/* Center: Search and Filters */}
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <Search className="absolute left-3 top-8 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]"
                />
              </div>
              
              {/* Filters Row */}
              <div className="flex gap-2 flex-wrap">
                {/* Category Filter */}
                <div className="min-w-[100px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#160B53] focus:border-[#160B53]"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
              </div>
            </div>
            
          </div>
        </Card>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const StatusIcon = getStatusIcon(product.isAvailable);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                                <Package className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name || 'Unnamed Product'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.brand || 'Unknown Brand'}
                            </div>
                            {product.upc && (
                              <div className="text-xs text-gray-400 font-mono">
                                UPC: {product.upc}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category || 'Uncategorized'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₱{product.otcPrice}</div>
                        <div className="text-xs text-gray-500">Cost: ₱{product.unitCost}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.isAvailable)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {product.isAvailable ? 'Available' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewProduct(product)}
                            className="p-2 text-blue-600 border border-blue-200 rounded-md hover:border-blue-400 transition-colors"
                            title="View Product"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveProductClick(product)}
                            className="p-2 text-red-600 border border-red-200 rounded-md hover:border-red-400 transition-colors"
                            title="Remove from Branch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-[#160B53] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Package className="h-5 w-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Add Product to Branch</h2>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)} 
                    className="text-white hover:text-gray-200 p-1"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <p className="text-gray-600 mb-4">Select products from the master catalog to add to your branch:</p>
                  
                  {/* Debug info */}
                  <div className="text-sm text-gray-500 mb-4">
                    Available products: {availableProducts.length}
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="All">All Categories</option>
                      {addModalCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Products List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {availableProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No products available to add</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableProducts
                          .filter(product => {
                            const productName = product.name || '';
                            const productBrand = product.brand || '';
                            const searchTermLower = searchTerm.toLowerCase();
                            
                            const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
                                                 productBrand.toLowerCase().includes(searchTermLower);
                            const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
                            return matchesSearch && matchesCategory;
                          })
                          .map((product) => (
                            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="h-12 w-12 rounded-lg overflow-hidden">
                                    {product.imageUrl ? (
                                      <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="h-12 w-12 object-cover"
                                      />
                                    ) : (
                                      <div className="h-12 w-12 bg-gray-200 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900">{product.name || 'Unnamed Product'}</h3>
                                    <p className="text-sm text-gray-600">{product.brand || 'Unknown Brand'} • {product.category || 'Uncategorized'}</p>
                                    <p className="text-xs text-gray-500">{product.description || 'No description available'}</p>
                                    {product.upc && (
                                      <p className="text-xs text-gray-400 font-mono">UPC: {product.upc}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-gray-900">₱{product.otcPrice?.toLocaleString()}</div>
                                  <div className="text-sm text-gray-500">Cost: ₱{product.unitCost?.toLocaleString()}</div>
                                  <div className="text-sm text-gray-500">Salon: ₱{product.salonUsePrice?.toLocaleString()}</div>
                                  <button
                                    onClick={() => handleAddProductClick(product)}
                                    className="mt-2 bg-[#160B53] hover:bg-[#12094A] text-white px-4 py-2 rounded-md text-sm font-medium"
                                  >
                                    <Plus className="h-4 w-4 mr-2 inline" />
                                    Add to Branch
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && productToAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-blue-50 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <AlertCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">Confirm Product Addition</h2>
              </div>
              
              <div className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Are you sure you want to add this product to your branch?
                  </p>
                  
                  {/* Product Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden">
                        {productToAdd.imageUrl ? (
                          <img
                            src={productToAdd.imageUrl}
                            alt={productToAdd.name}
                            className="h-12 w-12 object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{productToAdd.name || 'Unnamed Product'}</h3>
                        <p className="text-sm text-gray-600">{productToAdd.brand || 'Unknown Brand'}</p>
                        <p className="text-sm text-gray-500">₱{productToAdd.otcPrice?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelAdd}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAdd}
                      className="flex-1 px-4 py-2 bg-[#160B53] text-white rounded-md hover:bg-[#12094A] transition-colors"
                    >
                      Add to Branch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-green-50 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">Product Added Successfully!</h2>
              </div>
              
              <div className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    The product has been successfully added to your branch and is now available for sale.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Product Added</span>
                  </div>
                  
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="w-full px-4 py-2 bg-[#160B53] text-white rounded-md hover:bg-[#12094A] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Confirmation Modal */}
        {showRemoveConfirmModal && productToRemove && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-red-50 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">Confirm Product Removal</h2>
              </div>
              
              <div className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Are you sure you want to remove this product from your branch?
                  </p>
                  <p className="text-sm text-red-600">
                    This action will make the product unavailable for sale at your branch.
                  </p>
                  
                  {/* Product Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-lg overflow-hidden">
                        {productToRemove.imageUrl ? (
                          <img
                            src={productToRemove.imageUrl}
                            alt={productToRemove.name}
                            className="h-12 w-12 object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">{productToRemove.name || 'Unnamed Product'}</h3>
                        <p className="text-sm text-gray-600">{productToRemove.brand || 'Unknown Brand'}</p>
                        <p className="text-sm text-gray-500">₱{productToRemove.otcPrice?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelRemove}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRemove}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Remove from Branch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Remove Success Modal */}
        {showRemoveSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
              
              {/* Modal Header */}
              <div className="bg-green-50 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center">Product Removed Successfully!</h2>
              </div>
              
              <div className="p-6">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    The product has been successfully removed from your branch and is no longer available for sale.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Product Removed</span>
                  </div>
                  
                  <button
                    onClick={() => setShowRemoveSuccessModal(false)}
                    className="w-full px-4 py-2 bg-[#160B53] text-white rounded-md hover:bg-[#12094A] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Product Modal */}
        {showViewModal && productToView && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
              
              {/* Simple Modal Header */}
              <div className="bg-[#160B53] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-white" />
                    <h2 className="text-xl font-semibold text-white">Product Details</h2>
                  </div>
                  <button 
                    onClick={() => setShowViewModal(false)} 
                    className="text-white hover:text-gray-200 p-1"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                <div className="space-y-6">
                  
                  {/* Simple Product Header */}
                  <div className="flex items-start space-x-6">
                    <div className="h-32 w-32 rounded-lg overflow-hidden">
                      {productToView.imageUrl ? (
                        <img
                          src={productToView.imageUrl}
                          alt={productToView.name}
                          className="h-32 w-32 object-cover"
                        />
                      ) : (
                        <div className="h-32 w-32 bg-gray-200 flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {productToView.name || 'Unnamed Product'}
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Brand:</span>
                          <span className="text-sm text-gray-900">{productToView.brand || 'Unknown Brand'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Category:</span>
                          <span className="text-sm text-gray-900">{productToView.category || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">UPC:</span>
                          <span className="text-sm text-gray-900 font-mono">{productToView.upc || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">Supplier:</span>
                          <span className="text-sm text-gray-900">{productToView.supplier || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Simple Description */}
                  {productToView.description && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-600">{productToView.description}</p>
                    </div>
                  )}

                  {/* Simple Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Unit Cost</h4>
                      <p className="text-2xl font-bold text-gray-900">₱{productToView.unitCost?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Salon Price</h4>
                      <p className="text-2xl font-bold text-gray-900">₱{productToView.salonUsePrice?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">OTC Price</h4>
                      <p className="text-2xl font-bold text-gray-900">₱{productToView.otcPrice?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Simple Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {productToView.variants && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Variants</h4>
                        <p className="text-gray-600">{productToView.variants}</p>
                      </div>
                    )}
                    {productToView.shelfLife && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Shelf Life</h4>
                        <p className="text-gray-600">{productToView.shelfLife}</p>
                      </div>
                    )}
                  </div>

                  {/* Simple Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Status</h4>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(productToView.isAvailable)}`}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {productToView.isAvailable ? 'Available' : 'Disabled'}
                      </span>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Added Date</h4>
                      <p className="text-sm text-gray-600">
                        {productToView.addedDate ? 
                          new Date(productToView.addedDate).toLocaleDateString() : 
                          'Not specified'
                        }
                      </p>
                    </div>
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

export default BranchProducts;
