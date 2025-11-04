import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { clientService } from '../../services/clientService';
import { branchService } from '../../services/branchService';
import { 
  User,
  Phone,
  Mail,
  Calendar,
  Award,
  Gift,
  Edit,
  Scissors,
  Star,
  MessageSquare,
  Copy,
  Check,
  Home,
  UserCog,
  MapPin
} from 'lucide-react';

const MyProfile = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/my-appointments', label: 'My Appointments', icon: Calendar },
    { path: '/services', label: 'Services', icon: Scissors },
    { path: '/branches', label: 'Branches', icon: MapPin },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const [client, setClient] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [branchNames, setBranchNames] = useState({});

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [clientData, history] = await Promise.all([
        clientService.getClientById(userData?.uid || userData?.id),
        clientService.getServiceHistory(userData?.uid || userData?.id)
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
      console.error('Error loading profile:', error);
      setError('Failed to load profile: ' + error.message);
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

  const copyReferralCode = () => {
    if (client?.referralCode) {
      navigator.clipboard.writeText(client.referralCode);
      setCopiedReferral(true);
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="My Profile">
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !client) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="My Profile">
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Profile not found'}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const stats = {
    totalVisits: serviceHistory.length,
    totalSpent: serviceHistory.reduce((sum, h) => sum + (h.totalAmount || 0), 0),
    avgRating: serviceHistory.filter(h => h.rating).length > 0
      ? (serviceHistory.reduce((sum, h) => sum + (h.rating || 0), 0) / serviceHistory.filter(h => h.rating).length).toFixed(1)
      : 'N/A'
  };

  return (
    <DashboardLayout pageTitle="My Profile">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {client.firstName}!
            </h1>
            <p className="text-gray-600 mt-1">Manage your profile and view your service history</p>
          </div>
          <Button
            onClick={() => navigate('/client/profile/edit')}
            variant="outline"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-[#160B53]" />
                Personal Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{client.firstName} {client.lastName}</p>
                </div>
                {client.phone && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-900">{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-900">{client.email}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                  <div>
                    <p className="text-gray-500 text-xs">Member Since</p>
                    <p className="text-gray-900">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
                {client.birthdate && (
                  <div className="flex items-center text-sm">
                    <Gift className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <p className="text-gray-500 text-xs">Birthday</p>
                      <p className="text-gray-900">{formatDate(client.birthdate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Loyalty Program */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-purple-600" />
                  Loyalty Rewards
                </h3>
              </div>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-purple-600 mb-2">
                  {client.loyaltyPoints || 0}
                </p>
                <p className="text-sm text-gray-600 mb-2">Total Points</p>
                <p className="text-xs text-gray-500">
                  Earn points on every purchase!
                </p>
              </div>
              
              {/* Branch Breakdown */}
              {client.loyaltyPointsByBranch && Object.keys(client.loyaltyPointsByBranch).length > 0 && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs text-gray-600 mb-3 font-semibold text-center">Your Points by Branch:</p>
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
                  <p className="text-xs text-gray-500 mt-3 italic text-center">
                    * Points can only be used at the branch where they were earned
                  </p>
                </div>
              )}
              {client.referralCode && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <p className="text-xs text-gray-600 mb-2">Your Referral Code</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-mono font-bold text-purple-700 bg-white px-3 py-2 rounded flex-1">
                      {client.referralCode}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyReferralCode}
                      className="flex-shrink-0"
                    >
                      {copiedReferral ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share with friends to earn bonus points!
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Visits</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalVisits}</p>
                  </div>
                  <Scissors className="h-8 w-8 text-blue-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">₱{stats.totalSpent.toFixed(2)}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>
            </div>

            {/* Service History */}
            <Card>
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">My Service History</h3>
              </div>
              
              {serviceHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No service history yet</p>
                  <p className="text-sm text-gray-500 mt-2">Book your first appointment to get started!</p>
                </div>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {serviceHistory.map((history) => (
                    <div key={history.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Scissors className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">
                              {history.services?.map(s => s.serviceName || s.name).join(', ') || 'Service'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            by {history.stylist || 'Stylist'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDateTime(history.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₱{(history.totalAmount || 0).toFixed(2)}
                          </p>
                          {history.rating && (
                            <div className="flex items-center mt-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-700 ml-1">{history.rating}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {history.feedback && (
                        <div className="mt-2 flex items-start text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <MessageSquare className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <p>{history.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MyProfile;
