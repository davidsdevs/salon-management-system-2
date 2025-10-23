import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import BranchForm from '../shared/BranchForm';
import BranchDetails from '../shared/BranchDetails';
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
  Calendar,
  Phone,
  Users,
  Scissors,
  Package2
} from 'lucide-react';

const BranchManagement = () => {
  const { userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  
  // Modal states
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [showBranchDetails, setShowBranchDetails] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Menu items for System Admin
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Building2 },
    { path: '/service-management', label: 'Services', icon: Scissors },
    { path: '/master-products', label: 'Master Products', icon: Package2 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    loadBranches();
  }, [searchTerm, showInactive, statusFilter]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        status: statusFilter || undefined,
        isActive: showInactive ? undefined : true
      };

      // Always use search method to apply filters, even without search term
      const searchResults = await branchService.searchBranches(
        searchTerm || '', 
        userData.roles?.[0], 
        userData.uid,
        filters
      );
      setBranches(searchResults);
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
        userData.roles?.[0], 
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
        await branchService.deactivateBranch(branchId, userData.roles?.[0] || userData.role, userData.uid);
      } else {
        await branchService.activateBranch(branchId, userData.roles?.[0] || userData.role, userData.uid);
      }
      
      // Reload branches
      await loadBranches();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setLastDoc(null);
    loadBranches();
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


  // Modal handlers
  const handleAddBranch = () => {
    setSelectedBranch(null);
    setIsEditing(false);
    setShowBranchForm(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setIsEditing(true);
    setShowBranchForm(true);
  };

  const handleViewBranch = (branch) => {
    setSelectedBranch(branch);
    setShowBranchDetails(true);
  };

  const handleCloseModals = () => {
    setShowBranchForm(false);
    setShowBranchDetails(false);
    setSelectedBranch(null);
    setIsEditing(false);
    setFormLoading(false);
  };

  // Form submission
  const handleBranchSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError('');

      if (isEditing && selectedBranch) {
        // Update existing branch
        await branchService.updateBranch(selectedBranch.id, formData, userData.roles?.[0] || userData.role);
      } else {
        // Create new branch
        await branchService.createBranch(formData, userData.roles?.[0] || userData.role);
      }

      // Reload branches
      await loadBranches();
      
      handleCloseModals();
    } catch (error) {
      setError(error.message);
    } finally {
      setFormLoading(false);
    }
  };


  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-end items-center">
          <Button onClick={handleAddBranch}>
            <Plus className="h-4 w-4 mr-2" />
            Add Branch
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <form onSubmit={handleSearch} className="flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                      setLastDoc(null);
                      loadBranches();
                    }}
                    className="pl-10"
                  />
                </div>
              </form>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show Inactive</span>
              </label>
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
                            onClick={() => handleViewBranch(branch)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBranch(branch)}
                            title="Edit Branch"
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

      {/* Modals */}
      <BranchForm
        isOpen={showBranchForm}
        onClose={handleCloseModals}
        onSubmit={handleBranchSubmit}
        initialData={selectedBranch}
        isEditing={isEditing}
        loading={formLoading}
      />

      <BranchDetails
        isOpen={showBranchDetails}
        onClose={handleCloseModals}
        branch={selectedBranch}
        onEdit={handleEditBranch}
        onToggleStatus={handleToggleBranchStatus}
        loading={formLoading}
      />
    </div>
    </DashboardLayout>
  );
};

export default BranchManagement;
