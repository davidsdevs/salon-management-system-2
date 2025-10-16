import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

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
  Package,
  UserCog,
  Eye,
  Filter,
  FileText,
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

  // === Sample Appointments Data ===
  const appointmentsData = [
    { id: 1, date: "2025-10-14", customer: "Ana Cruz", service: "Haircut", staff: "Marvin", status: "Completed", revenue: 350 },
    { id: 2, date: "2025-10-14", customer: "Lara Santos", service: "Massage", staff: "Lara", status: "Cancelled", revenue: 0 },
    { id: 3, date: "2025-10-15", customer: "Mark Dela Cruz", service: "Hair Color", staff: "Joan", status: "Completed", revenue: 850 },
    { id: 4, date: "2025-10-15", customer: "Rico Valdez", service: "Facial", staff: "Ana", status: "Completed", revenue: 400 },
    { id: 5, date: "2025-10-15", customer: "Catherine Lim", service: "Nails", staff: "Joy", status: "Pending", revenue: 250 },
  ];

  // Menu (kept as your real code)
  const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/appointments", label: "Appointments", icon: Calendar },
  { path: "/staff", label: "Staff", icon: Users },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/inventory", label: "Inventory", icon: Package },
  { path: "/reports", label: "Reports", icon: BarChart3 },
  { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // === Filter State ===
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stylistFilter, setStylistFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const stylists = useMemo(() => ["All", ...Array.from(new Set(appointmentsData.map(a => a.staff)))], []);

  // === Filtered Appointments ===
  const filteredAppointments = useMemo(() => {
    return appointmentsData.filter(a => {
      const matchesQuery = query === "" || a.customer.toLowerCase().includes(query.toLowerCase()) || a.service.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      const matchesStylist = stylistFilter === "All" || a.staff === stylistFilter;
      const apptDate = new Date(a.date);
      const fromOk = !dateFrom || apptDate >= new Date(dateFrom);
      const toOk = !dateTo || apptDate <= new Date(dateTo);
      return matchesQuery && matchesStatus && matchesStylist && fromOk && toOk;
    });
  }, [query, statusFilter, stylistFilter, dateFrom, dateTo]);

  // === Summary ===
  const totalAppointments = appointmentsData.length;
  const completed = appointmentsData.filter(a => a.status === "Completed").length;
  const cancelled = appointmentsData.filter(a => a.status === "Cancelled").length;
  const totalRevenue = appointmentsData.reduce((s, a) => s + a.revenue, 0);

  // === Stylist Performance ===
  const stylistPerformance = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const from = dateFrom || today;
    const to = dateTo || today;
    const filteredByDate = appointmentsData.filter(a => {
      const apptDate = new Date(a.date);
      return apptDate >= new Date(from) && apptDate <= new Date(to);
    });
    const filteredByStylist = stylistFilter === "All"
      ? filteredByDate
      : filteredByDate.filter(a => a.staff === stylistFilter);
    const perf = {};
    filteredByStylist.forEach(a => {
      if (!perf[a.staff]) perf[a.staff] = { staff: a.staff, appointments: 0, revenue: 0 };
      perf[a.staff].appointments += 1;
      perf[a.staff].revenue += a.revenue;
    });
    return Object.values(perf);
  }, [appointmentsData, stylistFilter, dateFrom, dateTo]);

  // === Actions ===
  const exportCSV = (rows = filteredAppointments, filename = "appointments.csv") => {
    if (!rows.length) { alert("No data to export."); return; }
    const header = ["Date", "Customer", "Service", "Stylist", "Status", "Revenue"];
    const csv = [header.join(","), ...rows.map(r => [r.date, `"${r.customer}"`, `"${r.service}"`, `"${r.staff}"`, r.status, r.revenue].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const printReport = () => window.print();

  const generateStylistReportCSV = (stylist) => {
    const rows = filteredAppointments.filter(r => r.staff === stylist);
    if (!rows.length) { alert(`No appointments for ${stylist}`); return; }
    exportCSV(rows, `${stylist.replace(/\s+/g, "_")}_appointments.csv`);
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointments Overview">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Summary Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><Calendar className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold text-center">{totalAppointments}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><CheckCircle className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-center">{completed}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full"><XCircle className="h-6 w-6 text-red-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Cancelled / No-shows</p>
              <p className="text-2xl font-semibold text-center">{cancelled}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-full"><DollarSign className="h-6 w-6 text-purple-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-center">₱{totalRevenue.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* === Filter + Actions === */}
        <div className="flex justify-between items-center gap-2">
          <Button
            className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#160B53]-700 transition-colors"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4" /> Filter
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => exportCSV(appointmentsData, "appointments_all.csv")} className="flex items-center gap-1 border bg-white text-gray-700">
              <FileDown className="h-4 w-4"/> All
            </Button>
            <Button onClick={() => exportCSV(filteredAppointments, "appointments_filtered.csv")} className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#160B53]-700 transition-colors">
              <FileText className="h-4 w-4"/> Filtered
            </Button>
            <Button onClick={printReport} className="flex items-center gap-1 border bg-white text-gray-700">
              <Printer className="h-4 w-4"/> Print
            </Button>
          </div>
        </div>

        {/* === Filter Modal === */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h2 className="text-lg font-semibold mb-4">Filter Appointments</h2>
              <input type="text" placeholder="Search customer/service..." className="border rounded-md p-2 mb-3 w-full" value={query} onChange={e => setQuery(e.target.value)}/>
              <select className="border rounded-md p-2 mb-3 w-full" value={stylistFilter} onChange={e => setStylistFilter(e.target.value)}>
                {stylists.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="border rounded-md p-2 mb-3 w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="flex gap-2 mb-3">
                <input type="date" className="border rounded-md p-2 flex-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)}/>
                <input type="date" className="border rounded-md p-2 flex-1" value={dateTo} onChange={e => setDateTo(e.target.value)}/>
              </div>
              <div className="flex justify-end gap-2">
              {/* Reset Button */}
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setQuery("");
                  setStylistFilter("All");
                  setStatusFilter("All");
                  setDateFrom("");
                  setDateTo("");
                }}
              >
                Reset
              </Button>

              <Button
                className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                onClick={() => setIsFilterOpen(false)}
              >
                Apply
              </Button>
            </div>
            </div>
          </div>
        )}

        {/* === Charts === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Appointment Trend */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><Calendar className="h-5 w-5 text-[#160B53]-600"/><h3 className="text-sm font-semibold">Appointments Trend</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={appointmentsData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="date"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="id" stroke="#2563eb" strokeWidth={2} name="Appointments"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Stylist Performance */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2"><BarChart3 className="h-5 w-5 text-pink-600"/><h3 className="text-sm font-semibold">Stylist Performance</h3></div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stylistPerformance} margin={{ top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="staff"/>
                <YAxis/>
                <Tooltip formatter={(value, name) => name === "revenue" ? `₱${value}` : value}/>
                <Bar dataKey="appointments" fill="#7c3aed" radius={[6,6,0,0]} name="Appointments"/>
                <Bar dataKey="revenue" fill="#2563eb" radius={[6,6,0,0]} name="Revenue"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* === Appointments Table === */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                 
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stylist</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      

                      {/* Customer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{a.customer}</div>
                          </div>
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.service}</td>

                      {/* Stylist */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{a.staff}</td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === "Completed"
                              ? "bg-green-100 text-green-800"
                              : a.status === "Cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Revenue */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        ₱{a.revenue.toLocaleString()}
                      </td>
                      
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(a.date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* View Appointment */}
                          <Button
                            size="sm"
                            className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-[#160B53] hover:text-white transition-colors"

                            onClick={() => alert(`Viewing ${a.customer}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Cancel Appointment */}
                          {a.status !== "Cancelled" && (
                            <Button
                              size="sm"
                              className="group flex items-center justify-center p-2 bg-white border border-red-300 hover:bg-red-600 hover:text-white transition-colors"
                              onClick={() => alert(`Cancelled appointment ${a.id}`)}
                            >
                              <XCircle className="h-4 w-4 text-red-600 group-hover:text-white" />
                            </Button>
                          )}

                          {/* Confirm Appointment */}
                          {a.status === "Pending" && (
                            <Button
                        size="sm"
                        className="group flex items-center justify-center p-2 bg-white border border-green-300 hover:bg-green-600 hover:text-white transition-colors"
                        onClick={() => alert(`Confirmed appointment ${a.id}`)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600 group-hover:text-white" />
                      </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerAppointments;
