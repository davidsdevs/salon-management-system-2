import React, { useState, useEffect } from 'react';
import { Button } from '../../pages/ui/button';
import { Input } from '../../pages/ui/input';
import { Card } from '../../pages/ui/card';
import { X, Search, User, Building2, Shield, Filter } from 'lucide-react';
import { userService } from '../../services/userService';
import { branchService } from '../../services/branchService';
import { ROLES } from '../../utils/roles';

const StaffAssignmentModal = ({ 
  isOpen, 
  onClose, 
  branchId, 
  currentUserRole, 
  currentUserId,
  onSuccess 
}) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 300);
  };

  const availableRoles = [
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'stylist', label: 'Stylist' },
    { value: 'inventoryController', label: 'Inventory Controller' },
    { value: 'branchManager', label: 'Branch Manager' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers(currentUserRole, currentUserId);
      
      // Filter out users already assigned to branches and system admins
      const availableUsers = usersData.filter(user => 
        !user.branchId && 
        user.roles && 
        user.roles.some(role => availableRoles.some(r => r.value === role)) &&
        user.roles.includes('systemAdmin') === false
      );
      
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(user => 
        user.roles && user.roles.includes(roleFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      setError('');

      for (const userId of selectedUsers) {
        await userService.assignUserToBranch(userId, branchId, currentUserRole, currentUserId);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning users:', error);
      setError('Failed to assign users to branch');
    } finally {
      setAssigning(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleInfo = availableRoles.find(r => r.value === role);
    return roleInfo ? roleInfo.label : role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      receptionist: 'bg-pink-100 text-pink-800',
      stylist: 'bg-indigo-100 text-indigo-800',
      inventoryController: 'bg-orange-100 text-orange-800',
      branchManager: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-200 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden transition-all duration-300 ease-out transform ${isAnimating ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-8 scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="h-6 w-6 mr-3 text-[#160B53]" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Staff to Branch</h2>
              <p className="text-sm text-gray-600">Select users to assign to this branch</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No available users found</p>
                <p className="text-sm">All users may already be assigned to branches</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <Card 
                    key={user.id} 
                    className={`p-4 cursor-pointer transition-all ${
                      selectedUsers.includes(user.id) 
                        ? 'border-[#160B53] bg-[#160B53]/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="h-4 w-4 text-[#160B53] focus:ring-[#160B53] border-gray-300 rounded"
                        />
                        <div className="h-10 w-10 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.filter(role => availableRoles.some(r => r.value === role)).map(role => (
                          <span 
                            key={role}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                          >
                            {getRoleDisplayName(role)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Selected Users Summary */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{selectedUsers.length}</strong> user{selectedUsers.length > 1 ? 's' : ''} selected for assignment
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={selectedUsers.length === 0 || assigning}
            className="flex items-center"
          >
            {assigning ? 'Assigning...' : `Assign ${selectedUsers.length} User${selectedUsers.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffAssignmentModal;
