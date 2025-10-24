import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { userService } from '../../services/userService';
import { appointmentService } from '../../services/appointmentService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Users, 
  Calendar, 
  Package, 
  DollarSign, 
  User, 
  Home, 
  BarChart3, 
  UserCog, 
  Scissors,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Activity,
  Settings,
  Bell,
  Eye,
  Receipt
} from 'lucide-react';

const BranchAdminDashboard = () => {
  const { userData } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    appointments: { today: 0, total: 0, pending: 0, completed: 0 },
    staff: { total: 0, byRole: {} },
    revenue: { today: 0, thisMonth: 0 },
    activityLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
    { path: '/pos-dashboard', label: 'POS System', icon: Receipt },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/branch-settings', label: 'Branch Settings', icon: Settings },
    { path: '/service-config', label: 'Service Configuration', icon: Scissors },
    { path: '/holiday-management', label: 'Holiday Management', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if user has a branchId
      if (!userData.branchId) {
        console.warn('User does not have a branchId assigned');
        setError('No branch assigned to your account. Please contact your administrator.');
        return;
      }
      
      // Load appointments
      const today = new Date().toISOString().split('T')[0];
      const appointmentsResponse = await appointmentService.getAppointments(
        { branchId: userData.branchId, date: today },
        userData.roles?.[0],
        userData.uid
      );
      
      // Ensure appointments is an array
      const appointments = Array.isArray(appointmentsResponse) ? appointmentsResponse : 
                         Array.isArray(appointmentsResponse?.appointments) ? appointmentsResponse.appointments : [];
      
      // Load staff
      let staff = [];
      try {
        const staffResponse = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
        staff = Array.isArray(staffResponse) ? staffResponse : [];
      } catch (staffError) {
        console.warn('Error loading staff:', staffError);
        // Continue with empty staff array
      }
      
      // Load branch data
      let branch = null;
      try {
        branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
      } catch (branchError) {
        console.warn('Error loading branch data:', branchError);
        // Continue without branch data
      }
      
      // Calculate stats
      const todayAppointments = appointments.filter(apt => apt.appointmentDate === today);
      const completedAppointments = appointments.filter(apt => apt.status === 'completed');
      const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
      
      const staffByRole = {};
      staff.forEach(member => {
        member.roles?.forEach(role => {
          staffByRole[role] = (staffByRole[role] || 0) + 1;
        });
      });
      
      // Generate activity logs (mock data for now)
      const activityLogs = [
        { id: 1, type: 'appointment', message: 'New appointment booked for John Doe', time: '2 hours ago', icon: Calendar },
        { id: 2, type: 'staff', message: 'Sarah Johnson completed her shift', time: '4 hours ago', icon: Users },
        { id: 3, type: 'revenue', message: 'Daily revenue target reached', time: '6 hours ago', icon: DollarSign },
        { id: 4, type: 'system', message: 'Branch settings updated', time: '1 day ago', icon: Settings },
        { id: 5, type: 'appointment', message: 'Appointment rescheduled by client', time: '2 days ago', icon: Calendar }
      ];
      
      setDashboardData({
        appointments: {
          today: todayAppointments.length,
          total: appointments.length,
          pending: pendingAppointments.length,
          completed: completedAppointments.length
        },
        staff: {
          total: staff.length,
          byRole: staffByRole
        },
        revenue: {
          today: 1250, // Mock data
          thisMonth: 25000 // Mock data
        },
        activityLogs
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Branch Admin Dashboard">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Branch Admin Dashboard">
        <div className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 text-center">{error}</p>
          <Button 
            onClick={loadDashboardData}
            className="mt-4"
            variant="outline"
          >
            <Activity className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Branch Admin Dashboard">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.appointments.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.staff.total}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.appointments.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₱{dashboardData.revenue.today.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Staff by Role */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff by Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.staff.byRole).map(([role, count]) => (
              <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{role}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/branch-appointments">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Manage Appointments
              </Button>
            </Link>
            <Link to="/staff">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Button>
            </Link>
            <Link to="/service-config">
              <Button variant="outline" className="w-full justify-start">
                <Scissors className="h-4 w-4 mr-2" />
                Configure Services
              </Button>
            </Link>
          </div>
        </Card>

        {/* Activity Logs */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {dashboardData.activityLogs.map(activity => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchAdminDashboard;
