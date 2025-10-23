import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { appointmentService } from '../../services/appointmentService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Building2, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  Home,
  UserCog,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

const BranchMonitoring = () => {
  const { userData } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState(null);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointment-reports', label: 'Appointment Reports', icon: Calendar },
    { path: '/branch-monitoring', label: 'Branch Monitoring', icon: Building2 },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const branchesData = await branchService.getBranches(userData.roles?.[0], userData.uid);
      setBranches(branchesData.branches || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const getBranchStatus = (branch) => {
    if (!branch.isActive) return { status: 'inactive', color: 'text-red-600', bg: 'bg-red-100' };
    
    // Check if branch has staff
    if (!branch.staffCount || branch.staffCount === 0) {
      return { status: 'no-staff', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    }
    
    return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'no-staff':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'no-staff':
        return 'No Staff';
      default:
        return 'Unknown';
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        branch.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && branch.isActive) ||
                         (statusFilter === 'inactive' && !branch.isActive);
    return matchesSearch && matchesStatus;
  });

  const getOverallStats = () => {
    const total = branches.length;
    const active = branches.filter(b => b.isActive).length;
    const inactive = total - active;
    const withStaff = branches.filter(b => b.staffCount > 0).length;
    const withoutStaff = total - withStaff;

    return { total, active, inactive, withStaff, withoutStaff };
  };

  const stats = getOverallStats();

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Monitoring">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branch Monitoring</h1>
            <p className="text-gray-600">Monitor all branches and their operational status</p>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inactive Branches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withStaff}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No Staff</p>
                <p className="text-2xl font-bold text-gray-900">{stats.withoutStaff}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search branches by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
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

        {/* Branches List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No branches match your current filters.' 
                : 'No branches are available for monitoring.'
              }
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => {
              const branchStatus = getBranchStatus(branch);
              return (
                <Card key={branch.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
                        {branch.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                        <p className="text-sm text-gray-600">{branch.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(branchStatus.status)}
                      <span className={`text-sm font-medium ${branchStatus.color}`}>
                        {getStatusText(branchStatus.status)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {branch.contactNumber && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {branch.contactNumber}
                      </div>
                    )}
                    
                    {branch.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {branch.email}
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {branch.address}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Staff</p>
                      <p className="text-lg font-bold text-gray-900">{branch.staffCount || 0}</p>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Appointments</p>
                      <p className="text-lg font-bold text-gray-900">{branch.appointmentCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedBranch(branch)}
                    >
                      View Details
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement branch management actions
                        console.log('Manage branch:', branch.id);
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Branch Details Modal would go here */}
        {selectedBranch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">{selectedBranch.name}</h2>
                  <Button variant="outline" onClick={() => setSelectedBranch(null)}>
                    Close
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600">Branch details and management options will be implemented here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchMonitoring;
