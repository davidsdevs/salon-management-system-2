import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  Eye,
  Home,
  BarChart3,
  UserCog
} from 'lucide-react';

const BranchOverview = () => {
  const { userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-management', label: 'Branch Management', icon: Building2 },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    loadBranches();
    loadStats();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const branchResults = await branchService.getBranches(
        userData.role, 
        userData.uid
      );
      setBranches(branchResults);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const branchStats = await branchService.getBranchStats(
        userData.role, 
        userData.uid
      );
      setStats(branchStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOperatingHours = (operatingHours) => {
    if (!operatingHours) return 'Not set';
    
    const days = Object.keys(operatingHours);
    if (days.length === 0) return 'Not set';
    
    const firstDay = days[0];
    const hours = operatingHours[firstDay];
    return `${hours.open} - ${hours.close}`;
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Overview">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Branches List */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">All Branches</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No branches found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch) => (
                  <Card key={branch.id} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-gray-900">{branch.name}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            branch.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-3 w-3 mr-2" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                      
                      {branch.contactNumber && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-2" />
                          <span>{branch.contactNumber}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-3 w-3 mr-2" />
                        <span>{getOperatingHours(branch.operatingHours)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Created {formatDate(branch.createdAt)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* View branch details */}}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchOverview;

