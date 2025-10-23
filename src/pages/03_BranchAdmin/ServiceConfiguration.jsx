    import React, { useState, useEffect } from 'react';
    import { useAuth } from '../../context/AuthContext';
    import { branchService } from '../../services/branchService';
    import { db } from '../../lib/firebase';
    import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
    import { Card } from '../ui/card';
    import { Button } from '../ui/button';
    import { Input } from '../ui/input';
    import DashboardLayout from '../shared/DashboardLayout';
    import { 
      Scissors, 
      Plus, 
      Edit, 
      Trash2, 
      Save, 
      X, 
      Clock, 
      DollarSign,
      Search,
      Filter,
      Home,
      Calendar,
      Users,
      Settings,
      BarChart3,
      UserCog,
      AlertCircle,
      CheckCircle,
      Package
    } from 'lucide-react';

    const ServiceConfiguration = () => {
      const { userData } = useAuth();
      const [services, setServices] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');
      const [searchTerm, setSearchTerm] = useState('');
      const [categoryFilter, setCategoryFilter] = useState('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [branchPrice, setBranchPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

      const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: Home },
        { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
        { path: '/staff', label: 'Staff Management', icon: Users },
        { path: '/branch-settings', label: 'Branch Settings', icon: Settings },
        { path: '/service-config', label: 'Service Configuration', icon: Scissors },
        { path: '/holiday-management', label: 'Holiday Management', icon: Calendar },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/reports', label: 'Reports', icon: BarChart3 },
        { path: '/profile', label: 'Profile', icon: UserCog },
      ];

      const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        duration: '',
        prices: [0], // Array of prices for different branches
        imageURL: '',
        isActive: true,
        isChemical: false,
        branches: userData?.branchId ? [userData.branchId] : [] // Array of branch IDs
      });

      const serviceCategories = [
        'Hair Services',
        'Nail Services',
        'Facial Services',
        'Massage Services',
        'Bridal Services',
        'Men\'s Services',
        'Other'
      ];

      useEffect(() => {
        if (userData?.branchId) {
          loadServices();
          // Update formData branches when userData becomes available
          setFormData(prev => ({
            ...prev,
            branches: [userData.branchId]
          }));
        }
      }, [userData?.branchId]);

      const loadServices = async () => {
        try {
          setLoading(true);
          setError('');
          
          // Load all services from services collection
          const servicesRef = collection(db, 'services');
          const snapshot = await getDocs(servicesRef);
          
          const servicesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isAssignedToBranch: doc.data().branches?.includes(userData.branchId) || false
          }));
          
          setServices(servicesData);
        } catch (error) {
          console.error('Error loading services:', error);
          setError('Failed to load services');
        } finally {
          setLoading(false);
        }
      };

      const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
        }));
      };


      const handleSubmit = async (e) => {
        e.preventDefault();
        try {
          setError('');
          
          // Ensure we have at least one valid branch ID
          const validBranches = (formData.branches || []).filter(branchId => branchId && branchId !== '');
          if (validBranches.length === 0) {
            setError('At least one branch must be assigned to this service');
            return;
          }
          
          const serviceData = {
            name: formData.name,
            description: formData.description,
            category: formData.category,
            duration: parseInt(formData.duration),
            prices: formData.prices.map(price => parseFloat(price) || 0),
            imageURL: formData.imageURL,
            isActive: formData.isActive,
            isChemical: formData.isChemical,
            branches: validBranches,
            updatedAt: serverTimestamp()
          };

          if (editingService) {
            // Update existing service
            const serviceRef = doc(db, 'services', editingService.id);
            await updateDoc(serviceRef, serviceData);
            setSuccess('Service updated successfully!');
          } else {
            // Add new service
            const newServiceData = {
              ...serviceData,
              createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'services'), newServiceData);
            setSuccess('Service added successfully!');
          }

          // Reload services
          await loadServices();
          handleCloseModal();
        } catch (error) {
          console.error('Error saving service:', error);
          setError(error.message);
        }
      };

      const handleCloseModal = () => {
        setShowServiceModal(false);
        setEditingService(null);
        setFormData({
          name: '',
          description: '',
          category: '',
          duration: '',
          prices: [0],
          imageURL: '',
          isActive: true,
          isChemical: false,
          branches: userData?.branchId ? [userData.branchId] : []
        });
      };

      const handleEdit = (service) => {
        setEditingService(service);
        setFormData({
          name: service.name || '',
          description: service.description || '',
          category: service.category || '',
          duration: service.duration || '',
          prices: service.prices || [0],
          imageURL: service.imageURL || '',
          isActive: service.isActive !== false,
          isChemical: service.isChemical || false,
          branches: service.branches || (userData?.branchId ? [userData.branchId] : [])
        });
        setShowServiceModal(true);
      };

      const handleDelete = async (serviceId) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
          try {
            await deleteDoc(doc(db, 'services', serviceId));
            setSuccess('Service deleted successfully');
            await loadServices(); // Reload services
            setTimeout(() => setSuccess(''), 3000);
          } catch (error) {
            console.error('Error deleting service:', error);
            setError('Failed to delete service');
          }
        }
      };

      const handleToggleAssignment = async (serviceId) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
          const isCurrentlyAssigned = service.isAssignedToBranch;
          
          if (isCurrentlyAssigned) {
            // Remove from branch
            await removeServiceFromBranch(serviceId);
          } else {
            // Show price modal for assignment
            setSelectedService(service);
            let currentBranchPrice = '';
            if (service.branches && service.prices) {
              const branchIndex = service.branches.indexOf(userData.branchId);
              if (branchIndex !== -1 && service.prices[branchIndex] !== undefined) {
                currentBranchPrice = service.prices[branchIndex].toString();
              }
            }
            if (!currentBranchPrice && service.prices && service.prices.length > 0) {
              currentBranchPrice = service.prices[0].toString();
            }
            setBranchPrice(currentBranchPrice);
            setShowPriceModal(true);
          }
        }
      };

      const removeServiceFromBranch = async (serviceId) => {
        setIsLoading(true);
        setLoadingMessage('Removing service from branch...');

        try {
          const service = services.find(s => s.id === serviceId);
          const serviceRef = doc(db, 'services', serviceId);
          const currentBranches = service.branches || [];
          const currentPrices = service.prices || [];
          const branchIndex = currentBranches.indexOf(userData.branchId);
          
          // Remove branch and corresponding price
          const updatedBranches = currentBranches.filter(branchId => branchId !== userData.branchId);
          const updatedPrices = currentPrices.filter((_, index) => index !== branchIndex);
          
          await updateDoc(serviceRef, {
            branches: updatedBranches,
            prices: updatedPrices,
            updatedAt: serverTimestamp()
          });
          
          setSuccess('Service removed from branch');
          await loadServices();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Error removing service from branch:', error);
          setError('Failed to remove service from branch');
        } finally {
          setIsLoading(false);
          setLoadingMessage('');
        }
      };

      const handleAssignService = async () => {
        if (!selectedService || !branchPrice) {
          setError('Please enter a valid price');
          return;
        }

        setIsLoading(true);
        setLoadingMessage(selectedService.isAssignedToBranch ? 'Updating service price...' : 'Assigning service to branch...');

        try {
          const serviceRef = doc(db, 'services', selectedService.id);
          const currentBranches = selectedService.branches || [];
          const currentPrices = selectedService.prices || [];
          const isCurrentlyAssigned = currentBranches.includes(userData.branchId);
          
          let updatedBranches = [...currentBranches];
          let updatedPrices = [...currentPrices];
          
          if (isCurrentlyAssigned) {
            // Update existing branch price
            const branchIndex = currentBranches.indexOf(userData.branchId);
            updatedPrices[branchIndex] = parseFloat(branchPrice);
          } else {
            // Add new branch and price
            updatedBranches.push(userData.branchId);
            updatedPrices.push(parseFloat(branchPrice));
          }
          
          // Update the service with branch assignment and pricing
          await updateDoc(serviceRef, {
            branches: updatedBranches,
            prices: updatedPrices,
            updatedAt: serverTimestamp()
          });
          
          setSuccess(isCurrentlyAssigned ? 'Branch price updated successfully' : 'Service assigned to branch with custom price');
          setShowPriceModal(false);
          setSelectedService(null);
          setBranchPrice('');
          await loadServices();
          setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
          console.error('Error updating service:', error);
          setError('Failed to update service');
        } finally {
          setIsLoading(false);
          setLoadingMessage('');
        }
      };

      const filteredServices = services.filter(service => {
        const matchesSearch = service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            service.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
        return matchesSearch && matchesCategory;
      });

      const getServiceStats = () => {
        const total = services.length;
        const active = services.filter(s => s.isActive).length;
        const inactive = total - active;
        const byCategory = {};
        
        serviceCategories.forEach(category => {
          byCategory[category] = services.filter(s => s.category === category).length;
        });
        
        return { total, active, inactive, byCategory };
      };

      const stats = getServiceStats();

      // Don't render until userData is available
      if (!userData?.branchId) {
        return (
          <DashboardLayout menuItems={menuItems} pageTitle="Service Configuration">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
            </div>
          </DashboardLayout>
        );
      }

      return (
        <DashboardLayout menuItems={menuItems} pageTitle="Service Configuration">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Service Assignment</h1>
                <p className="text-gray-600">Assign available services to your branch</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <Scissors className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inactive Services</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg. Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ₱{services.length > 0 ? (services.reduce((sum, s) => sum + (s.prices && s.prices.length > 0 ? s.prices[0] : 0), 0) / services.length).toFixed(0) : '0'}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search services by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="w-48">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-green-800">{success}</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Services List */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
              </div>
            ) : filteredServices.length === 0 ? (
              <Card className="p-8 text-center">
                <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'No services match your current filters.' 
                    : 'No services are configured for this branch yet.'
                  }
                </p>
                <Button 
                  onClick={() => setShowServiceModal(true)}
                  className="flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Service
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map(service => (
                  <Card key={service.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                          <Scissors className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{service.name}</h3>
                          <p className="text-sm text-gray-600">{service.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {service.isAssignedToBranch ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${service.isAssignedToBranch ? 'text-green-600' : 'text-gray-500'}`}>
                          {service.isAssignedToBranch ? 'Assigned' : 'Not Assigned'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">{service.description}</p>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {service.duration} minutes
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2" />
                        ₱{(() => {
                          if (service.isAssignedToBranch && service.branches && service.prices) {
                            const branchIndex = service.branches.indexOf(userData.branchId);
                            if (branchIndex !== -1 && service.prices[branchIndex] !== undefined) {
                              return service.prices[branchIndex];
                            }
                          }
                          return service.prices && service.prices.length > 0 ? service.prices[0] : '0';
                        })()}
                        {service.isAssignedToBranch && service.branches && service.prices && service.branches.indexOf(userData.branchId) !== -1 && (
                          <span className="ml-2 text-xs text-green-600 font-medium">(Branch Price)</span>
                        )}
                      </div>
                    </div>
                    
                    
                    <div className="flex space-x-2">
                      {service.isAssignedToBranch ? (
                        <>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className="flex-1 text-blue-600 hover:text-blue-700 border-blue-300"
                            onClick={() => {
                              setSelectedService(service);
                              let currentBranchPrice = '';
                              if (service.branches && service.prices) {
                                const branchIndex = service.branches.indexOf(userData.branchId);
                                if (branchIndex !== -1 && service.prices[branchIndex] !== undefined) {
                                  currentBranchPrice = service.prices[branchIndex].toString();
                                }
                              }
                              if (!currentBranchPrice && service.prices && service.prices.length > 0) {
                                currentBranchPrice = service.prices[0].toString();
                              }
                              setBranchPrice(currentBranchPrice);
                              setShowPriceModal(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Edit Price
                          </Button>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-300"
                            onClick={() => handleToggleAssignment(service.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="default"
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleToggleAssignment(service.id)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Service Modal */}
            {showServiceModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <Scissors className="h-6 w-6 mr-3 text-[#160B53]" />
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {editingService ? 'Edit Service' : 'Add New Service'}
                        </h2>
                        <p className="text-sm text-gray-600">Configure service details and pricing</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowServiceModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., Haircut & Style"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                          >
                            <option value="">Select Category</option>
                            {serviceCategories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                          <Input
                            name="duration"
                            type="number"
                            value={formData.duration}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., 60"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₱) *</label>
                          <Input
                            name="prices"
                            type="number"
                            step="0.01"
                            value={formData.prices?.[0] || ''}
                            onChange={(e) => {
                              const newPrices = [...(formData.prices || [0])];
                              newPrices[0] = parseFloat(e.target.value) || 0;
                              setFormData(prev => ({ ...prev, prices: newPrices }));
                            }}
                            required
                            placeholder="e.g., 500.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                          <Input
                            name="imageURL"
                            value={formData.imageURL}
                            onChange={handleInputChange}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                          placeholder="Describe the service..."
                        />
                      </div>
                      
                      
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700">Active Service</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name="isChemical"
                            checked={formData.isChemical}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <label className="text-sm font-medium text-gray-700">Chemical Service</label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={() => setShowServiceModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex items-center">
                        <Save className="h-4 w-4 mr-2" />
                        {editingService ? 'Update Service' : 'Add Service'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Price Modal */}
            {showPriceModal && selectedService && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white p-6 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-6 w-6" />
                        <div>
                          <h2 className="text-xl font-semibold">
                            {selectedService && selectedService.isAssignedToBranch ? 'Edit Branch Price' : 'Set Branch Price'}
                          </h2>
                          <p className="text-blue-100 text-sm">
                            {selectedService && selectedService.isAssignedToBranch 
                              ? 'Update the price for this service in your branch' 
                              : 'Set the price for this service in your branch'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPriceModal(false);
                          setSelectedService(null);
                          setBranchPrice('');
                        }}
                        className="text-white border-white hover:bg-white hover:text-[#160B53]"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{selectedService.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{selectedService.description}</p>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Default Price:</strong> ₱{selectedService.prices && selectedService.prices.length > 0 ? selectedService.prices[0] : '0'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          This is the default price set by the system admin. You can set your own branch price below.
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Price (₱) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={branchPrice}
                        onChange={(e) => setBranchPrice(e.target.value)}
                        placeholder="Enter your branch price"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This price will be used for appointments in your branch
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end space-x-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowPriceModal(false);
                          setSelectedService(null);
                          setBranchPrice('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAssignService}
                        className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                        disabled={!branchPrice || parseFloat(branchPrice) <= 0 || isLoading}
                      >
                        {selectedService && selectedService.isAssignedToBranch ? (
                          <>
                            <DollarSign className="h-4 w-4 mr-2" />
                            Update Price
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Service
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Modal */}
            {isLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53]"></div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
                      <p className="text-gray-600">{loadingMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DashboardLayout>
      );
    };

    export default ServiceConfiguration;
