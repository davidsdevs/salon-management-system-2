import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { ROLES, getRoleDisplayName, getAllRoles } from '../../utils/roles';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import UserForm from '../../components/user/UserForm';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Filter,
  MoreVertical,
  Home,
  Building2,
  Building,
  Settings,
  BarChart3,
  UserCog,
  Eye,
  Calendar,
  Scissors,
  Package2,
  DollarSign
} from 'lucide-react';

const UserManagement = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  // Modal states
  const [showUserForm, setShowUserForm] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, [currentPage, selectedRole, showInactive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        role: selectedRole || undefined,
        isActive: showInactive ? undefined : true
      };

      // Always use search method to apply filters, even without search term
      const searchResults = await userService.searchUsers(
        searchTerm || '', 
        userData.roles?.[0], 
        filters
      );
      setUsers(searchResults);
      setHasMore(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const branchesData = await branchService.getBranches(userData.roles?.[0], userData.id);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setLastDoc(null);
    loadUsers();
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setCurrentPage(1);
    setLastDoc(null);
  };

  const handleToggleUserStatus = async (userId, isActive) => {
    try {
      if (isActive) {
        await userService.deleteUser(userId, userData.roles?.[0]);
      } else {
        await userService.reactivateUser(userId, userData.roles?.[0]);
      }
      
      // Reload users
      setCurrentPage(1);
      setLastDoc(null);
      loadUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Modal handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditing(false);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditing(true);
    setShowUserForm(true);
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleCloseModals = () => {
    setShowUserForm(false);
    setShowUserDetails(false);
    setSelectedUser(null);
    setIsEditing(false);
    setFormLoading(false);
    setError('');
    setSuccess('');
  };

  // Form submission
  const handleUserSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      if (isEditing && selectedUser) {
        // Update existing user
        await userService.updateUser(selectedUser.id, formData, userData.roles?.[0]);
        setSuccess('User updated successfully!');
      } else {
        // Create new user with Firebase Auth (tries Firebase Functions first, fallback to client-side)
        const result = await userService.createUserWithAuth(formData, userData.roles?.[0]);
        
        if (result.requiresReauth) {
          setSuccess(`User created successfully! The user ${formData.email} has been added to the system with Firebase Auth credentials. A password reset email has been sent to them. You will need to sign in again to continue.`);
          // Redirect to login after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        } else {
          setSuccess(`User created successfully! The user ${formData.email} has been added to the system with Firebase Auth credentials. A password reset email has been sent to them.`);
        }
      }

      // Reload users
      setCurrentPage(1);
      setLastDoc(null);
      await loadUsers();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        handleCloseModals();
      }, 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setFormLoading(false);
    }
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
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

  const getRoleBadge = (role) => {
    const colors = {
      [ROLES.SYSTEM_ADMIN]: 'bg-purple-100 text-purple-800',
      [ROLES.OPERATIONAL_MANAGER]: 'bg-blue-100 text-blue-800',
      [ROLES.BRANCH_ADMIN]: 'bg-green-100 text-green-800',
      [ROLES.BRANCH_MANAGER]: 'bg-yellow-100 text-yellow-800',
      [ROLES.RECEPTIONIST]: 'bg-pink-100 text-pink-800',
      [ROLES.INVENTORY_CONTROLLER]: 'bg-orange-100 text-orange-800',
      [ROLES.STYLIST]: 'bg-indigo-100 text-indigo-800',
      [ROLES.CLIENT]: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[role] || 'bg-gray-100 text-gray-800'
      }`}>
        {getRoleDisplayName(role)}
      </span>
    );
  };

  const getRoleBadges = (user) => {
    const roles = user.roles || (user.role ? [user.role] : []);
    
    if (roles.length === 0) {
      return <span className="text-gray-500 text-sm">No roles assigned</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => (
          <span key={index}>
            {getRoleBadge(role)}
          </span>
        ))}
      </div>
    );
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-management', label: 'Appointments', icon: Calendar },
    { path: '/user-management', label: 'Users', icon: UserCog },
    { path: '/branch-management', label: 'Branches', icon: Building2 },
    { path: '/service-management', label: 'Services', icon: Scissors },
    { path: '/master-products', label: 'Master Products', icon: Package2 },
    { path: '/suppliers', label: 'Suppliers', icon: Building },
    { path: '/admin/transactions', label: 'Transactions', icon: DollarSign },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="User Management">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">
            Manage staff users and their roles. Clients can self-register.
          </p>
        </div>
        
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff User
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
                  placeholder="Search users..."
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
          
          <div>
            <select
              value={selectedRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              {getAllRoles().map(role => (
                <option key={role} value={role}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
            </select>
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
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <Users className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       {getRoleBadges(user)}
                     </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.branchId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.isActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        >
                          {user.isActive ? (
                            <UserX className="h-4 w-4 text-red-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
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
              Load More Users
            </Button>
          </div>
        )}
      </Card>

      {/* User Form Modal */}
      {showUserForm && (
        <UserForm
          isOpen={showUserForm}
          onClose={handleCloseModals}
          onSubmit={handleUserSubmit}
          initialData={selectedUser}
          isEditing={isEditing}
          loading={formLoading}
          branches={branches}
        />
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50">
          {success}
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default UserManagement;
