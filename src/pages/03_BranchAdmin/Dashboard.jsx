import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { Users, Calendar, Package, DollarSign, User, Home, BarChart3, UserCog, Scissors } from 'lucide-react';

const BranchAdminDashboard = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Admin Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">23</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Staff Members</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Inventory Items</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Branch Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$1,890</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/appointments">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <Calendar className="h-6 w-6 mb-2" />
                Manage Appointments
              </Button>
            </Link>
            
            <Link to="/inventory">
              <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90">
                <Package className="h-6 w-6 mb-2" />
                Manage Inventory
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
    </DashboardLayout>
  );
};

export default BranchAdminDashboard;
