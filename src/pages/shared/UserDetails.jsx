import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { X, User, Mail, Phone, MapPin, Calendar, Shield, UserCheck, UserX } from 'lucide-react';
import { getRoleDisplayName } from '../../utils/roles';

const UserDetails = ({ 
  isOpen, 
  onClose, 
  user, 
  onEdit, 
  onToggleStatus,
  loading = false 
}) => {
  if (!isOpen || !user) return null;

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getRoleBadge = (role) => {
    const colors = {
      'SYSTEM_ADMIN': 'bg-purple-100 text-purple-800',
      'OPERATIONAL_MANAGER': 'bg-blue-100 text-blue-800',
      'BRANCH_ADMIN': 'bg-green-100 text-green-800',
      'BRANCH_MANAGER': 'bg-yellow-100 text-yellow-800',
      'RECEPTIONIST': 'bg-pink-100 text-pink-800',
      'INVENTORY_CONTROLLER': 'bg-orange-100 text-orange-800',
      'STYLIST': 'bg-indigo-100 text-indigo-800',
      'CLIENT': 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[role] || 'bg-gray-100 text-gray-800'
      }`}>
        {getRoleDisplayName(role)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Profile Section */}
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {`${user.firstName || ''} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName || ''}`.trim()}
              </h3>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                {getStatusBadge(user.isActive)}
                {getRoleBadge(user.role)}
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{user.phone}</span>
                  </div>
                )}
                {user.branchId && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">{user.branchId}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Account Information</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">{getRoleDisplayName(user.role)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-600">
                    Created: {formatDate(user.createdAt)}
                  </span>
                </div>
                {user.lastLoginAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">
                      Last Login: {formatDate(user.lastLoginAt)}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Role Information */}
          {user.roles && user.roles.length > 1 && (
            <Card className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">All Roles</h4>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleDisplayName(role)}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={() => onEdit(user)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              Edit User
            </Button>
            <Button
              onClick={() => onToggleStatus(user.id, user.isActive)}
              className={user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : user.isActive ? (
                <div className="flex items-center">
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </div>
              ) : (
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;

