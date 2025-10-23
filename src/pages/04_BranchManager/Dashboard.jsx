  import React from "react";
  import { Link } from "react-router-dom";
  import { useAuth } from "../../context/AuthContext";
  import { Card } from "../ui/card";
  import { Button } from "../ui/button";
  import DashboardLayout from "../shared/DashboardLayout";
import {
  Users,
  Calendar,
  Package,
  DollarSign,
  Smile,
  Scissors,
  BarChart3,
  UserCog,
  Home,
  Receipt,
} from "lucide-react";
  import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
  } from "recharts";

  const BranchManagerDashboard = () => {
    const { userData } = useAuth();
    // Sample Data
    const appointmentData = [
      { day: "Mon", appointments: 15 },
      { day: "Tue", appointments: 20 },
      { day: "Wed", appointments: 18 },
      { day: "Thu", appointments: 25 },
      { day: "Fri", appointments: 30 },
      { day: "Sat", appointments: 40 },
      { day: "Sun", appointments: 22 },
    ];

    const revenueData = [
      { week: "Week 1", revenue: 42000 },
      { week: "Week 2", revenue: 58000 },
      { week: "Week 3", revenue: 62000 },
      { week: "Week 4", revenue: 70000 },
    ];

    const menuItems = [
      { path: "/dashboard", label: "Dashboard", icon: Home },
      { path: "/appointments", label: "Appointments", icon: Calendar },
      { path: "/staff", label: "Staff", icon: Users },
      { path: "/schedule", label: "Schedule", icon: Calendar },
      { path: "/inventory", label: "Inventory", icon: Package },
      { path: "/transactions", label: "Transactions", icon: Receipt },
      { path: "/reports", label: "Reports", icon: BarChart3 },
      { path: "/profile", label: "Profile", icon: UserCog },
    ];

    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Branch Manager Dashboard">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* === STAT CARDS === */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Calendar className="h-8 w-8 text-blue-600" />,
                bg: "bg-blue-100",
                title: "Today's Appointments",
                value: 23,
              },
              {
                icon: <Users className="h-8 w-8 text-green-600" />,
                bg: "bg-green-100",
                title: "Staff On Duty",
                value: 6,
              },
              {
                icon: <Scissors className="h-8 w-8 text-pink-600" />,
                bg: "bg-pink-100",
                title: "Services Completed",
                value: 48,
              },
              {
                icon: <DollarSign className="h-8 w-8 text-purple-600" />,
                bg: "bg-purple-100",
                title: "Today's Revenue",
                value: "₱12,450",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="p-6 shadow border flex items-center transition hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`p-3 rounded-full ${item.bg}`}>{item.icon}</div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* === PERFORMANCE CHARTS === */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointment Trends */}
            <Card className="p-6 shadow border">
              <h3 className="text-lg font-semibold mb-4">Appointments This Week</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    stroke="#2563eb"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue Chart */}
            <Card className="p-6 shadow border">
              <h3 className="text-lg font-semibold mb-4">Monthly Revenue Overview</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* === RECENT INSIGHTS === */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory */}
            <Card className="p-6 shadow border">
              <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
              <ul className="space-y-2 text-gray-700">
                <li>Shampoo (3 left)</li>
                <li>Hair Color #5 (2 left)</li>
                <li>Conditioner (4 left)</li>
                <li>Massage Oil (1 left)</li>
              </ul>
              <Link to="/inventory">
                <Button className="mt-4 w-full bg-[#160B53] hover:bg-[#160B53]/90">
                  View Inventory
                </Button>
              </Link>
            </Card>

            {/* Staff Performance */}
            <Card className="p-6 shadow border">
              <h3 className="text-lg font-semibold mb-4">Top Performing Staff Today</h3>
              <ul className="space-y-3 text-gray-700">
                <li>⭐ <strong>Ana Cruz</strong> — 15 Services</li>
                <li>⭐ <strong>Marvin Dela Cruz</strong> — 12 Services</li>
                <li>⭐ <strong>Lara Santos</strong> — 10 Services</li>
              </ul>
              <Link to="/staff">
                <Button className="mt-4 w-full bg-[#160B53] hover:bg-[#160B53]/90">
                  View Staff Details
                </Button>
              </Link>
            </Card>

            
            
          </div>

          {/* === QUICK ACTIONS === */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/appointments">
                <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90 text-white">
                  <Calendar className="h-6 w-6 mb-2" />
                  Manage Appointments
                </Button>
              </Link>

              <Link to="/staff">
                <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90 text-white">
                  <Users className="h-6 w-6 mb-2" />
                  View Staff Schedules
                </Button>
              </Link>

              <Link to="/inventory">
                <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90 text-white">
                  <Package className="h-6 w-6 mb-2" />
                  Check Inventory
                </Button>
              </Link>

              <Link to="/reports">
                <Button className="h-20 w-full flex flex-col items-center justify-center bg-[#160B53] hover:bg-[#160B53]/90 text-white">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  };

  export default BranchManagerDashboard;
