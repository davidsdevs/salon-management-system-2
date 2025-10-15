import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import DashboardLayout from "../shared/DashboardLayout";
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  BarChart3,
  Printer,
  FileDown,
  Home,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const BranchManagerAppointments = () => {
  const { userData } = useAuth();

  // === SAMPLE DATA ===
  const appointmentTrend = [
    { day: "Mon", appointments: 42 },
    { day: "Tue", appointments: 58 },
    { day: "Wed", appointments: 62 },
    { day: "Thu", appointments: 71 },
    { day: "Fri", appointments: 88 },
    { day: "Sat", appointments: 95 },
    { day: "Sun", appointments: 53 },
  ];

  const serviceDistribution = [
    { service: "Haircut", count: 180 },
    { service: "Massage", count: 90 },
    { service: "Hair Color", count: 65 },
    { service: "Facial", count: 45 },
    { service: "Nails", count: 30 },
  ];

  const appointments = [
    { date: "Oct 14, 2025", customer: "Ana Cruz", service: "Haircut", staff: "Marvin", status: "Completed", revenue: 350 },
    { date: "Oct 14, 2025", customer: "Lara Santos", service: "Massage", staff: "Lara", status: "Cancelled", revenue: 0 },
    { date: "Oct 15, 2025", customer: "Mark Dela Cruz", service: "Hair Color", staff: "Joan", status: "Completed", revenue: 850 },
    { date: "Oct 15, 2025", customer: "Rico Valdez", service: "Facial", staff: "Ana", status: "Completed", revenue: 400 },
    { date: "Oct 15, 2025", customer: "Catherine Lim", service: "Nails", staff: "Joy", status: "Completed", revenue: 250 },
  ];

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/inventory", label: "Inventory", icon: BarChart3 },
  ];

  // === COMPUTED SUMMARY DATA ===
  const totalAppointments = appointments.length;
  const completed = appointments.filter(a => a.status === "Completed").length;
  const cancelled = appointments.filter(a => a.status === "Cancelled").length;
  const totalRevenue = appointments.reduce((sum, a) => sum + a.revenue, 0);

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointments Overview">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* === SUMMARY CARDS === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 shadow border flex items-center">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold">{totalAppointments}</p>
            </div>
          </Card>

          <Card className="p-6 shadow border flex items-center">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-semibold">{completed}</p>
            </div>
          </Card>

          <Card className="p-6 shadow border flex items-center">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Cancelled / No Shows</p>
              <p className="text-2xl font-semibold">{cancelled}</p>
            </div>
          </Card>

          <Card className="p-6 shadow border flex items-center">
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <DollarSign className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold">₱{totalRevenue.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* === CHARTS === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Appointment Trend Chart */}
          <Card className="p-6 shadow border">
            <h3 className="text-lg font-semibold mb-4">Appointments Trend (This Week)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={appointmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Service Distribution Chart */}
          <Card className="p-6 shadow border">
            <h3 className="text-lg font-semibold mb-4">Service Type Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={serviceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="service" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* === APPOINTMENTS TABLE === */}
        <Card className="p-6 shadow border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Appointment Records</h3>
            <div className="flex space-x-2">
              <Button variant="outline" className="flex items-center space-x-2">
                <FileDown className="h-4 w-4" />
                <span>Export CSV</span>
              </Button>
              <Button className="bg-[#160B53] text-white flex items-center space-x-2 hover:bg-[#160B53]/90">
                <Printer className="h-4 w-4" />
                <span>Print Report</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-4 py-2">Staff</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{appt.date}</td>
                    <td className="px-4 py-2">{appt.customer}</td>
                    <td className="px-4 py-2">{appt.service}</td>
                    <td className="px-4 py-2">{appt.staff}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appt.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">₱{appt.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Placeholder */}
          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <p>Showing 1–5 of 500 entries</p>
            <div className="space-x-2">
              <Button variant="outline" size="sm">Previous</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerAppointments;
