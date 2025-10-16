import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";

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
  BarChart3 
} from "lucide-react";

const BranchManagerStaff = () => {
  const { userData } = useAuth();

  // === Sample Staff Data ===
  const staffData = [
    { id: 1, name: "Marvin Santos", role: "Stylist", branch: "Subic", isActive: true, joinedAt: "2025-01-10", probationEnd: "2025-12-31" },
    { id: 2, name: "Lara Cruz", role: "Masseuse", branch: "Subic", isActive: true, joinedAt: "2025-03-12", probationEnd: "2025-10-20" },
    { id: 3, name: "Joan Dela Cruz", role: "Stylist", branch: "Subic", isActive: false, joinedAt: "2025-02-15", probationEnd: "2025-08-30" },
    { id: 4, name: "Ana Lim", role: "Facialist", branch: "Subic", isActive: true, joinedAt: "2025-04-20", probationEnd: "2025-11-15" },
  ];

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Users },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // === Filter State ===
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const roles = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.role)))], []);
  const branches = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.branch)))], []);

  // === Filtered Staff ===
  const filteredStaff = useMemo(() => {
    return staffData.filter(s => {
      const matchesQuery = query === "" || s.name.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "All" || s.role === roleFilter;
      const matchesBranch = branchFilter === "All" || s.branch === branchFilter;
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);
      return matchesQuery && matchesRole && matchesBranch && matchesStatus;
    });
  }, [query, roleFilter, branchFilter, statusFilter]);

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

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Staff Management">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* === Summary Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><Users className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Total Staff</p>
              <p className="text-2xl font-semibold text-center">{totalStaff}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><CheckCircle className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-center">{activeStaff}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full"><XCircle className="h-6 w-6 text-red-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-center">{inactiveStaff}</p>
            </div>
          </Card>
          <Card className="p-4 flex flex-col gap-2">
            <p className="text-xs text-gray-500">Roles Overview</p>
            {Object.entries(roleCounts).map(([role, count]) => (
              <p key={role} className="text-sm text-gray-700">{role}: {count}</p>
            ))}
          </Card>
        </div>

        {/* === Filter + Actions === */}
        <div className="flex justify-between items-center gap-2">
          <Button
            className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4" /> Filter
          </Button>

          <div className="flex gap-2">
            <Button onClick={() => exportCSV(staffData, "staff_all.csv")} className="flex items-center gap-1 border bg-white text-gray-700">
              <FileDown className="h-4 w-4"/> All
            </Button>
            <Button onClick={() => exportCSV(filteredStaff, "staff_filtered.csv")} className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors">
              <FileText className="h-4 w-4"/> Filtered
            </Button>
            <Button onClick={() => window.print()} className="flex items-center gap-1 border bg-white text-gray-700">
              <Printer className="h-4 w-4"/> Print
            </Button>
          </div>
        </div>

        {/* === Filter Modal === */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h2 className="text-lg font-semibold mb-4">Filter Staff</h2>
              <input type="text" placeholder="Search name..." className="border rounded-md p-2 mb-3 w-full" value={query} onChange={e => setQuery(e.target.value)}/>
              <select className="border rounded-md p-2 mb-3 w-full" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select className="border rounded-md p-2 mb-3 w-full" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="border rounded-md p-2 mb-3 w-full" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setQuery(""); setRoleFilter("All"); setBranchFilter("All"); setStatusFilter("All");
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probation End</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.branch}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(s.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(s.probationEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-[#160B53] hover:text-white transition-colors"
                            onClick={() => alert(`Viewing ${s.name}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className={`flex items-center justify-center p-2 bg-white border transition-colors ${s.isActive ? "border-red-300 hover:bg-red-600 hover:text-white" : "border-green-300 hover:bg-green-600 hover:text-white"}`}
                            onClick={() => alert(`${s.isActive ? "Deactivated" : "Activated"} ${s.name}`)}
                          >
                            {s.isActive ? <XCircle className="h-4 w-4 text-red-600 group-hover:text-white" /> : <CheckCircle className="h-4 w-4 text-green-600 group-hover:text-white" />}
                          </Button>
                          <Button
                            size="sm"
                            className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-yellow-400 hover:text-white transition-colors"
                            onClick={() => alert(`Reset password for ${s.name}`)}
                          >
                            🔑
                          </Button>
                          <Button
                            size="sm"
                            className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-purple-600 hover:text-white transition-colors"
                            onClick={() => alert(`Promote/Demote ${s.name}`)}
                          >
                            ⬆️
                          </Button>
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

export default BranchManagerStaff;
