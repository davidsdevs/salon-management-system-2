import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import UserForm from '../../components/user/UserForm';
import { appointmentService } from '../../services/appointmentService';
import { Users, Calendar, Package, DollarSign, User, Home, Building2, Building, Settings, BarChart3, UserCog, Scissors, Package2, RefreshCw, Type } from 'lucide-react';

const SystemAdminDashboard = () => {
  const { userData } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);

  const handleUpdateScheduledToPending = async () => {
    try {
      setUpdating(true);
      setUpdateMessage('Updating appointments...');
      
      const result = await appointmentService.updateScheduledToPending();
      
      setUpdateMessage(`Successfully updated ${result.updatedCount} appointments from 'scheduled' to 'pending'`);
      
      // Clear message after 5 seconds
      setTimeout(() => {
        setUpdateMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateMessage(`Update failed: ${error.message}`);
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setUpdateMessage('');
      }, 5000);
    } finally {
      setUpdating(false);
    }
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
    <DashboardLayout menuItems={menuItems} pageTitle="System Admin Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$2,450</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Test User Form Button */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test User Form</h3>
              <p className="text-sm text-gray-600">Open User Form modal for testing</p>
            </div>
            <Button
              onClick={() => setShowUserForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <UserCog className="h-4 w-4 mr-2" />
              Open User Form
            </Button>
          </div>
        </Card>

        {/* Database Update Section */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Update</h3>
              <p className="text-sm text-gray-600">Update all appointments with 'scheduled' status to 'pending'</p>
              {updateMessage && (
                <p className={`text-sm mt-2 ${updateMessage.includes('Successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {updateMessage}
                </p>
              )}
            </div>
            <Button
              onClick={handleUpdateScheduledToPending}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Content Management Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h2>
          <p className="text-sm text-gray-600 mb-4">Manage your public-facing landing pages with inline editing.</p>
          <Link to="/content-management">
            <Button className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white">
              <Type className="h-5 w-5 mr-2" />
              Manage Content
            </Button>
          </Link>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/user-management">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
            </Link>
            
            <Link to="/master-products">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <Package className="h-6 w-6 mb-2" />
                Master Products
              </Button>
            </Link>
            
            <Link to="/branch-management">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <Building2 className="h-6 w-6 mb-2" />
                Branch Management
              </Button>
            </Link>
            
            <Link to="/profile">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <User className="h-6 w-6 mb-2" />
                My Profile
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* UserForm Modal (original version) */}
      <UserForm
        isOpen={showUserForm}
        onClose={() => setShowUserForm(false)}
        onSubmit={(data) => {
          console.log('User form submitted (shared folder):', data);
          alert('Test successful! Check console for data.');
          setShowUserForm(false);
        }}
        isEditing={false}
        loading={false}
      />
    </DashboardLayout>
  );
};

export default SystemAdminDashboard;
