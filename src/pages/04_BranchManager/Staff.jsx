import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { staffApiService } from "../../services/staffApiService";

import { 
  Users, 
  UserCog, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter, 
  FileText, 
  FileDown, 
  Printer, 
  Home, 
  Calendar, 
  Package, 
  BarChart3,
  Receipt,
  Award
} from "lucide-react";

const BranchManagerStaff = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load staff data on component mount
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userData?.branchId) {
          throw new Error('Branch ID not found');
        }

        const response = await staffApiService.getBranchStaff(
          userData.branchId,
          userData.role
        );

        if (response.success) {
          setStaffData(response.staff);
        } else {
          throw new Error('Failed to load staff data');
        }
      } catch (err) {
        console.error('Error loading staff data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadStaffData();
    }
  }, [userData]);

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/transactions", label: "Transactions", icon: Receipt },
    { path: "/loyalty-settings", label: "Loyalty Settings", icon: Award },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // === Filter State ===
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const roles = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.role)))], [staffData]);
  const branches = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.branchId)))], [staffData]);

  // === Filtered Staff ===
  const filteredStaff = useMemo(() => {
    return staffData.filter(s => {
      const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const matchesQuery = query === "" || fullName.includes(query.toLowerCase()) || s.email?.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "All" || s.role === roleFilter;
      const matchesBranch = branchFilter === "All" || s.branchId === branchFilter;
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);
      return matchesQuery && matchesRole && matchesBranch && matchesStatus;
    });
  }, [staffData, query, roleFilter, branchFilter, statusFilter]);

  // === Summary ===
  const totalStaff = staffData.length;
  const activeStaff = staffData.filter(s => s.isActive).length;
  const inactiveStaff = staffData.filter(s => !s.isActive).length;

  const roleCounts = useMemo(() => {
    const counts = {};
    staffData.forEach(s => counts[s.role] = (counts[s.role] || 0) + 1);
    return counts;
  }, [staffData]);

  // === Actions ===
  const exportCSV = (rows = filteredStaff, filename = "staff.csv") => {
    if (!rows.length) { alert("No data to export."); return; }
    const header = ["Name", "Role", "Branch", "Status", "Joined", "Probation End"];
    const csv = [
      header.join(","),
      ...rows.map(r => [r.name, r.role, r.branch, r.isActive ? "Active" : "Inactive", r.joinedAt, r.probationEnd].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Staff Management">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
              <p className="text-gray-600">Loading staff data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Staff Management">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-red-500 text-center">
                <p className="text-lg font-semibold">Error Loading Staff Data</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Staff Management">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* === Summary Cards === */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="bg-white p-4 flex items-center gap-4 shadow border">
    <div className="p-3 bg-blue-100 rounded-full">
      <Users className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Total Staff</p>
      <p className="text-2xl font-semibold">{totalStaff}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow border">
    <div className="p-3 bg-green-100 rounded-full">
      <CheckCircle className="h-6 w-6 text-green-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Active</p>
      <p className="text-2xl font-semibold">{activeStaff}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow border">
    <div className="p-3 bg-red-100 rounded-full">
      <XCircle className="h-6 w-6 text-red-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Inactive</p>
      <p className="text-2xl font-semibold">{inactiveStaff}</p>
    </div>
  </Card>
</div>

        {/* === Filter + Search + Actions === */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">

          {/* Left Section: Filter + Search */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" /> Filter
            </Button>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search staff..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 3a7.5 7.5 0 006.15 13.65z" />
              </svg>
            </div>
          </div>

          {/* Right Section: Export + Print */}
          <div className="flex gap-2">
            <Button
              onClick={() => exportCSV(staffData, "staff_all.csv")}
              className="flex items-center gap-1 border bg-white text-gray-700"
            >
              <FileDown className="h-4 w-4" /> All
            </Button>
            <Button
              onClick={() => exportCSV(filteredStaff, "staff_filtered.csv")}
              className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
            >
              <FileText className="h-4 w-4" /> Filtered
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-1 border bg-white text-gray-700"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        {/* === Staff Table === */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No staff found.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.firstName} {s.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{s.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.branchId || 'Not assigned'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                        <Button
                          size="sm"
                          className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-[#160B53] hover:text-white transition-colors"
                          onClick={() => navigate(`/staff/details`, { state: { staffId: s.id } })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

export default BranchManagerStaff;
