import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { Users, Calendar, Bell, User, Home, UserCog } from 'lucide-react';

const ReceptionistDashboard = () => {
  const { userData } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/appointments', label: 'Appointments', icon: Calendar },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Receptionist Dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">15</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Clients</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
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

export default ReceptionistDashboard;
