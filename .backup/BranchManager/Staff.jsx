import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";
import { userService } from "../../services/userService";
import { serviceService } from "../../services/serviceService";
import { branchService } from "../../services/branchService";
import { auth } from "../../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  Home, 
  Calendar, 
  Package, 
  BarChart3,
  Receipt,
  Settings
} from "lucide-react";

const BranchManagerStaff = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allServicesMap, setAllServicesMap] = useState({});
  const [branchName, setBranchName] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [newStaff, setNewStaff] = useState({ firstName: '', middleName: '', lastName: '', email: '', phone: '', address: '', certificates: [] });
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Load staff data and services on component mount
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userData?.branchId) {
          throw new Error('Branch ID not found');
        }

        // Get all users assigned to this branch
        const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
        
        // Filter to show all stylists in this branch (active, inactive, and pending)
        const stylists = users.filter(user => 
          user.roles?.includes('stylist') && 
          user.branchId === userData.branchId
        );
        
        setStaffData(stylists);

        // Load all services for name lookup
        const services = await serviceService.getAllServices();
        const servicesMap = {};
        services.forEach(service => {
          servicesMap[service.id] = service.name;
        });
        setAllServicesMap(servicesMap);

        // Load branch data for branch name
        if (userData.branchId) {
          try {
            const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
            setBranchName(branch.name || userData.branchId);
          } catch (err) {
            console.error('Error loading branch data:', err);
            setBranchName(userData.branchId);
          }
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
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

  // === Filter State ===
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // === Advanced Filter State ===
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateRangeFilter, setDateRangeFilter] = useState("all"); // all, today, week, month, year
  const [searchFields, setSearchFields] = useState(["name", "email"]); // name, email, phone, address
  const [serviceCountFilter, setServiceCountFilter] = useState("all"); // all, with-services, without-services

  const roles = useMemo(() => ["All", "stylist"], [staffData]);
  const branches = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.branchId)))], [staffData]);

  // === Filtered & Sorted Staff ===
  const filteredStaff = useMemo(() => {
    let filtered = staffData.filter(s => {
      // Basic text search with multiple fields
      const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const phone = (s.phone || '').toLowerCase();
      const address = (s.address || '').toLowerCase();
      const searchQuery = query.toLowerCase();
      
      const matchesQuery = query === "" || (
        (searchFields.includes("name") && fullName.includes(searchQuery)) ||
        (searchFields.includes("email") && s.email?.toLowerCase().includes(searchQuery)) ||
        (searchFields.includes("phone") && phone.includes(searchQuery)) ||
        (searchFields.includes("address") && address.includes(searchQuery))
      );
      
      const matchesRole = roleFilter === "All" || roleFilter === "stylist";
      const matchesBranch = branchFilter === "All" || s.branchId === branchFilter;
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);
      
      // Date range filter
      const now = new Date();
      let matchesDateRange = true;
      if (dateRangeFilter !== "all" && s.createdAt) {
        const createdDate = new Date(s.createdAt.seconds * 1000);
        const diffTime = now - createdDate;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        switch (dateRangeFilter) {
          case "today":
            matchesDateRange = diffDays < 1;
            break;
          case "week":
            matchesDateRange = diffDays < 7;
            break;
          case "month":
            matchesDateRange = diffDays < 30;
            break;
          case "year":
            matchesDateRange = diffDays < 365;
            break;
          default:
            matchesDateRange = true;
        }
      }
      
      // Service count filter
      const serviceCount = s.service_id?.length || 0;
      const matchesServiceFilter = serviceCountFilter === "all" ||
        (serviceCountFilter === "with-services" && serviceCount > 0) ||
        (serviceCountFilter === "without-services" && serviceCount === 0);
      
      return matchesQuery && matchesRole && matchesBranch && matchesStatus && matchesDateRange && matchesServiceFilter;
    });
    
    // Sorting
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case "name":
          aVal = `${a.firstName || ''} ${a.middleName || ''} ${a.lastName || ''}`.toLowerCase();
          bVal = `${b.firstName || ''} ${b.middleName || ''} ${b.lastName || ''}`.toLowerCase();
          break;
        case "email":
          aVal = (a.email || '').toLowerCase();
          bVal = (b.email || '').toLowerCase();
          break;
        case "joined":
          aVal = a.createdAt?.seconds || 0;
          bVal = b.createdAt?.seconds || 0;
          break;
        case "services":
          aVal = a.service_id?.length || 0;
          bVal = b.service_id?.length || 0;
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [staffData, query, roleFilter, branchFilter, statusFilter, sortBy, sortOrder, dateRangeFilter, searchFields, serviceCountFilter]);

  // === Summary ===
  const totalStaff = staffData.length;
  const activeStaff = staffData.filter(s => s.isActive).length;
  const inactiveStaff = staffData.filter(s => !s.isActive).length;

  const roleCounts = useMemo(() => {
    const counts = {};
    staffData.forEach(s => {
      counts['stylist'] = (counts['stylist'] || 0) + 1;
    });
    return counts;
  }, [staffData]);

  // === Actions ===
  const exportCSV = (rows = filteredStaff, filename = "staff.csv") => {
    if (!rows.length) { alert("No data to export."); return; }
    const header = ["Name", "Role", "Status", "Email", "Phone", "Address"];
    const csv = [
      header.join(","),
      ...rows.map(r => [
        `${r.firstName} ${r.middleName} ${r.lastName}`.trim(),
        'stylist',
        r.isActive ? "Active" : "Inactive",
        r.email || '',
        r.phone || '',
        r.address || ''
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow pop-ups for this site to print.');
      return;
    }

    // Helper function to get service names from IDs
    const getServiceNames = (serviceIds) => {
      if (!serviceIds || serviceIds.length === 0) return 'No services assigned';
      return serviceIds.map(serviceId => allServicesMap[serviceId] || serviceId).join(', ');
    };

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Staff Report</title>
          <style>
            @page {
              margin: 1.5cm;
            }
            
            body {
              background: white;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            
                         /* Header */
             .print-header {
               text-align: center;
               border-bottom: 2px solid #000;
               padding-bottom: 12px;
               margin-bottom: 16px;
             }
             
             .print-header h1 {
               font-size: 16px;
               font-weight: bold;
               color: #000;
               margin: 4px 0;
             }
             
             .print-header .branch-name {
               font-size: 14px;
               color: #000;
               font-weight: 600;
               margin: 4px 0;
             }
             
             .print-header .report-type {
               font-size: 12px;
               color: #000;
               margin: 4px 0;
             }
             
                           .print-header p {
                font-size: 10px;
                color: #666;
                margin: 4px 0 0 0;
              }
              
              .print-header .generated-by {
                font-size: 10px;
                color: #666;
                margin: 2px 0;
              }
            
            /* Staff Grid - Compact Layout */
            .print-staff-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px;
            }
            
            .print-staff-card {
              border: 1px solid #ddd;
              padding: 8px;
              page-break-inside: avoid;
            }
            
            .staff-name {
              font-size: 12px;
              font-weight: bold;
              color: #000;
              margin-bottom: 4px;
              border-bottom: 1px solid #ccc;
              padding-bottom: 3px;
            }
            
            .staff-info {
              font-size: 10px;
              color: #333;
              line-height: 1.3;
              margin-bottom: 3px;
            }
            
            .staff-info strong {
              color: #000;
            }
            
            .services-section {
              margin-top: 6px;
              border-top: 1px solid #999;
              padding-top: 4px;
            }
            
            .services-title {
              font-size: 10px;
              font-weight: bold;
              color: #000;
              margin-bottom: 3px;
            }
            
            .services-list {
              font-size: 9px;
              color: #555;
              margin-left: 10px;
              line-height: 1.2;
            }
            
            .no-services {
              color: #999;
              font-style: italic;
            }
            
            /* Footer */
            .print-footer {
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid #ddd;
              font-size: 9px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
                                                      <div class="print-container">
             <div class="print-header">
               <img src="/logo.png" alt="David's Salon Logo" style="height: 40px; margin-bottom: 8px;" />
               <div class="branch-name">${branchName || userData?.branchId || 'All Branches'}</div>
               <div class="report-type">Staff Report</div>
               <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | Total Records: ${filteredStaff.length}</p>
               <div class="generated-by">Generated by: ${userData?.firstName || ''} ${userData?.lastName || ''} (${userData?.roles?.[0] || 'User'})</div>
             </div>
             
             <div class="print-staff-grid">
               ${filteredStaff.map(s => {
                 // Get service names from IDs
                 const serviceNames = getServiceNames(s.service_id);
                 
                 return `
                   <div class="print-staff-card">
                     <div class="staff-name">
                       ${s.firstName} ${s.middleName} ${s.lastName}
                     </div>
                     
                     <div class="staff-info">
                       <strong>Role:</strong> Stylist
                     </div>
                     <div class="staff-info">
                       <strong>Status:</strong> ${s.isActive ? 'Active' : 'Inactive'}
                     </div>
                     <div class="staff-info">
                       <strong>Email:</strong> ${s.email || 'N/A'}
                     </div>
                     ${s.phone ? `<div class="staff-info">
                       <strong>Phone:</strong> ${s.phone}
                     </div>` : ''}
                     <div class="staff-info">
                       <strong>Joined:</strong> ${s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : 'Unknown'}
                     </div>
                     
                     <div class="services-section">
                       <div class="services-title">Services Offered</div>
                       ${s.service_id && s.service_id.length > 0 ? `
                         <div class="services-list">
                           ${serviceNames}
                           <br />
                           Total: ${s.service_id.length} ${s.service_id.length === 1 ? 'service' : 'services'}
                         </div>
                       ` : `
                         <div class="services-list no-services">
                           No services assigned
                         </div>
                       `}
                     </div>
                   </div>
                 `;
               }).join('')}
             </div>
            
            <div class="print-footer">
              <p>Computer-generated report. Information current as of date printed.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 250);
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
    <>
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

        {/* === Advanced Filter Modal === */}
        {isFilterOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Advanced Filters</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                    className="p-1"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="All">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                    <select
                      value={dateRangeFilter}
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                      <option value="year">Last Year</option>
                    </select>
                  </div>

                  {/* Service Count Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
                    <select
                      value={serviceCountFilter}
                      onChange={(e) => setServiceCountFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All Staff</option>
                      <option value="with-services">With Services</option>
                      <option value="without-services">Without Services</option>
                    </select>
                  </div>

                  {/* Search Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search In</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["name", "email", "phone", "address"].map(field => (
                        <label key={field} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={searchFields.includes(field)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSearchFields([...searchFields, field]);
                              } else {
                                setSearchFields(searchFields.filter(f => f !== field));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm capitalize">{field}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="joined">Joined Date</option>
                        <option value="services">Service Count</option>
                      </select>
                      <Button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="px-4 border"
                      >
                        {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter("All");
                      setDateRangeFilter("all");
                      setServiceCountFilter("all");
                      setSortBy("name");
                      setSortOrder("asc");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

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
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
            >
              + Add Staff
            </Button>
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
              onClick={handlePrint}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
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
                    <tr key={s.uid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {s.firstName} {s.middleName} {s.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">stylist</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {s.service_id?.length || 0} {s.service_id?.length === 1 ? 'service' : 'services'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.isPendingActivation ? "bg-yellow-100 text-yellow-800" : 
                          s.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {s.isPendingActivation ? "Pending Activation" : s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.createdAt ? new Date(s.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            className="flex items-center justify-center p-2 bg-white border border-gray-300 hover:bg-[#160B53] hover:text-white transition-colors"
                            onClick={() => navigate(`/staff/details`, { state: { staffId: s.id } })}
                            title={s.isPendingActivation ? "View details (pending activation)" : "View details"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!s.isPendingActivation && (
                            <Button
                              size="sm"
                              className={`flex items-center justify-center p-2 border transition-colors ${
                                s.isActive 
                                  ? 'bg-white border-red-300 text-red-600 hover:bg-red-50' 
                                  : 'bg-white border-green-300 text-green-600 hover:bg-green-50'
                              }`}
                              onClick={async () => {
                                try {
                                  const newStatus = !s.isActive;
                                  await userService.updateUser(s.id, { isActive: newStatus }, userData?.roles?.[0]);
                                  
                                  // Refresh staff list
                                  const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
                                  const stylists = users.filter(user => 
                                    user.roles?.includes('stylist') && 
                                    user.branchId === userData.branchId
                                  );
                                  setStaffData(stylists);
                                } catch (e) {
                                  console.error('Failed to update status:', e);
                                }
                              }}
                              title={s.isActive ? "Deactivate staff" : "Activate staff"}
                            >
                              {s.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
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

        {/* === Add Staff Modal === */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Add Staff {addStep === 2 ? '— Summary' : ''}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setIsAddOpen(false); setAddStep(1); }}
                    className="p-1"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {addError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-semibold text-red-800 mb-1">Error Creating Staff:</p>
                    <p className="text-sm text-red-700 whitespace-pre-wrap">{addError}</p>
                  </div>
                )}

                {addStep === 1 ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      value={newStaff.firstName}
                      onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input
                      value={newStaff.middleName}
                      onChange={(e) => setNewStaff({ ...newStaff, middleName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      value={newStaff.lastName}
                      onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address (optional)</label>
                    <input
                      value={newStaff.address}
                      onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                {/* Certificates section */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-800">Certificates (optional)</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input placeholder="Name" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" />
                    <input placeholder="Issuer" value={newCert.issuer} onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" />
                    <input type="date" placeholder="Date" value={newCert.date} onChange={(e) => setNewCert({ ...newCert, date: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button onClick={() => {
                      if (!newCert.name) return;
                      const id = Math.random().toString(36).slice(2, 10);
                      setNewStaff({ ...newStaff, certificates: [...(newStaff.certificates || []), { id, ...newCert }] });
                      setNewCert({ name: '', issuer: '', date: '' });
                    }} className="bg-white border text-gray-700">Add Certificate</Button>
                  </div>
                  {newStaff.certificates?.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {newStaff.certificates.map(c => (
                        <li key={c.id} className="text-sm flex items-center justify-between p-2 border rounded">
                          <span>{c.name} {c.issuer ? `• ${c.issuer}` : ''} {c.date ? `• ${c.date}` : ''}</span>
                          <Button variant="outline" size="sm" onClick={() => setNewStaff({ ...newStaff, certificates: newStaff.certificates.filter(x => x.id !== c.id) })}>Remove</Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => { setIsAddOpen(false); setAddStep(1); }}>Cancel</Button>
                  <Button onClick={() => {
                    setAddError('');
                    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
                      setAddError('First name, last name, and email are required');
                      return;
                    }
                    setAddStep(2);
                  }} className="bg-[#160B53] text-white">Next</Button>
                </div>
                </>
                ) : (
                <>
                  {addStep === 2 && (
                    <>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded border">
                          <h4 className="font-semibold mb-2">Profile</h4>
                          <p className="text-sm text-gray-700">Name: {newStaff.firstName} {newStaff.middleName} {newStaff.lastName}</p>
                          <p className="text-sm text-gray-700">Email: {newStaff.email}</p>
                          <p className="text-sm text-gray-700">Phone: {newStaff.phone || '—'}</p>
                          <p className="text-sm text-gray-700">Address: {newStaff.address || '—'}</p>
                          <p className="text-sm text-gray-700">Role: Stylist</p>
                          <p className="text-sm text-gray-700">Branch: {branchName || userData?.branchId}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded border">
                          <h4 className="font-semibold mb-2">Certificates</h4>
                          {newStaff.certificates?.length ? (
                            <ul className="text-sm list-disc pl-5">
                              {newStaff.certificates.map(c => (
                                <li key={c.id}>{c.name} {c.issuer ? `• ${c.issuer}` : ''} {c.date ? `• ${c.date}` : ''}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500">None</p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 mt-6">
                        <Button onClick={() => setAddStep(1)} className="border bg-white text-gray-700">Back</Button>
                        <Button onClick={async () => {
                          try {
                            setAdding(true);
                            setAddError('');
                            
                            // Generate a strong temporary password
                            const tempPassword = Math.random().toString(36).slice(2, 10) + 
                                               Math.random().toString(36).slice(2, 10).toUpperCase() + 
                                               '!@#$'[Math.floor(Math.random() * 4)] + 
                                               Math.floor(Math.random() * 10);
                            
                            const displayName = `${newStaff.firstName} ${newStaff.middleName ? newStaff.middleName + ' ' : ''}${newStaff.lastName}`.trim();
                            
                            // Create pre-registered user in Firestore (Free tier compatible)
                            await userService.createPreRegisteredUser({
                              email: newStaff.email,
                              tempPassword: tempPassword,
                              displayName,
                              role: 'stylist',
                              branchId: userData?.branchId || '',
                              phone: newStaff.phone || '',
                              firstName: newStaff.firstName,
                              middleName: newStaff.middleName,
                              lastName: newStaff.lastName,
                              address: newStaff.address,
                              certificates: newStaff.certificates
                            }, userData?.roles?.[0]);
                            
                            const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0]);
                            const stylists = users.filter(user => user.roles?.includes('stylist') && user.branchId === userData.branchId);
                            setStaffData(stylists);
                            setGeneratedPassword(tempPassword);
                            setAddStep(3);
                          } catch (e) {
                            console.error('Failed to add staff:', e);
                            const errorMsg = e.message || e.toString() || 'Failed to add staff';
                            setAddError(errorMsg);
                          } finally {
                            setAdding(false);
                          }
                        }} className="bg-[#160B53] text-white" disabled={adding}>{adding ? 'Creating...' : 'Confirm & Create'}</Button>
                      </div>
                    </>
                  )}
                  {addStep === 3 && (
                    <>
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded">
                          <h4 className="font-semibold text-green-800 mb-2">Staff Account Created Successfully</h4>
                          <p className="text-sm text-green-900 mb-3">Share these credentials with the new staff member:</p>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-semibold text-green-800">Email:</label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="px-3 py-2 bg-white border rounded text-sm select-all flex-1">{newStaff.email}</code>
                                <Button
                                  size="sm"
                                  className="border bg-white text-gray-700"
                                  onClick={() => navigator.clipboard?.writeText(newStaff.email)}
                                >Copy</Button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs font-semibold text-green-800">Temporary Password:</label>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="px-3 py-2 bg-white border rounded text-sm select-all flex-1">{generatedPassword}</code>
                                <Button
                                  size="sm"
                                  className="border bg-white text-gray-700"
                                  onClick={() => navigator.clipboard?.writeText(generatedPassword)}
                                >Copy</Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-900">
                              <strong>Instructions for new staff:</strong><br/>
                              1. Go to the registration page<br/>
                              2. Use the email and temporary password above<br/>
                              3. Complete the registration to activate the account<br/>
                              4. Change password after first login
                            </p>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-700">Email: {newStaff.email}</p>
                          <p className="text-sm text-gray-700">Name: {newStaff.firstName} {newStaff.middleName} {newStaff.lastName}</p>
                          <p className="text-sm text-gray-700">Branch: {branchName || userData?.branchId}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                        <Button onClick={() => {
                          setIsAddOpen(false);
                          setAddStep(1);
                          setNewStaff({ firstName: '', middleName: '', lastName: '', email: '', phone: '', address: '', certificates: [] });
                          setGeneratedPassword('');
                        }} className="bg-[#160B53] text-white">Done</Button>
                      </div>
                    </>
                  )}
                </>
                )}
              </div>
            </Card>
          </div>
        )}

             </div>
     </DashboardLayout>
    </>
  );
};

export default BranchManagerStaff;
