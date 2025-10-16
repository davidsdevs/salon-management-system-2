import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { ROLES, getRoleDisplayName, getAllRoles } from '../../utils/roles';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
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
  Settings,
  BarChart3,
  UserCog
} from 'lucide-react';

const UserManagement = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  const pageSize = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, selectedRole, showInactive]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const filters = {
        role: selectedRole || undefined,
        isActive: showInactive ? undefined : true
      };

      if (searchTerm) {
        const searchResults = await userService.searchUsers(
          searchTerm, 
          userData.role, 
          filters
        );
        setUsers(searchResults);
        setHasMore(false);
      } else {
        const result = await userService.getUsers(
          userData.role, 
          userData.uid, 
          pageSize, 
          currentPage === 1 ? null : lastDoc
        );
        
        if (currentPage === 1) {
          setUsers(result.users);
        } else {
          setUsers(prev => [...prev, ...result.users]);
        }
        
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
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
        await userService.deleteUser(userId, userData.role);
      } else {
        await userService.reactivateUser(userId, userData.role);
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

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/user-management', label: 'User Management', icon: Users },
    { path: '/branch-management', label: 'Branch Management', icon: Building2 },
    { path: '/system-settings', label: 'System Settings', icon: Settings },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
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
        
        <Button>
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
                      {getRoleBadge(user.role)}
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
                    {/* Actions */}
<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
  <div className="flex space-x-2">
    {/* View Appointment */}
    <Button
      size="sm"
      variant="outline"
      onClick={() => alert(`Viewing ${a.customer}`)}
    >
      <Search className="h-4 w-4" />
    </Button>

    {/* Cancel Appointment */}
    {a.status !== "Cancelled" && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => alert(`Cancelled appointment ${a.id}`)}
      >
        <XCircle className="h-4 w-4 text-red-600" />
      </Button>
    )}

    {/* Optional: Confirm Appointment if needed */}
    {a.status === "Pending" && (
      <Button
        size="sm"
        variant="outline"
        onClick={() => alert(`Confirmed appointment ${a.id}`)}
      >
        <CheckCircle className="h-4 w-4 text-green-600" />
      </Button>
    )}
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
    </div>
    </DashboardLayout>
  );
};

export default UserManagement;
