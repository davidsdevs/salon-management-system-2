import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import StaffAssignmentModal from '../../components/user/StaffAssignmentModal';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Home,
  Calendar,
  Settings,
  BarChart3,
  UserCog,
  MoreVertical,
  Edit,
  Trash2,
  Scissors,
  Package
} from 'lucide-react';

const StaffManagement = () => {
  const { userData } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/branch-settings', label: 'Branch Settings', icon: Settings },
    { path: '/service-config', label: 'Service Configuration', icon: Scissors },
    { path: '/holiday-management', label: 'Holiday Management', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  const availableRoles = [
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'stylist', label: 'Stylist' },
    { value: 'inventoryController', label: 'Inventory Controller' },
    { value: 'branchManager', label: 'Branch Manager' },
    { value: 'branchAdmin', label: 'Branch Admin' }
  ];

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get all users assigned to this branch
      const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
      setStaff(users);
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

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Staff Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
            <p className="text-gray-600">Manage your branch staff members and assignments</p>
          </div>
          <Button 
            onClick={() => setShowAssignmentModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Staff
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
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
              <Input
                type="text"
                placeholder="Search staff by name or email..."
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
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Staff List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter 
                ? 'No staff members match your current filters.' 
                : 'No staff members are assigned to this branch yet.'
              }
            </p>
            <Button 
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center mx-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign First Staff Member
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map(member => (
              <Card key={member.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
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
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      // TODO: Implement edit staff functionality
                      console.log('Edit staff:', member.id);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
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
          <StaffAssignmentModal
            isOpen={showAssignmentModal}
            onClose={() => setShowAssignmentModal(false)}
            branchId={userData.branchId}
            currentUserRole={userData.roles?.[0]}
            currentUserId={userData.uid}
            onSuccess={loadStaff}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffManagement;
