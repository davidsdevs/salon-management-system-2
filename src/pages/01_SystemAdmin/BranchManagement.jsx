import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Power, 
  PowerOff,
  Filter,
  MoreVertical,
  Home,
  Settings,
  BarChart3,
  UserCog,
  MapPin,
  Phone,
  Clock,
  Users
} from 'lucide-react';

const BranchManagement = () => {
  const { userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  // Menu items for System Admin
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/user-management', label: 'User Management', icon: UserCog },
    { path: '/branch-management', label: 'Branch Management', icon: Building2 },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
    { path: '/profile', label: 'Profile', icon: UserCog }
  ];

  useEffect(() => {
    loadBranches();
  }, [searchTerm, showInactive]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        isActive: showInactive ? undefined : true
      };

      if (searchTerm) {
        const searchResults = await branchService.searchBranches(
          searchTerm, 
          userData.role, 
          userData.uid,
          filters
        );
        setBranches(searchResults);
      } else {
        const branchResults = await branchService.getBranches(
          userData.role, 
          userData.uid
        );
        setBranches(branchResults);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      setLoading(true);
      const moreBranches = await branchService.getBranches(
        userData.role, 
        userData.uid, 
        20, 
        lastDoc
      );
      
      if (moreBranches.length > 0) {
        setBranches(prev => [...prev, ...moreBranches]);
        setLastDoc(moreBranches[moreBranches.length - 1]);
        setHasMore(moreBranches.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBranchStatus = async (branchId, isActive) => {
    try {
      if (isActive) {
        await branchService.deactivateBranch(branchId, userData.role, userData.uid);
      } else {
        await branchService.activateBranch(branchId, userData.role, userData.uid);
      }
      
      // Reload branches
      await loadBranches();
    } catch (error) {
      setError(error.message);
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

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
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
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Manage salon branches and their configurations</p>
          </div>
          <Button className="bg-[#160B53] hover:bg-[#160B53]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <form onSubmit={(e) => { e.preventDefault(); loadBranches(); }} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search branches..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Search
                  </Button>
                </form>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Inactive</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Branches Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
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
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53] mx-auto"></div>
                    </td>
                  </tr>
                ) : branches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No branches found
                    </td>
                  </tr>
                ) : (
                  branches.map((branch) => (
                    <tr key={branch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {branch.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {branch.contactNumber || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {getOperatingHours(branch.operatingHours)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(branch.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(branch.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* View branch details */}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {/* Edit branch */}}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleBranchStatus(branch.id, branch.isActive)}
                          >
                            {branch.isActive ? (
                              <PowerOff className="h-4 w-4 text-red-600" />
                            ) : (
                              <Power className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {hasMore && !loading && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Button
                onClick={loadMore}
                variant="outline"
                className="w-full"
              >
                Load More
              </Button>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagement;
