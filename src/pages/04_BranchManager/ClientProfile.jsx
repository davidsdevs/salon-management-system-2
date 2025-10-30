import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { clientService } from '../../services/clientService';
import { branchService } from '../../services/branchService';
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Award,
  Scissors,
  Package,
  Star,
  MessageSquare,
  Home,
  UserCog,
  Receipt,
  Users,
  BarChart3
} from 'lucide-react';

const ClientProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/schedule', label: 'Schedule', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/transactions', label: 'Transactions', icon: Receipt },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/loyalty-settings', label: 'Loyalty Settings', icon: Award },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const [client, setClient] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('history');
  const [branchNames, setBranchNames] = useState({});

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [clientData, history] = await Promise.all([
        clientService.getClientById(clientId),
        clientService.getServiceHistory(clientId)
      ]);
      
      setClient(clientData);
      setServiceHistory(history);
      
      // Load branch names for points breakdown
      if (clientData.loyaltyPointsByBranch) {
        const branchIds = Object.keys(clientData.loyaltyPointsByBranch);
        const branchData = {};
        
        for (const branchId of branchIds) {
          try {
            const branch = await branchService.getBranch(branchId);
            branchData[branchId] = branch.name;
          } catch (err) {
            console.error(`Error loading branch ${branchId}:`, err);
            branchData[branchId] = 'Unknown Branch';
          }
        }
        
        setBranchNames(branchData);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      setError('Failed to load client data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Client Profile">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading client profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Client Profile">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Client not found'}
          </div>
          <Button
            onClick={() => navigate('/clients')}
            className="mt-4 bg-[#160B53] hover:bg-[#2D1B69] text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Client Profile">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={() => navigate('/clients')}
            variant="outline"
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-[#160B53] flex items-center justify-center text-white text-2xl font-bold">
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {client.phone && (
                  <div className="flex items-center text-gray-700">
                    <Phone className="h-4 w-4 mr-3 text-gray-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-gray-700">
                    <Mail className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="break-all">{client.email}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-start text-gray-700">
                    <User className="h-4 w-4 mr-3 mt-1 text-gray-500" />
                    <span>{client.address}</span>
                  </div>
                )}
                {client.birthdate && (
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-4 w-4 mr-3 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Birthday</p>
                      <p className="text-gray-900">{formatDate(client.birthdate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Loyalty Points */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Loyalty Points
                </h3>
              </div>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-purple-600 mb-2">
                  {client.loyaltyPoints || 0}
                </p>
                <p className="text-sm text-gray-600">Total Points</p>
              </div>
              
              {/* Branch Breakdown */}
              {client.loyaltyPointsByBranch && Object.keys(client.loyaltyPointsByBranch).length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs text-gray-600 mb-3 font-semibold">Points by Branch:</p>
                  <div className="space-y-2">
                    {Object.entries(client.loyaltyPointsByBranch).map(([branchId, points]) => (
                      <div key={branchId} className="flex justify-between items-center bg-white px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">
                          {branchNames[branchId] || 'Loading...'}
                        </span>
                        <span className="text-sm font-bold text-purple-700">
                          {points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 italic">
                    * Points can only be used at the branch where they were earned
                  </p>
                </div>
              )}
            </Card>

            {/* Preferences */}
            {(client.preferredStylist || client.notes) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences & Notes</h3>
                {client.preferredStylist && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Preferred Stylist</p>
                    <p className="text-sm text-gray-900">{client.preferredStylist}</p>
                  </div>
                )}
                {client.notes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700">{client.notes}</p>
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Tabs */}
              <div className="flex space-x-4 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'history'
                      ? 'border-[#160B53] text-[#160B53]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Service History
                </button>
                <button
                  onClick={() => setActiveTab('feedback')}
                  className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'feedback'
                      ? 'border-[#160B53] text-[#160B53]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Feedback & Ratings
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {serviceHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No service history yet</p>
                    </div>
                  ) : (
                    serviceHistory.map((entry, index) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4 py-3 bg-gray-50 rounded-r">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">{entry.stylist || 'Staff'}</p>
                            <p className="text-sm text-gray-600">{formatDateTime(entry.date)}</p>
                          </div>
                          {entry.rating && (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="ml-1 text-sm font-medium">{entry.rating}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Services */}
                        {entry.services && entry.services.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Services:</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.services.map((service, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  <Scissors className="h-3 w-3 mr-1" />
                                  {service.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Products */}
                        {entry.products && entry.products.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Products:</p>
                            <div className="flex flex-wrap gap-1">
                              {entry.products.map((product, idx) => (
                                <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                  <Package className="h-3 w-3 mr-1" />
                                  {product.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.feedback && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Feedback:</p>
                            <p className="text-sm text-gray-700">{entry.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'feedback' && (
                <div className="space-y-4">
                  {serviceHistory.filter(entry => entry.rating || entry.feedback).length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No feedback yet</p>
                    </div>
                  ) : (
                    serviceHistory
                      .filter(entry => entry.rating || entry.feedback)
                      .map((entry, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-gray-900">{entry.stylist || 'Staff'}</p>
                              <p className="text-sm text-gray-600">{formatDateTime(entry.date)}</p>
                            </div>
                            {entry.rating && (
                              <div className="flex items-center bg-yellow-100 px-2 py-1 rounded">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < entry.rating
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          {entry.feedback && (
                            <p className="text-gray-700 mt-2 italic">"{entry.feedback}"</p>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;
