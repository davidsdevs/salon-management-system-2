import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { branchService } from '../../services/branchService';
import { serviceService } from '../../services/serviceService';
import { userService } from '../../services/userService';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { 
  Settings, 
  Building2, 
  Clock, 
  Calendar, 
  Scissors, 
  Users, 
  Package, 
  Home,
  BarChart3,
  UserCog,
  Shield,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  Search,
  Filter,
  Star,
  Heart,
  Gift,
  Phone,
  Mail
} from 'lucide-react';

const BranchManagerSettings = () => {
  const { userData } = useAuth();
  const [activeFeature, setActiveFeature] = useState(null);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/transactions', label: 'Transactions', icon: DollarSign },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  // All Branch Manager features - limited to branch-specific settings only
  const settingsFeatures = [
    {
      id: 'branch-settings',
      title: 'Branch Management',
      description: 'Manage branch information, operating hours, and contact details',
      icon: Building2,
      color: 'bg-blue-100 text-blue-600',
      features: [
        'Branch name and address',
        'Contact information',
        'Operating hours configuration',
        'Branch status management'
      ]
    },
    {
      id: 'branch-products',
      title: 'Branch Products Management',
      description: 'Manage products available at your branch',
      icon: Package,
      color: 'bg-indigo-100 text-indigo-600',
      features: [
        'Add/remove products from branch',
        'Product pricing management',
        'Product availability control',
        'Inventory tracking'
      ]
    },
    {
      id: 'service-configuration',
      title: 'Branch Service Management',
      description: 'Configure and manage branch services and pricing',
      icon: Scissors,
      color: 'bg-purple-100 text-purple-600',
      features: [
        'Service assignment to branch',
        'Custom pricing for services',
        'Service availability management',
        'Service categories and descriptions'
      ]
    }
  ];

  const handleFeatureClick = (featureId) => {
    setActiveFeature(featureId);
  };

  const handleBackToSettings = () => {
    setActiveFeature(null);
  };

  // Render the specific feature component
  const renderFeatureComponent = () => {
    switch (activeFeature) {
      case 'branch-settings':
        return <BranchSettingsComponent onBack={handleBackToSettings} />;
      case 'branch-products':
        return <BranchProductsComponent onBack={handleBackToSettings} />;
      case 'service-configuration':
        return <ServiceConfigurationComponent onBack={handleBackToSettings} />;
      default:
        return null;
    }
  };

  if (activeFeature) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Settings">
        {renderFeatureComponent()}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Settings">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Branch Manager Settings</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Configure your branch operations including branch details, products, and services.
          </p>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={feature.id} 
                className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-[#160B53] group"
                onClick={() => handleFeatureClick(feature.id)}
              >
                <div className="flex flex-col h-full">
                  {/* Icon and Title */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={`p-3 rounded-lg ${feature.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#160B53] transition-colors">
                        {feature.title}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4 flex-grow">
                    {feature.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-medium text-gray-700">Features:</h4>
                    <ul className="space-y-1">
                      {feature.features.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-[#160B53] hover:bg-[#160B53]/90 text-white group-hover:bg-[#160B53] transition-colors"
                    onClick={() => handleFeatureClick(feature.id)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configure {feature.title}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

// Branch Settings Component - Full implementation from Branch Admin
const BranchSettingsComponent = ({ onBack }) => {
  const { userData } = useAuth();
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactNumber: '',
    email: '',
    operatingHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    holidays: [],
    services: []
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };


  React.useEffect(() => {
    loadBranchData();
  }, []);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      if (userData?.branchId) {
        const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
        setBranchData(branch);
        setFormData({
          name: branch.name || '',
          address: branch.address || '',
          contactNumber: branch.contactNumber || '',
          email: branch.email || '',
          operatingHours: branch.operatingHours || formData.operatingHours,
          holidays: branch.holidays || [],
          services: branch.services || []
        });
      }
    } catch (error) {
      console.error('Error loading branch data:', error);
      setError('Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          isOpen: !prev.operatingHours[day].isOpen
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      console.log('Saving branch data:', {
        branchId: userData.branchId,
        role: userData.roles?.[0],
        uid: userData.uid,
        formData
      });
      
      await branchService.updateBranch(userData.branchId, formData, userData.roles?.[0], userData.uid);
      
      setSuccess('Branch settings updated successfully');
      setIsEditing(false);
      await loadBranchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating branch:', error);
      setError('Failed to update branch settings: ' + (error.message || error.toString()));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-[#160B53]" />
            <h2 className="text-2xl font-bold text-gray-900">Branch Settings</h2>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Settings</h1>
          <p className="text-gray-600">Manage your branch configuration, hours, and services</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="flex items-center">
              <Edit className="h-4 w-4 mr-2" />
              Edit Settings
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditing(false);
                  loadBranchData();
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Branch Information */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Building2 className="h-5 w-5 mr-2 text-[#160B53]" />
          <h2 className="text-lg font-semibold text-gray-900">Branch Information</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>
        </div>
      </Card>

      {/* Operating Hours */}
      <Card className="p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 mr-2 text-[#160B53]" />
          <h2 className="text-lg font-semibold text-gray-900">Operating Hours</h2>
        </div>
        
        <div className="space-y-4">
          {days.map(day => (
            <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-24">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.operatingHours[day].isOpen}
                    onChange={() => handleDayToggle(day)}
                    disabled={!isEditing}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {dayLabels[day]}
                  </span>
                </label>
              </div>
              
              {formData.operatingHours[day].isOpen ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={formData.operatingHours[day].open}
                    onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                    disabled={!isEditing}
                    className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={formData.operatingHours[day].close}
                    onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                    disabled={!isEditing}
                    className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
              ) : (
                <span className="text-gray-500 text-sm">Closed</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const ServiceConfigurationComponent = ({ onBack }) => {
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

  const serviceCategories = [
    'Hair Services',
    'Nail Services',
    'Facial Services',
    'Massage Services',
    'Bridal Services',
    'Men\'s Services',
    'Other'
  ];

  React.useEffect(() => {
    if (userData?.branchId) {
      loadServices();
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Scissors className="h-6 w-6 text-[#160B53]" />
            <h2 className="text-2xl font-bold text-gray-900">Service Configuration</h2>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Assignment</h1>
          <p className="text-gray-600">Assign available services to your branch</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          <X className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
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
      {filteredServices.length === 0 ? (
        <Card className="p-8 text-center">
          <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'all' 
              ? 'No services match your current filters.' 
              : 'No services are configured for this branch yet.'
            }
          </p>
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
                <input
                  type="number"
                  step="0.01"
                  value={branchPrice}
                  onChange={(e) => setBranchPrice(e.target.value)}
                  placeholder="Enter your branch price"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
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
  );
};

const StaffManagementComponent = ({ onBack }) => {
  const { userData } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showServiceAssignmentModal, setShowServiceAssignmentModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [staffServices, setStaffServices] = useState({});

  const availableRoles = [
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'stylist', label: 'Stylist' },
    { value: 'inventoryController', label: 'Inventory Controller' },
    { value: 'branchManager', label: 'Branch Manager' },
    { value: 'branchAdmin', label: 'Branch Admin' }
  ];

  React.useEffect(() => {
    loadStaff();
    loadAvailableServices();
  }, []);

  const loadAvailableServices = async () => {
    try {
      const services = await serviceService.getServices();
      setAvailableServices(services);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all users assigned to this branch
      const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
      
      // Filter to show only stylists in this branch
      const stylists = users.filter(user => 
        user.roles?.includes('stylist') && 
        user.branchId === userData.branchId &&
        user.isActive === true
      );
      
      setStaff(stylists);
    } catch (error) {
      console.error('Error loading staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaff = async (userId) => {
    if (window.confirm('Are you sure you want to remove this staff member from the branch?')) {
      try {
        await userService.removeUserFromBranch(userId, userData.roles?.[0], userData.uid);
        await loadStaff();
      } catch (error) {
        console.error('Error removing staff:', error);
        setError('Failed to remove staff member');
      }
    }
  };

  const handleServiceAssignment = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowServiceAssignmentModal(true);
  };

  const handleAssignService = async (serviceId, isAssigned) => {
    try {
      if (isAssigned) {
        // Remove service from service_id array
        const updatedServices = selectedStaff.service_id?.filter(id => id !== serviceId) || [];
        await userService.updateUser(selectedStaff.uid, { service_id: updatedServices }, userData.roles?.[0], userData.uid);
      } else {
        // Add service to service_id array
        const updatedServices = [...(selectedStaff.service_id || []), serviceId];
        await userService.updateUser(selectedStaff.uid, { service_id: updatedServices }, userData.roles?.[0], userData.uid);
      }
      await loadStaff();
    } catch (error) {
      console.error('Error updating service assignment:', error);
      setError('Failed to update service assignment');
    }
  };

  const getRoleDisplayName = (role) => {
    const roleInfo = availableRoles.find(r => r.value === role);
    return roleInfo ? roleInfo.label : role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      branchAdmin: 'bg-purple-100 text-purple-800',
      branchManager: 'bg-yellow-100 text-yellow-800',
      receptionist: 'bg-pink-100 text-pink-800',
      stylist: 'bg-indigo-100 text-indigo-800',
      inventoryController: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || member.roles?.includes(roleFilter);
    return matchesSearch && matchesRole;
  });

  const getStaffStats = () => {
    const stats = {
      total: staff.length,
      byRole: {}
    };
    
    availableRoles.forEach(role => {
      stats.byRole[role.value] = staff.filter(member => 
        member.roles?.includes(role.value)
      ).length;
    });
    
    return stats;
  };

  const stats = getStaffStats();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-[#160B53]" />
            <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
             <div className="flex justify-between items-center mb-6">
               <div>
                 <h1 className="text-2xl font-bold text-gray-900">Stylist Management</h1>
                 <p className="text-gray-600">Manage stylists in your branch and their service assignments</p>
               </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
      </div>

             {/* Stats */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
               <Card className="p-4">
                 <div className="flex items-center">
                   <Users className="h-8 w-8 text-blue-600" />
                   <div className="ml-3">
                     <p className="text-sm font-medium text-gray-600">Total Stylists</p>
                     <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                   </div>
                 </div>
               </Card>
        
        {availableRoles.map(role => (
          <Card key={role.value} className="p-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{role.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.byRole[role.value]}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
            />
          </div>
          
          <div className="w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
            >
              <option value="">All Roles</option>
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
               <Card className="p-8 text-center">
                 <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No stylists found</h3>
                 <p className="text-gray-600 mb-4">
                   {searchTerm || roleFilter 
                     ? 'No stylists match your current filters.' 
                     : 'No stylists are assigned to this branch yet.'
                   }
                 </p>
                 <Button 
                   onClick={() => setShowAssignmentModal(true)}
                   className="flex items-center mx-auto"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Assign First Stylist
                 </Button>
               </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredStaff.map(member => (
                   <Card key={member.uid} className="p-6">
                     <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center space-x-3">
                         <div className="h-12 w-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                           {member.firstName?.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <h3 className="font-semibold text-gray-900">
                             {member.firstName} {member.middleName} {member.lastName}
                           </h3>
                           <p className="text-sm text-gray-600">{member.email}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                           member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                         }`}>
                           {member.isActive ? 'Active' : 'Inactive'}
                         </span>
                         <Button variant="outline" size="sm">
                           <Edit className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                     
                     <div className="space-y-2 mb-4">
                       {member.phone && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Phone className="h-4 w-4 mr-2" />
                           {member.phone}
                         </div>
                       )}
                       
                       <div className="flex items-center text-sm text-gray-600">
                         <Mail className="h-4 w-4 mr-2" />
                         {member.email}
                       </div>
                       
                       {member.address && (
                         <div className="flex items-center text-sm text-gray-600">
                           <Building2 className="h-4 w-4 mr-2" />
                           {member.address}
                         </div>
                       )}
                     </div>
                     
                     <div className="flex flex-wrap gap-1 mb-4">
                       {member.roles?.filter(role => availableRoles.some(r => r.value === role)).map(role => (
                         <span 
                           key={role}
                           className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                         >
                           {getRoleDisplayName(role)}
                         </span>
                       ))}
                     </div>
                     
                     {/* Service Assignments */}
                     {member.service_id && member.service_id.length > 0 && (
                       <div className="mb-4">
                         <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Services:</h4>
                         <div className="flex flex-wrap gap-1">
                           {member.service_id.map(serviceId => (
                             <span 
                               key={serviceId}
                               className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                             >
                               <Scissors className="h-3 w-3 mr-1" />
                               {serviceId.replace('service_', '').replace('_', ' ').toUpperCase()}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
              
                     <div className="flex space-x-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="flex-1"
                         onClick={() => handleServiceAssignment(member)}
                       >
                         <Scissors className="h-4 w-4 mr-1" />
                         Services
                       </Button>
                       
                       <Button 
                         variant="outline" 
                         size="sm"
                         onClick={() => handleRemoveStaff(member.id)}
                         className="text-red-600 hover:text-red-700 hover:border-red-300"
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
            </Card>
          ))}
        </div>
      )}

             {/* Staff Assignment Modal */}
             {showAssignmentModal && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                 <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                   <div className="p-6">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-lg font-semibold text-gray-900">Assign Staff to Branch</h3>
                       <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                     <p className="text-gray-600 mb-4">
                       This feature will be implemented to assign staff members to your branch.
                     </p>
                     <div className="flex justify-end space-x-3">
                       <Button variant="outline" onClick={() => setShowAssignmentModal(false)}>
                         Close
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {/* Service Assignment Modal */}
             {showServiceAssignmentModal && selectedStaff && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                 <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
                   <div className="p-6">
                     <div className="flex items-center justify-between mb-6">
                       <div>
                         <h3 className="text-lg font-semibold text-gray-900">Service Assignment</h3>
                         <p className="text-sm text-gray-600">Assign services to {selectedStaff.name}</p>
                       </div>
                       <Button variant="outline" onClick={() => setShowServiceAssignmentModal(false)}>
                         <X className="h-4 w-4" />
                       </Button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                       {availableServices.map(service => {
                         const isAssigned = selectedStaff.service_id?.includes(service.id) || false;
                         return (
                           <div key={service.id} className="border rounded-lg p-4">
                             <div className="flex items-center justify-between mb-2">
                               <h4 className="font-medium text-gray-900">{service.name}</h4>
                               <Button
                                 size="sm"
                                 variant={isAssigned ? "default" : "outline"}
                                 onClick={() => handleAssignService(service.id, isAssigned)}
                                 className={isAssigned ? "bg-green-600 hover:bg-green-700" : ""}
                               >
                                 {isAssigned ? "Assigned" : "Assign"}
                               </Button>
                             </div>
                             <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                             <div className="flex items-center justify-between text-xs text-gray-500">
                               <span>₱{service.price}</span>
                               <span>{service.duration} mins</span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                     
                     <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                       <Button variant="outline" onClick={() => setShowServiceAssignmentModal(false)}>
                         Close
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             )}
    </div>
  );
};

const HolidayManagementComponent = ({ onBack }) => {
  const { userData } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'public',
    description: '',
    isRecurring: false,
    isActive: true
  });

  const holidayTypes = [
    { value: 'public', label: 'Public Holiday', icon: Star, color: 'text-blue-600' },
    { value: 'religious', label: 'Religious Holiday', icon: Heart, color: 'text-purple-600' },
    { value: 'national', label: 'National Holiday', icon: Gift, color: 'text-green-600' },
    { value: 'branch', label: 'Branch Closure', icon: AlertCircle, color: 'text-red-600' },
    { value: 'special', label: 'Special Event', icon: Calendar, color: 'text-yellow-600' }
  ];

  React.useEffect(() => {
    loadHolidays();
  }, []);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load holidays for this branch
      const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
      setHolidays(branch.holidays || []);
    } catch (error) {
      console.error('Error loading holidays:', error);
      setError('Failed to load holidays');
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
      
      const holidayData = {
        ...formData,
        id: editingHoliday ? editingHoliday.id : Date.now().toString(),
        createdAt: editingHoliday ? editingHoliday.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let updatedHolidays;
      if (editingHoliday) {
        // Update existing holiday
        updatedHolidays = holidays.map(holiday => 
          holiday.id === editingHoliday.id ? holidayData : holiday
        );
      } else {
        // Add new holiday
        updatedHolidays = [...holidays, holidayData];
      }

      // Update branch with new holidays
      await branchService.updateBranch(userData.branchId, { holidays: updatedHolidays }, userData.roles?.[0], userData.uid);
      
      setHolidays(updatedHolidays);
      setShowHolidayModal(false);
      setEditingHoliday(null);
      setFormData({
        name: '',
        date: '',
        type: 'public',
        description: '',
        isRecurring: false,
        isActive: true
      });
      setSuccess(editingHoliday ? 'Holiday updated successfully' : 'Holiday added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving holiday:', error);
      setError('Failed to save holiday');
    }
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name || '',
      date: holiday.date || '',
      type: holiday.type || 'public',
      description: holiday.description || '',
      isRecurring: holiday.isRecurring || false,
      isActive: holiday.isActive !== false
    });
    setShowHolidayModal(true);
  };

  const handleDelete = async (holidayId) => {
    if (window.confirm('Are you sure you want to delete this holiday?')) {
      try {
        const updatedHolidays = holidays.filter(holiday => holiday.id !== holidayId);
        await branchService.updateBranch(userData.branchId, { holidays: updatedHolidays }, userData.roles?.[0], userData.uid);
        setHolidays(updatedHolidays);
        setSuccess('Holiday deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting holiday:', error);
        setError('Failed to delete holiday');
      }
    }
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        holiday.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || holiday.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeInfo = (type) => {
    return holidayTypes.find(t => t.value === type) || holidayTypes[0];
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-[#160B53]" />
            <h2 className="text-2xl font-bold text-gray-900">Holiday Management</h2>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holiday Management</h1>
          <p className="text-gray-600">Manage branch holidays, closures, and special events</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => {
              setEditingHoliday(null);
              setFormData({
                name: '',
                date: '',
                type: 'public',
                description: '',
                isRecurring: false,
                isActive: true
              });
              setShowHolidayModal(true);
            }}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Holiday
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search holidays by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
            />
          </div>
          
          <div className="w-48">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
            >
              <option value="all">All Types</option>
              {holidayTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
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

      {/* Holidays List */}
      {filteredHolidays.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No holidays found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' 
              ? 'No holidays match your current filters.' 
              : 'No holidays are configured for this branch yet.'
            }
          </p>
          <Button 
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Holiday
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHolidays.map(holiday => {
            const typeInfo = getTypeInfo(holiday.type);
            const Icon = typeInfo.icon;
            const isUpcoming = new Date(holiday.date) >= new Date();
            
            return (
              <Card key={holiday.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${typeInfo.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                      <Icon className={`h-6 w-6 ${typeInfo.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{holiday.name}</h3>
                      <p className="text-sm text-gray-600">{typeInfo.label}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {holiday.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${holiday.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {holiday.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(holiday.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                  
                  {holiday.description && (
                    <p className="text-sm text-gray-600">{holiday.description}</p>
                  )}
                  
                  {holiday.isRecurring && (
                    <div className="flex items-center text-sm text-blue-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Recurring annually
                    </div>
                  )}
                  
                  {isUpcoming && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Upcoming
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(holiday)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(holiday.id)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 mr-3 text-[#160B53]" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                  </h2>
                  <p className="text-sm text-gray-600">Configure holiday details and settings</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Holiday Name *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Christmas Day"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    >
                      {holidayTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
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
                    placeholder="Describe the holiday or closure reason..."
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      checked={formData.isRecurring}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Recurring annually</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Active holiday</label>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowHolidayModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex items-center">
                  <Save className="h-4 w-4 mr-2" />
                  {editingHoliday ? 'Update Holiday' : 'Add Holiday'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BranchProductsComponent = ({ onBack }) => {
  const { userData } = useAuth();
  const [branchProducts, setBranchProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [productToRemove, setProductToRemove] = useState(null);
  const [showRemoveSuccessModal, setShowRemoveSuccessModal] = useState(false);

  React.useEffect(() => {
    loadBranchProducts();
    loadAvailableProducts();
  }, []);

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

  const loadAvailableProducts = async () => {
    try {
      console.log('Loading available products...');
      console.log('User branch ID:', userData?.branchId);
      
      // Get all products from master products collection
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      
      console.log('Total products in collection:', productsSnapshot.size);
      
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
      
      console.log('Available products to add:', availableProductsList.length);
      setAvailableProducts(availableProductsList);
    } catch (error) {
      console.error('Error loading available products:', error);
      setError('Failed to load available products: ' + error.message);
    }
  };

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

  const filteredProducts = branchProducts.filter(product => {
    const productName = product.name || '';
    const productBrand = product.brand || '';
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
                         productBrand.toLowerCase().includes(searchTermLower);
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-[#160B53]" />
            <h2 className="text-2xl font-bold text-gray-900">Branch Products</h2>
          </div>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branch Products</h1>
          <p className="text-gray-600">Manage products available at your branch</p>
        </div>
        <div className="flex space-x-3">
          <Button
            className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

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
      </Card>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter !== 'All' 
              ? 'No products match your current filters.' 
              : 'No products are configured for this branch yet.'
            }
          </p>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center mx-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Product
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
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
                    <h3 className="font-semibold text-gray-900">{product.name || 'Unnamed Product'}</h3>
                    <p className="text-sm text-gray-600">{product.brand || 'Unknown Brand'}</p>
                    <p className="text-xs text-gray-500">{product.category || 'Uncategorized'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Available</span>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">{product.description}</p>
                
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  OTC: ₱{product.otcPrice}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Salon: ₱{product.salonUsePrice}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setProductToRemove(product);
                    setShowRemoveConfirmModal(true);
                  }}
                  className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

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
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">Select products from the master catalog to add to your branch:</p>
                
                {/* Products List */}
                <div className="max-h-[400px] overflow-y-auto">
                  {availableProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No products available to add</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableProducts.map((product) => (
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
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">₱{product.otcPrice?.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">Cost: ₱{product.unitCost?.toLocaleString()}</div>
                              <div className="text-sm text-gray-500">Salon: ₱{product.salonUsePrice?.toLocaleString()}</div>
                              <button
                                onClick={() => {
                                  setProductToAdd(product);
                                  setShowConfirmModal(true);
                                }}
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
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Add this branch to the product's branches array
                        const productRef = doc(db, 'products', productToAdd.id);
                        await updateDoc(productRef, {
                          branches: arrayUnion(userData.branchId)
                        });
                        
                        // Refresh the lists
                        await loadBranchProducts();
                        await loadAvailableProducts();
                        
                        setShowConfirmModal(false);
                        setShowAddModal(false);
                        setShowSuccessModal(true);
                      } catch (error) {
                        console.error('Error adding product to branch:', error);
                        setError('Failed to add product: ' + error.message);
                        setShowConfirmModal(false);
                      }
                    }}
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
              <h2 className="text-xl font-semibold text-gray-900 text-center">Remove Product from Branch</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to remove this product from your branch?
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
                    onClick={() => setShowRemoveConfirmModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Remove this branch from the product's branches array
                        const productRef = doc(db, 'products', productToRemove.id);
                        await updateDoc(productRef, {
                          branches: arrayRemove(userData.branchId)
                        });
                        
                        // Refresh the lists
                        await loadBranchProducts();
                        await loadAvailableProducts();
                        
                        setShowRemoveConfirmModal(false);
                        setShowRemoveSuccessModal(true);
                      } catch (error) {
                        console.error('Error removing product from branch:', error);
                        setError('Failed to remove product: ' + error.message);
                        setShowRemoveConfirmModal(false);
                      }
                    }}
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
            <div className="bg-green-50 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 text-center">Product Removed Successfully!</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  The product has been successfully removed from your branch.
                </p>
                
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-green-50 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
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
                  <CheckCircle className="h-5 w-5" />
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
    </div>
  );
};

export default BranchManagerSettings;
