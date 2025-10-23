import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Scissors, 
  Plus, 
  Edit, 
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
  Package,
  Eye
} from 'lucide-react';

const ServiceManagement = () => {
  const { userData } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Settings },
    { path: '/service-management', label: 'Services', icon: Scissors },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    duration: '',
    prices: [0], // Default price for all branches
    imageURL: '',
    isActive: true,
    isChemical: false
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
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all services from services collection
      const servicesRef = collection(db, 'services');
      const snapshot = await getDocs(servicesRef);
      
      const servicesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
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
      
      // Ensure we have valid data
      const validPrices = (formData.prices || []).map(price => parseFloat(price) || 0);
      
      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        duration: parseInt(formData.duration),
        prices: validPrices,
        imageURL: formData.imageURL,
        isActive: formData.isActive,
        isChemical: formData.isChemical,
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
      isChemical: false
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
      isChemical: service.isChemical || false
    });
    setShowServiceModal(true);
  };


  const handleToggleStatus = async (serviceId) => {
    try {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        const serviceRef = doc(db, 'services', serviceId);
        await updateDoc(serviceRef, {
          isActive: !service.isActive,
          updatedAt: serverTimestamp()
        });
        await loadServices();
      }
    } catch (error) {
      console.error('Error updating service status:', error);
      setError('Failed to update service status');
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

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Service Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600">Configure and manage all salon services</p>
          </div>
          <Button 
            onClick={() => setShowServiceModal(true)}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                : 'No services are configured yet.'
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
                    {service.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${service.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {service.isActive ? 'Active' : 'Inactive'}
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
                    ₱{service.prices && service.prices.length > 0 ? service.prices[0] : '0'}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleToggleStatus(service.id)}
                    className={service.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                  >
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Service Modal */}
        {showServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Scissors className="h-6 w-6" />
                    <div>
                      <h2 className="text-xl font-semibold">
                        {editingService ? 'Edit Service' : 'Add New Service'}
                      </h2>
                      <p className="text-blue-100 text-sm">
                        {editingService ? 'Update service details' : 'Configure a new service for the salon'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCloseModal}
                    className="text-white border-white hover:bg-white hover:text-[#160B53]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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
                  <Button variant="outline" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-[#160B53] hover:bg-[#160B53]/90 text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ServiceManagement;
