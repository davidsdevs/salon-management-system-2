import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { appointmentApiService } from "../../services/appointmentApiService";
import { AppointmentModel } from "../../models/AppointmentModel";
import { userService } from "../../services/userService";
import { serviceService } from "../../services/serviceService";
import { branchService } from "../../services/branchService";
import { emailService } from "../../services/emailService";

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
  let userData, loading, error;
  
  try {
    const auth = useAuth();
    userData = auth.userData;
    loading = auth.loading;
    error = auth.error;
  } catch (err) {
    console.error('Auth context error:', err);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Context Error</h1>
          <p className="text-gray-600">Please refresh the page or contact support.</p>
        </div>
      </div>
    );
  }

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Show error if auth failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show message if no user data
  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No User Data</h1>
          <p className="text-gray-600">Please log in to access this page.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // === State Management ===
  const [appointmentsData, setAppointmentsData] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState(null);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [stylistsData, setStylistsData] = useState({});
  const [servicesData, setServicesData] = useState({});
  const [usersData, setUsersData] = useState({});
  const [branchData, setBranchData] = useState(null);

  // === Load Appointments ===
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError(null);
        
        // Get appointments for the current branch manager's branch
        const branchId = userData?.branchId;
        if (!branchId) {
          throw new Error('Branch ID not found for user');
        }

        const result = await appointmentApiService.getAppointments({
          branchId: branchId
        }, userData.roles && userData.roles.length > 0 ? userData.roles[0] : 'branchManager', userData.uid);

        if (result.appointments && result.appointments.length > 0) {
          setAppointmentsData(result.appointments);
          
          // Get unique stylist IDs from appointments
          const stylistIds = [...new Set(result.appointments.flatMap(apt => {
            // Get stylist IDs from serviceStylistPairs if available
            if (apt.serviceStylistPairs && Array.isArray(apt.serviceStylistPairs)) {
              return apt.serviceStylistPairs.map(pair => pair.stylistId).filter(Boolean);
            }
            // Fallback to old stylistId field
            return apt.stylistId ? [apt.stylistId] : [];
          }).flat())];
          
          // Get unique service IDs from appointments
          const serviceIds = [...new Set(result.appointments.flatMap(apt => {
            // Get service IDs from serviceStylistPairs if available
            if (apt.serviceStylistPairs && Array.isArray(apt.serviceStylistPairs)) {
              return apt.serviceStylistPairs.map(pair => pair.serviceId).filter(Boolean);
            }
            // Fallback to old serviceIds field
            return apt.serviceIds ? apt.serviceIds : [];
          }).flat())];

          // Get unique user IDs from appointment history
          const userIds = [...new Set(result.appointments.flatMap(apt => {
            const ids = [];
            if (apt.createdBy) ids.push(apt.createdBy);
            if (apt.history && Array.isArray(apt.history)) {
              apt.history.forEach(entry => {
                if (entry.by) ids.push(entry.by);
              });
            }
            return ids.filter(Boolean);
          }).flat())];


          // Fetch stylist, service, and user information
          if (stylistIds.length > 0 || serviceIds.length > 0 || userIds.length > 0) {
            try {
              const stylistsInfo = {};
              const servicesInfo = {};
              const usersInfo = {};

              // Fetch stylist information
              for (const stylistId of stylistIds) {
                try {
                  const stylistData = await userService.getUserById(stylistId);
                  if (stylistData) {
                    // Use the actual user data structure
                    const fullName = `${stylistData.firstName || ''} ${stylistData.lastName || ''}`.trim();
                    const displayName = fullName || stylistData.email || `Stylist ${stylistId.slice(-4)}`;
                    const primaryRole = stylistData.roles && stylistData.roles.length > 0 ? stylistData.roles[0] : 'stylist';
                    
                    stylistsInfo[stylistId] = {
                      name: displayName,
                      role: primaryRole,
                      firstName: stylistData.firstName,
                      lastName: stylistData.lastName,
                      email: stylistData.email,
                      phone: stylistData.phone,
                      isActive: stylistData.isActive,
                      serviceIds: stylistData.service_id || []
                    };
                  }
                } catch (err) {
                  console.warn(`Could not fetch stylist ${stylistId}:`, err);
                  stylistsInfo[stylistId] = {
                    name: `Stylist ${stylistId.slice(-4)}`,
                    role: 'stylist',
                    isActive: false
                  };
                }
              }

              // Fetch service information
              for (const serviceId of serviceIds) {
                try {
                  const serviceData = await serviceService.getServiceById(serviceId);
                  if (serviceData) {
                    servicesInfo[serviceId] = {
                      id: serviceData.id,
                      name: serviceData.name,
                      description: serviceData.description,
                      price: serviceData.prices && serviceData.prices.length > 0 ? serviceData.prices[0] : 0,
                      duration: serviceData.duration,
                      isActive: serviceData.isActive
                    };
                  }
                } catch (err) {
                  console.warn(`Could not fetch service ${serviceId}:`, err);
                  servicesInfo[serviceId] = {
                    id: serviceId,
                    name: serviceId.replace('service_', '').replace('_', ' ').toUpperCase(),
                    price: 0,
                    isActive: false
                  };
                }
              }

              // Fetch user information for history
              for (const userId of userIds) {
                try {
                  const userData = await userService.getUserById(userId);
                  if (userData) {
                    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    const displayName = fullName || userData.email || `User ${userId.slice(-4)}`;
                    
                    usersInfo[userId] = {
                      name: displayName,
                      firstName: userData.firstName,
                      lastName: userData.lastName,
                      email: userData.email,
                      phone: userData.phone,
                      isActive: userData.isActive,
                      roles: userData.roles || []
                    };
                  }
                } catch (err) {
                  console.warn(`Could not fetch user ${userId}:`, err);
                  usersInfo[userId] = {
                    name: `User ${userId.slice(-4)}`,
                    isActive: false
                  };
                }
              }

              setStylistsData(stylistsInfo);
              setServicesData(servicesInfo);
              setUsersData(usersInfo);
            } catch (err) {
              console.warn('Error fetching stylists and services:', err);
            }
          }

          // Fetch branch information
          if (branchId) {
            try {
              const branch = await branchService.getBranch(branchId, userData.roles && userData.roles.length > 0 ? userData.roles[0] : 'branchManager', userData.uid);
              if (branch) {
                setBranchData(branch);
              }
            } catch (err) {
              console.warn('Error fetching branch:', err);
            }
          }
        } else {
          // No appointments found in database
          setAppointmentsData([]);
          setStylistsData({});
          setServicesData({});
          setUsersData({});
        }
      } catch (err) {
        console.error('Error loading appointments:', err);
        setAppointmentsError(err.message);
        setAppointmentsData([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    if (userData?.branchId) {
      loadAppointments();
    }
  }, [userData?.branchId]);

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
  const [serviceFilter, setServiceFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Clear all filters (reset to today's date)
  const clearAllFilters = () => {
    setQuery("");
    setStatusFilter("All");
    setStylistFilter("All");
    setServiceFilter("All");
    setDateFrom(new Date().toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
  };

  const stylists = useMemo(() => {
    const uniqueStylists = [...new Set(appointmentsData.flatMap(a => {
      // Get stylist IDs from serviceStylistPairs if available
      if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
        return a.serviceStylistPairs.map(pair => pair.stylistId).filter(Boolean);
      }
      // Fallback to old stylistId field
      return a.stylistId ? [a.stylistId] : [];
    }))];
    return ["All", ...uniqueStylists];
  }, [appointmentsData]);

  const services = useMemo(() => {
    const uniqueServices = [...new Set(appointmentsData.flatMap(a => {
      // Get service IDs from serviceStylistPairs if available
      if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
        return a.serviceStylistPairs.map(pair => pair.serviceId).filter(Boolean);
      }
      // Fallback to old serviceIds field
      return a.serviceIds ? a.serviceIds : [];
    }))];
    return ["All", ...uniqueServices];
  }, [appointmentsData]);

  // === Filtered Appointments ===
  const filteredAppointments = useMemo(() => {
    return appointmentsData.filter(a => {
      const clientName = a.clientInfo?.name || a.clientName || 'Unknown';
      
      // Search query matching
      const matchesQuery = query === "" || 
        clientName.toLowerCase().includes(query.toLowerCase()) || 
        a.notes?.toLowerCase().includes(query.toLowerCase());
      
      // Status filter matching
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      
      // Stylist filter matching - check serviceStylistPairs
      let matchesStylist = stylistFilter === "All";
      if (stylistFilter !== "All") {
        if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
          matchesStylist = a.serviceStylistPairs.some(pair => pair.stylistId === stylistFilter);
        } else if (a.stylistId) {
          matchesStylist = a.stylistId === stylistFilter;
        }
      }
      
      // Service filter matching - check serviceStylistPairs
      let matchesService = serviceFilter === "All";
      if (serviceFilter !== "All") {
        if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
          matchesService = a.serviceStylistPairs.some(pair => pair.serviceId === serviceFilter);
        } else if (a.serviceIds && Array.isArray(a.serviceIds)) {
          matchesService = a.serviceIds.includes(serviceFilter);
        }
      }
      
      // Date range filtering
      const apptDate = new Date(a.appointmentDate);
      const fromOk = !dateFrom || apptDate >= new Date(dateFrom);
      const toOk = !dateTo || apptDate <= new Date(dateTo);
      
      return matchesQuery && matchesStatus && matchesStylist && matchesService && fromOk && toOk;
    });
  }, [appointmentsData, query, statusFilter, stylistFilter, serviceFilter, dateFrom, dateTo]);

  // === Service Helper Functions ===
  const getServicePrice = (serviceId) => {
    // Use fetched service data first
    if (servicesData[serviceId]) {
      return servicesData[serviceId].price || 0;
    }
    
    // Fallback to hardcoded prices
    const servicePrices = {
      'service_beard': 200,
      'service_facial': 500,
      'service_haircut': 300,
      'service_color': 800,
      'service_massage': 400,
      'service_nails': 250
    };
    return servicePrices[serviceId] || 0;
  };

  const getServiceName = (serviceId) => {
    // Use fetched service data first
    if (servicesData[serviceId]) {
      return servicesData[serviceId].name || serviceId.replace('service_', '').replace('_', ' ').toUpperCase();
    }
    
    // Fallback to hardcoded names
    const serviceNames = {
      'service_beard': 'Beard Treatment',
      'service_facial': 'Facial Treatment',
      'service_haircut': 'Haircut',
      'service_color': 'Hair Color',
      'service_massage': 'Massage',
      'service_nails': 'Nail Service'
    };
    return serviceNames[serviceId] || serviceId.replace('service_', '').replace('_', ' ').toUpperCase();
  };

  // === Summary (Based on Filtered Data) ===
  const totalAppointments = filteredAppointments.length;
  const completed = filteredAppointments.filter(a => a.status === "completed").length;
  const cancelled = filteredAppointments.filter(a => a.status === "cancelled").length;
  const totalRevenue = filteredAppointments.reduce((s, a) => {
    // Don't count cancelled appointments in revenue
    if (a.status === 'cancelled') return s;
    
    let revenue = 0;
    // Handle new serviceStylistPairs structure
    if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
      revenue = a.serviceStylistPairs.reduce((sum, pair) => {
        return sum + getServicePrice(pair.serviceId);
      }, 0);
    }
    // Fallback to old serviceIds structure for backward compatibility
    else if (a.serviceIds && Array.isArray(a.serviceIds)) {
      revenue = a.serviceIds.reduce((sum, serviceId) => {
        return sum + getServicePrice(serviceId);
      }, 0);
    }
    return s + revenue;
  }, 0);

  // === Stylist Helper Functions ===
  const getStylistName = (stylistId) => {
    if (!stylistId) return 'Unassigned';
    return stylistsData[stylistId]?.name || `Stylist ${stylistId.slice(-4)}`;
  };

  const getStylistDisplay = (appointment) => {
    // Handle new serviceStylistPairs structure
    if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
      // Get the first stylist from serviceStylistPairs for display purposes
      const firstStylistId = appointment.serviceStylistPairs[0].stylistId;
      const stylistData = stylistsData[firstStylistId];
      
      if (!stylistData) {
        return {
          name: `Stylist ${firstStylistId.slice(-4)}`,
          role: 'stylist',
          id: firstStylistId,
          isActive: false
        };
      }
      
      return {
        name: stylistData.name,
        role: stylistData.role,
        id: firstStylistId,
        firstName: stylistData.firstName,
        lastName: stylistData.lastName,
        email: stylistData.email,
        phone: stylistData.phone,
        isActive: stylistData.isActive,
        serviceIds: stylistData.serviceIds || []
      };
    }
    
    // Fallback to old stylistId field
    if (!appointment.stylistId) return 'Unassigned';
    
    const stylistData = stylistsData[appointment.stylistId];
    if (!stylistData) {
      return {
        name: `Stylist ${appointment.stylistId.slice(-4)}`,
        role: 'stylist',
        id: appointment.stylistId,
        isActive: false
      };
    }
    
    return {
      name: stylistData.name,
      role: stylistData.role,
      id: appointment.stylistId,
      firstName: stylistData.firstName,
      lastName: stylistData.lastName,
      email: stylistData.email,
      phone: stylistData.phone,
      isActive: stylistData.isActive,
      serviceIds: stylistData.serviceIds || []
    };
  };

  const getMultipleStylistsDisplay = (stylistIds) => {
    if (!stylistIds || stylistIds.length === 0) return 'Unassigned';
    if (stylistIds.length === 1) return getStylistName(stylistIds[0]);
    
    const names = stylistIds.map(id => getStylistName(id));
    if (names.length <= 2) {
      return names.join(', ');
    } else {
      return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    }
  };

  // === Chart Data ===
  const appointmentTrendData = useMemo(() => {
    // Group filtered appointments by date for trend chart
    const dateGroups = {};
    filteredAppointments.forEach(appointment => {
      const date = appointment.appointmentDate;
      if (!dateGroups[date]) {
        dateGroups[date] = {
          date: date,
          appointments: 0
        };
      }
      dateGroups[date].appointments += 1;
    });
    
    // Convert to array and sort by date
    return Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredAppointments]);

  // === Stylist Performance (Based on Filtered Data) ===
  const stylistPerformance = useMemo(() => {
    const performance = {};
    
    filteredAppointments.forEach(appointment => {
      // Handle new serviceStylistPairs structure
      if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
        appointment.serviceStylistPairs.forEach(pair => {
          const stylistId = pair.stylistId;
          if (!stylistId) return;
          
          const stylistName = getStylistName(stylistId);
          
          if (!performance[stylistName]) {
            performance[stylistName] = {
              stylist: stylistName,
              appointments: 0
            };
          }
          
          performance[stylistName].appointments += 1;
        });
      } else if (appointment.stylistId) {
        // Fallback to old stylistId field
        const stylistId = appointment.stylistId;
        const stylistName = getStylistName(stylistId);
        
        if (!performance[stylistName]) {
          performance[stylistName] = {
            stylist: stylistName,
            appointments: 0
          };
        }
        
        performance[stylistName].appointments += 1;
      }
    });
    
    return Object.values(performance);
  }, [filteredAppointments, stylistsData]);

  // === Actions ===
  const exportCSV = (rows = filteredAppointments, filename = "appointments.csv") => {
    if (!rows.length) { alert("No data to export."); return; }
    const header = ["Date", "Customer", "Service", "Stylist", "Status", "Revenue"];
    const csv = [header.join(","), ...rows.map(r => [r.date, `"${r.customer}"`, `"${r.service}"`, `"${r.staff}"`, r.status, r.revenue].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const printReport = () => {
    try {
      console.log('Print report clicked');
      console.log('Filtered appointments:', filteredAppointments);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
    
    // Get the table data
    console.log('Processing appointments for table data...');
    const tableData = filteredAppointments.map(appointment => {
      console.log('Processing appointment:', appointment);
      const clientName = appointment.clientInfo?.name || appointment.clientName || 'Unknown';
      
      // Calculate estimated revenue based on new serviceStylistPairs structure
      let estimatedRevenue = 0;
      let services = 'No services';
      
      if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
        estimatedRevenue = appointment.serviceStylistPairs.reduce((sum, pair) => sum + getServicePrice(pair.serviceId), 0);
        services = appointment.serviceStylistPairs.map(pair => getServiceName(pair.serviceId)).join(', ');
      } else if (appointment.serviceIds && appointment.serviceIds.length > 0) {
        estimatedRevenue = appointment.serviceIds.reduce((sum, serviceId) => sum + getServicePrice(serviceId), 0);
        services = appointment.serviceIds.map(id => getServiceName(id)).join(', ');
      }
      
      const stylistInfo = getStylistDisplay(appointment);
      
      const appointmentData = {
        client: clientName,
        date: new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        time: appointment.appointmentTime,
        services: services,
        status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
        revenue: `₱${estimatedRevenue.toLocaleString()}`
      };
      
      console.log('Generated appointment data:', appointmentData);
      return appointmentData;
    });
    
    console.log('Table data generated:', tableData);

    // Calculate total revenue for the report (excluding cancelled appointments)
    const totalRevenue = filteredAppointments.reduce((sum, apt) => {
      // Don't count cancelled appointments in revenue
      if (apt.status === 'cancelled') return sum;
      
      let revenue = 0;
      if (apt.serviceStylistPairs && Array.isArray(apt.serviceStylistPairs)) {
        revenue = apt.serviceStylistPairs.reduce((s, pair) => s + getServicePrice(pair.serviceId), 0);
      } else if (apt.serviceIds && Array.isArray(apt.serviceIds)) {
        revenue = apt.serviceIds.reduce((s, serviceId) => s + getServicePrice(serviceId), 0);
      }
      return sum + revenue;
    }, 0);

    // Create HTML content for printing
    console.log('Creating print content...');
    console.log('Table data length:', tableData.length);
    console.log('User data:', userData);
    
    // Simple test HTML first
    const testHTML = `
      <!DOCTYPE html>
      <html>
        <head><title>Test</title></head>
        <body>
          <h1>Test Print Report</h1>
          <p>This is a test to see if the print window works.</p>
          <p>Table data length: ${tableData.length}</p>
          <p>User data: ${JSON.stringify(userData)}</p>
        </body>
      </html>
    `;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Appointments Report - ${userData?.branchId || 'Branch'}</title>
          <style>
            @page {
              margin: 0.5in;
              size: A4;
            }
            body {
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .report-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #160B53;
            }
            .logo-section {
              margin-bottom: 20px;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 15px auto;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .report-title {
              font-size: 28px;
              font-weight: 700;
              color: #160B53;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-family: 'Poppins', sans-serif;
            }
            .report-subtitle {
              font-size: 18px;
              color: #666;
              margin-bottom: 20px;
              font-weight: 500;
              font-family: 'Poppins', sans-serif;
            }
            .report-info {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              color: #555;
              margin-bottom: 20px;
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
            }
            .report-info div {
              flex: 1;
              padding: 0 10px;
            }
            .report-info strong {
              color: #160B53;
              font-weight: 600;
            }
            .report-info .info-label {
              display: block;
              margin-bottom: 5px;
              font-weight: 600;
              color: #160B53;
              font-family: 'Poppins', sans-serif;
            }
            .report-info .info-value {
              display: block;
              margin-bottom: 8px;
              color: #333;
              font-family: 'Poppins', sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 11px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            th {
              background-color: #160B53;
              color: white;
              padding: 14px 10px;
              text-align: left;
              font-weight: 600;
              border: 1px solid #ddd;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-family: 'Poppins', sans-serif;
            }
            td {
              padding: 12px 10px;
              border: 1px solid #ddd;
              vertical-align: top;
              font-size: 11px;
              font-family: 'Poppins', sans-serif;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .status-badge {
              padding: 6px 12px;
              border-radius: 15px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-scheduled { background-color: #e3f2fd; color: #1976d2; border: 1px solid #bbdefb; }
            .status-confirmed { background-color: #f3e5f5; color: #7b1fa2; border: 1px solid #e1bee7; }
            .status-completed { background-color: #e8f5e8; color: #2e7d32; border: 1px solid #c8e6c9; }
            .status-cancelled { background-color: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
            .service-tag {
              display: inline-block;
              background-color: #160B53;
              color: white;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 9px;
              margin: 1px 2px 1px 0;
              font-weight: 500;
            }
            .revenue {
              font-weight: bold;
              color: #2e7d32;
              font-size: 12px;
              font-family: 'Poppins', sans-serif;
            }
            .client-name {
              font-weight: 600;
              color: #333;
            }
            .date-time {
              color: #555;
              font-size: 10px;
            }
            .report-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              text-align: center;
              font-size: 10px;
              color: #666;
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              font-family: 'Poppins', sans-serif;
            }
            .report-footer p {
              margin: 5px 0;
            }
            .summary-stats {
              display: flex;
              justify-content: space-around;
              margin: 20px 0;
              padding: 15px;
              background-color: #f0f0f0;
              border-radius: 8px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #160B53;
            }
            .stat-label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              font-family: 'Poppins', sans-serif;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .status-badge, .service-tag { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="logo-section">
              <div class="logo">
                <img src="/logo.png" alt="David's Salon" />
              </div>
            </div>
            <div class="report-title">Salon Appointments Report</div>
            <div class="report-subtitle">Branch Manager Dashboard</div>
          </div>
          
          <div class="report-info">
            <div>
              <span class="info-label">Branch Information</span>
              <span class="info-value"><strong>Branch:</strong> ${branchData?.name || 'Unknown Branch'}</span>
              <span class="info-value"><strong>Report Period:</strong> ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
            <div>
              <span class="info-label">Generated By</span>
              <span class="info-value"><strong>Name:</strong> ${userData?.firstName || 'Unknown'} ${userData?.lastName || 'User'}</span>
              <span class="info-value"><strong>Email:</strong> ${userData?.email || 'N/A'}</span>
              <span class="info-value"><strong>Role:</strong> Branch Manager</span>
            </div>
            <div>
              <span class="info-label">Report Details</span>
              <span class="info-value"><strong>Generated On:</strong> ${new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}</span>
              <span class="info-value"><strong>Status Filter:</strong> All Statuses</span>
              <span class="info-value"><strong>Total Records:</strong> ${filteredAppointments.length}</span>
            </div>
          </div>

          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-number">${filteredAppointments.length}</div>
              <div class="stat-label">Total Appointments</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">₱${totalRevenue.toLocaleString()}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${filteredAppointments.filter(apt => apt.status === 'scheduled').length}</div>
              <div class="stat-label">Scheduled</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">${filteredAppointments.filter(apt => apt.status === 'completed').length}</div>
              <div class="stat-label">Completed</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Client</th>
                <th style="width: 15%;">Date & Time</th>
                <th style="width: 30%;">Services</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 15%;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => `
                <tr>
                  <td>
                    <div class="client-name">${row.client}</div>
                  </td>
                  <td>
                    <div class="date-time">${row.date}</div>
                    <div class="date-time">${row.time}</div>
                  </td>
                  <td>
                    <div style="line-height: 1.3;">${row.services.split(', ').map(service => 
                      `<span class="service-tag">${service}</span>`
                    ).join('')}</div>
                  </td>
                  <td>
                    <span class="status-badge status-${row.status.toLowerCase()}">${row.status}</span>
                  </td>
                  <td class="revenue">${row.revenue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="report-footer">
            <p><strong>Salon Management System - Professional Report</strong></p>
            <p>This report was generated automatically by the Salon Management System</p>
            <p>For questions or support, please contact your system administrator</p>
            <p>Report generated on ${new Date().toLocaleString()} | Page 1 of 1</p>
          </div>
        </body>
      </html>
    `;

    // Write content to new window and print
    console.log('Writing content to print window');
    console.log('Print content length:', printContent.length);
    console.log('Print content preview:', printContent.substring(0, 500));
    
    // Write the full print content
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      console.log('About to print');
      printWindow.print();
      printWindow.close();
    }, 250);
    } catch (error) {
      console.error('Error in printReport:', error);
      alert('Error in print function: ' + error.message);
    }
  };

  const generateStylistReportCSV = (stylist) => {
    const rows = filteredAppointments.filter(r => r.stylistId === stylist);
    if (!rows.length) { alert(`No appointments for ${stylist}`); return; }
    exportCSV(rows, `${stylist.replace(/\s+/g, "_")}_appointments.csv`);
  };

  // === Appointment Actions ===
  const handleShowConfirmModal = (appointment) => {
    setAppointmentToConfirm(appointment);
    setShowConfirmModal(true);
  };

  const handleConfirmAppointmentModal = async () => {
    if (!appointmentToConfirm) return;
    
    try {
      await handleConfirmAppointment(appointmentToConfirm.id);
      setShowConfirmModal(false);
      setAppointmentToConfirm(null);
    } catch (error) {
      console.error('Error in confirmation modal:', error);
    }
  };

  const handleViewAppointment = async (appointment) => {
    try {
      console.log('Opening modal for appointment:', appointment);
      console.log('ServiceStylistPairs:', appointment.serviceStylistPairs);
      console.log('ServiceStylistPairs length:', appointment.serviceStylistPairs?.length);
      console.log('StylistsData:', stylistsData);
      console.log('ServicesData:', servicesData);
      
      // Set the appointment and show modal
      setSelectedAppointment(appointment);
      setShowDetailsModal(true);
      
      console.log('Modal should be showing now');
    } catch (error) {
      console.error('Error viewing appointment:', error);
      alert('Error loading appointment details: ' + error.message);
    }
  };

  const handleConfirmAppointment = async (appointmentId) => {
    try {
      // Find the appointment to get its details for email
      const appointment = appointmentsData.find(apt => apt.id === appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Confirm the appointment (simple status update)
      await appointmentApiService.confirmAppointment(appointmentId, 'Confirmed by branch manager');
      
      // Prepare client data for email using the actual appointment structure
      const clientData = {
        email: appointment.clientEmail || appointment.clientInfo?.email,
        name: appointment.clientName || appointment.clientInfo?.name,
        phone: appointment.clientPhone || appointment.clientInfo?.phone
      };

      // Send confirmation emails to stylists and client
      console.log('Sending confirmation emails...');
      const emailResult = await emailService.sendConfirmationEmails(appointment, stylistsData, clientData);
      
      if (emailResult.success) {
        console.log('Emails sent successfully:', emailResult.results);
      } else {
        console.warn('Email sending failed:', emailResult.message);
      }
      
      // Reload appointments
      const result = await appointmentApiService.getAppointments({ branchId: userData.branchId });
      setAppointmentsData(result.appointments);
      
      // Show success message with email confirmation
      alert('Appointment confirmed successfully! Confirmation emails have been sent to the stylist(s) and client.');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('Error confirming appointment: ' + error.message);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await appointmentApiService.cancelAppointment(appointmentId, 'Cancelled by branch manager');
      // Reload appointments
      const result = await appointmentApiService.getAppointments({ branchId: userData.branchId });
      setAppointmentsData(result.appointments);
      alert('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error cancelling appointment');
    }
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointments Overview">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Summary Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><Calendar className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">
                {filteredAppointments.length !== appointmentsData.length ? 'Filtered Appointments' : 'Total Appointments'}
                {filteredAppointments.length !== appointmentsData.length && (
                  <span className="text-blue-600 font-medium"> ({filteredAppointments.length} of {appointmentsData.length})</span>
                )}
              </p>
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
              <p className="text-xs text-gray-500">
                {filteredAppointments.length !== appointmentsData.length ? 'Filtered Revenue' : 'Total Revenue'}
              </p>
              <p className="text-2xl font-semibold text-center">₱{totalRevenue.toLocaleString()}</p>
            </div>
          </Card>
        </div>

        {/* === Filter + Actions === */}
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Side: Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors shadow-sm whitespace-nowrap"
                onClick={() => setIsFilterOpen(true)}
              >
                <Filter className="h-4 w-4" /> Filter Appointments
                {(filteredAppointments.length !== appointmentsData.length || 
                  (dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0] && statusFilter === "All" && stylistFilter === "All" && serviceFilter === "All" && query === "")) && (
                  <span className="bg-white text-[#160B53] text-xs rounded-full px-2 py-1 ml-1 font-medium">
                    {dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0] && statusFilter === "All" && stylistFilter === "All" && serviceFilter === "All" && query === "" ? "Today" : "Active"}
                  </span>
                )}
              </Button>
              
              {/* Status Filter Dropdown */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] whitespace-nowrap"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Right Side: Status Info and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg whitespace-nowrap">
                {dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0] && statusFilter === "All" && stylistFilter === "All" && serviceFilter === "All" && query === "" ? (
                  <>Showing <span className="font-semibold text-gray-900">{filteredAppointments.length}</span> appointments for <span className="font-semibold text-blue-600">today</span></>
                ) : (
                  <>Showing <span className="font-semibold text-gray-900">{filteredAppointments.length}</span> of <span className="font-semibold text-gray-900">{appointmentsData.length}</span> appointments</>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => exportCSV(filteredAppointments, "appointments_filtered.csv")} 
                  className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] shadow-sm whitespace-nowrap"
                >
                  <FileText className="h-4 w-4"/> Export
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    console.log('Button clicked!');
                    printReport();
                  }} 
                  className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap"
                >
                  <Printer className="h-4 w-4"/> Print
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* === Filter Modal === */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Filter Appointments</h2>
                <Button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Client</label>
                  <input 
                    type="text" 
                    placeholder="Enter client name..." 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stylist</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                    value={stylistFilter} 
                    onChange={e => setStylistFilter(e.target.value)}
                  >
                    {stylists.map(s => (
                      <option key={s} value={s}>
                        {s === "All" ? "All Stylists" : getStylistName(s)}
                      </option>
                    ))}
              </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                    value={serviceFilter} 
                    onChange={e => setServiceFilter(e.target.value)}
                  >
                    {services.map(s => (
                      <option key={s} value={s}>
                        {s === "All" ? "All Services" : getServiceName(s)}
                      </option>
                    ))}
              </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                <option value="All">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
              </select>
              </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">From</label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                        value={dateFrom} 
                        onChange={e => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">To</label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53]" 
                        value={dateTo} 
                        onChange={e => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-3 mt-6">
              <Button
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={clearAllFilters}
              >
                Reset
              </Button>
              <Button
                  className="flex-1 bg-[#160B53] text-white hover:bg-[#12094A]"
                onClick={() => setIsFilterOpen(false)}
              >
                  Apply Filters
              </Button>
            </div>
            </div>
          </div>
        )}

        {/* === Charts === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Appointment Trend */}
          <Card className="p-4">
             <div className="flex items-center gap-2 mb-2">
               <Calendar className="h-5 w-5 text-[#160B53]"/>
               <h3 className="text-sm font-semibold">Appointments Trend</h3>
             </div>
            <ResponsiveContainer width="100%" height={220}>
               <LineChart data={appointmentTrendData}>
                <CartesianGrid strokeDasharray="3 3"/>
                 <XAxis 
                   dataKey="date"
                   tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                 />
                <YAxis/>
                 <Tooltip 
                   labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                     weekday: 'long', 
                     year: 'numeric', 
                     month: 'long', 
                     day: 'numeric' 
                   })}
                   formatter={(value) => [value, 'Appointments']}
                 />
                 <Line dataKey="appointments" stroke="#160B53" strokeWidth={2} name="Appointments"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Stylist Performance */}
          <Card className="p-4">
             <div className="flex items-center gap-2 mb-2">
               <BarChart3 className="h-5 w-5 text-pink-600"/>
               <h3 className="text-sm font-semibold">Stylist Performance</h3>
             </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stylistPerformance} margin={{ top: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3"/>
                 <XAxis 
                   dataKey="stylist"
                   tickFormatter={(value) => value.length > 8 ? value.substring(0, 8) + '...' : value}
                 />
                <YAxis/>
                 <Tooltip formatter={(value) => [value, 'Appointments']}/>
                <Bar dataKey="appointments" fill="#7c3aed" radius={[6,6,0,0]} name="Appointments"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* === Loading State === */}
        {appointmentsLoading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-2 text-gray-600">Loading appointments...</span>
          </div>
        )}

        {/* === Error State === */}
        {appointmentsError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading appointments</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{appointmentsError}</p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* === Appointments Table === */}
        {!appointmentsLoading && !appointmentsError && (
        <Card className="shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <Users className="h-4 w-4" />
                         <span>Client</span>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <Calendar className="h-4 w-4" />
                         <span>Date & Time</span>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <Package className="h-4 w-4" />
                         <span>Services</span>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center space-x-1">
                         <CheckCircle className="h-4 w-4" />
                         <span>Status</span>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center justify-end space-x-1">
                         <DollarSign className="h-4 w-4" />
                         <span>Revenue</span>
                       </div>
                     </th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <div className="flex items-center justify-center space-x-1">
                         <Eye className="h-4 w-4" />
                         <span>Actions</span>
                       </div>
                     </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                     filteredAppointments.map((appointment, index) => {
                       const clientName = appointment.getClientDisplayName ? appointment.getClientDisplayName() : (appointment.clientInfo?.name || appointment.clientName || 'Unknown');
                       
                       // Calculate estimated revenue based on new serviceStylistPairs structure
                       let estimatedRevenue = 0;
                       if (appointment.serviceStylistPairs && Array.isArray(appointment.serviceStylistPairs)) {
                         estimatedRevenue = appointment.serviceStylistPairs.reduce((sum, pair) => sum + getServicePrice(pair.serviceId), 0);
                       } else if (appointment.serviceIds && Array.isArray(appointment.serviceIds)) {
                         estimatedRevenue = appointment.serviceIds.reduce((sum, serviceId) => sum + getServicePrice(serviceId), 0);
                       }
                       
                       // Get stylist information
                       const stylistInfo = getStylistDisplay(appointment);
                       
                       return (
                         <tr key={appointment.id || `appointment-${index}`} className="hover:bg-gray-50 transition-colors">
                           {/* Client - Most Important for Branch Manager */}
                           <td className="px-6 py-4">
                             <div className="flex items-center space-x-3">
                               <div className="flex-shrink-0">
                                 <div className="h-10 w-10 rounded-full bg-[#160B53] flex items-center justify-center">
                                   <span className="text-white font-semibold text-sm">
                                     {clientName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                   </span>
                                 </div>
                               </div>
                               <div className="flex-1 min-w-0">
                                 <div className="text-sm font-semibold text-gray-900 truncate">
                                   {clientName}
                                 </div>
                                 <div className="flex items-center space-x-2">
                                   {appointment.isNewClient ? (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                       <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                                       New Client
                                     </span>
                                   ) : (
                                     <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                       <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                                       Returning
                                     </span>
                                   )}
                                 </div>
                               </div>
                          </div>
                      </td>

                           {/* Date & Time - Critical for Salon Scheduling */}
                           <td className="px-6 py-4">
                             <div className="text-sm font-semibold text-gray-900">
                               {appointment.getFormattedDate ? appointment.getFormattedDate() : new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                                 weekday: 'short', 
                                 month: 'short', 
                                 day: 'numeric' 
                               })}
                             </div>
                             <div className="text-sm text-gray-600 font-medium">
                               {appointment.getFormattedTime ? appointment.getFormattedTime() : appointment.appointmentTime}
                             </div>
                             <div className="text-xs text-gray-500">
                               {appointment.appointmentDate === new Date().toISOString().split('T')[0] ? 'Today' : 
                                appointment.appointmentDate === new Date(Date.now() + 86400000).toISOString().split('T')[0] ? 'Tomorrow' : ''}
                          </div>
                      </td>

                           {/* Services - Normalized Display */}
                           <td className="px-6 py-4">
                             <div className="space-y-1">
                               {appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0 ? (
                                 <>
                                   {appointment.serviceStylistPairs.slice(0, 2).map((pair, index) => (
                                     <div key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#160B53] text-white mr-1 mb-1">
                                       {getServiceName(pair.serviceId)}
                                     </div>
                                   ))}
                                   {appointment.serviceStylistPairs.length > 2 && (
                                     <div className="text-xs text-gray-500 font-medium">
                                       +{appointment.serviceStylistPairs.length - 2} more services
                                     </div>
                                   )}
                                 </>
                               ) : appointment.serviceIds && appointment.serviceIds.length > 0 ? (
                                 <>
                                   {appointment.serviceIds.slice(0, 2).map((serviceId, index) => (
                                     <div key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#160B53] text-white mr-1 mb-1">
                                       {getServiceName(serviceId)}
                                     </div>
                                   ))}
                                   {appointment.serviceIds.length > 2 && (
                                     <div className="text-xs text-gray-500 font-medium">
                                       +{appointment.serviceIds.length - 2} more services
                                     </div>
                                   )}
                                 </>
                               ) : (
                                 <span className="text-gray-400 text-sm">No services</span>
                               )}
                             </div>
                           </td>


                           {/* Status - Current state of appointment */}
                           <td className="px-6 py-4">
                        <span
                               className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                 appointment.status === "completed"
                                   ? "bg-green-100 text-green-800 border border-green-200"
                                   : appointment.status === "cancelled"
                                   ? "bg-red-100 text-red-800 border border-red-200"
                                   : appointment.status === "confirmed"
                                   ? "bg-blue-100 text-blue-800 border border-blue-200"
                                   : appointment.status === "in_progress"
                                   ? "bg-orange-100 text-orange-800 border border-orange-200"
                                   : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                               }`}
                             >
                               <span className={`w-2 h-2 rounded-full mr-2 ${
                                 appointment.status === "completed" ? "bg-green-400" :
                                 appointment.status === "cancelled" ? "bg-red-400" :
                                 appointment.status === "confirmed" ? "bg-blue-400" :
                                 appointment.status === "in_progress" ? "bg-orange-400" :
                                 "bg-yellow-400"
                               }`}></span>
                               {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                      </td>

                           {/* Revenue - Normalized Display */}
                           <td className="px-6 py-4 text-right">
                             <div className="text-sm font-bold text-gray-900">
                               ₱{estimatedRevenue.toLocaleString()}
                             </div>
                             <div className="text-xs text-gray-500">
                               {appointment.serviceStylistPairs ? `${appointment.serviceStylistPairs.length} service${appointment.serviceStylistPairs.length > 1 ? 's' : ''}` : 
                                appointment.serviceIds ? `${appointment.serviceIds.length} service${appointment.serviceIds.length > 1 ? 's' : ''}` : 'No services'}
                             </div>
                      </td>
                      
                           {/* Actions - Management controls */}
                           <td className="px-6 py-4">
                             <div className="flex items-center justify-center space-x-1">
                               {/* View Details */}
                          <Button
                            size="sm"
                                 className="flex items-center justify-center p-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                                 onClick={() => handleViewAppointment(appointment)}
                                 title="View Full Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                               {/* Status-specific actions */}
                               {appointment.status === "scheduled" && (
                            <Button
                              size="sm"
                                   className="flex items-center justify-center p-2 bg-green-500 text-white hover:bg-green-600 transition-colors"
                                   onClick={() => handleShowConfirmModal(appointment)}
                                   title="Confirm Appointment"
                            >
                                   <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                               {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                            <Button
                        size="sm"
                                   className="flex items-center justify-center p-2 bg-red-500 text-white hover:bg-red-600 transition-colors"
                                   onClick={() => handleCancelAppointment(appointment.id)}
                                   title="Cancel Appointment"
                      >
                                   <XCircle className="h-4 w-4" />
                      </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                       );
                     })
                )}
              </tbody>
            </table>
          </div>
        </Card>
        )}

         {/* === Appointment Details Modal === */}
         {showDetailsModal && selectedAppointment && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDetailsModal(false)}>
             <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
               {/* Debug Info - Remove this later */}
               <div className="bg-yellow-100 p-2 text-xs">
                 Debug: Modal is showing for appointment with {selectedAppointment.serviceStylistPairs?.length || 0} service-stylist pairs
               </div>
               {/* Modal Header */}
               <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6 rounded-t-lg">
                 <div className="flex items-center justify-between">
                   <div>
                     <h2 className="text-2xl font-bold">
                       {selectedAppointment.clientInfo?.name || selectedAppointment.clientName || 'Unknown Client'}
                     </h2>
                     <p className="text-white/80 mt-1">
                       {selectedAppointment.appointmentDate ? 
                         new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                           weekday: 'long',
                           year: 'numeric',
                           month: 'long',
                           day: 'numeric'
                         }) : 'Date not available'} at {selectedAppointment.appointmentTime || 'Time not available'}
                     </p>
                   </div>
                   <div className="flex items-center space-x-4">
                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                       selectedAppointment.status === "completed"
                         ? "bg-green-100 text-green-800"
                         : selectedAppointment.status === "cancelled"
                         ? "bg-red-100 text-red-800"
                         : selectedAppointment.status === "confirmed"
                         ? "bg-blue-100 text-blue-800"
                         : "bg-yellow-100 text-yellow-800"
                     }`}>
                       {selectedAppointment.status ? selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1) : 'Unknown'}
                     </span>
                     <Button
                       onClick={() => setShowDetailsModal(false)}
                       className="text-white hover:text-gray-200 p-2"
                     >
                       ✕
                     </Button>
                   </div>
                 </div>
               </div>

               {/* Modal Content */}
               <div className="flex-1 overflow-y-auto p-6">
                 <div className="space-y-6">

                 {/* Main Content Grid */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Left Column */}
                   <div className="space-y-6">
                     {/* Client Information */}
                     <div className="bg-white border border-gray-200 rounded-lg p-6">
                       <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-blue-100 rounded-lg">
                           <Users className="h-5 w-5 text-blue-600" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900">Client Information</h3>
                       </div>
                       <div className="space-y-3">
                         <div className="flex justify-between items-center py-2 border-b border-gray-100">
                           <span className="font-medium text-gray-700">Name:</span>
                           <span className="text-gray-900 font-medium">
                             {selectedAppointment.clientInfo?.name || selectedAppointment.clientName || 'Unknown'}
                           </span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-gray-100">
                           <span className="font-medium text-gray-700">Client Type:</span>
                           <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                             selectedAppointment.isNewClient ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                           }`}>
                             {selectedAppointment.isNewClient ? 'New Client' : 'Returning Client'}
                           </span>
                         </div>
                         {selectedAppointment.clientInfo?.phone && (
                           <div className="flex justify-between items-center py-2 border-b border-gray-100">
                             <span className="font-medium text-gray-700">Phone:</span>
                             <span className="text-gray-600">{selectedAppointment.clientInfo.phone}</span>
                           </div>
                         )}
                         {selectedAppointment.clientInfo?.email && (
                           <div className="flex justify-between items-center py-2">
                             <span className="font-medium text-gray-700">Email:</span>
                             <span className="text-gray-600">{selectedAppointment.clientInfo.email}</span>
                           </div>
                         )}
                       </div>
                     </div>

                     {/* Services & Pricing */}
                     <div className="bg-white border border-gray-200 rounded-lg p-6">
                       <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-purple-100 rounded-lg">
                           <Package className="h-5 w-5 text-purple-600" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900">Services & Pricing</h3>
                       </div>
                       {(selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 0) || (selectedAppointment.serviceIds && selectedAppointment.serviceIds.length > 0) ? (
                         <div className="space-y-3">
                           {/* Handle new serviceStylistPairs structure */}
                           {selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 0 ? (
                             <>
                               {selectedAppointment.serviceStylistPairs.map((pair, index) => (
                                 <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                                   <div>
                                     <span className="text-gray-700 font-medium">{pair.serviceId ? getServiceName(pair.serviceId) : 'Unknown Service'}</span>
                                     <div className="text-xs text-gray-500">Stylist: {pair.stylistId ? getStylistName(pair.stylistId) : 'Unassigned'}</div>
                                   </div>
                                   <span className="font-semibold text-gray-900">₱{pair.serviceId ? getServicePrice(pair.serviceId).toLocaleString() : '0'}</span>
                                 </div>
                               ))}
                               <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4 mt-4">
                                 <span className="font-bold text-lg text-gray-900">Total Estimated:</span>
                                 <span className="font-bold text-xl text-green-600">
                                   ₱{selectedAppointment.serviceStylistPairs.reduce((sum, pair) => sum + (pair.serviceId ? getServicePrice(pair.serviceId) : 0), 0).toLocaleString()}
                                 </span>
                               </div>
                             </>
                           ) : (
                             <>
                               {/* Fallback to old serviceIds structure */}
                               {selectedAppointment.serviceIds && selectedAppointment.serviceIds.map((serviceId, index) => (
                                 <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                                   <span className="text-gray-700 font-medium">{getServiceName(serviceId)}</span>
                                   <span className="font-semibold text-gray-900">₱{getServicePrice(serviceId).toLocaleString()}</span>
                                 </div>
                               ))}
                               <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4 mt-4">
                                 <span className="font-bold text-lg text-gray-900">Total Estimated:</span>
                                 <span className="font-bold text-xl text-green-600">
                                   ₱{selectedAppointment.serviceIds.reduce((sum, serviceId) => sum + getServicePrice(serviceId), 0).toLocaleString()}
                                 </span>
                               </div>
                             </>
                           )}
                         </div>
                       ) : (
                         <div className="text-gray-500 text-center py-4">No services selected</div>
                       )}
                     </div>
                   </div>

                   {/* Right Column */}
                   <div className="space-y-6">
                     {/* Stylist Information */}
                     <div className="bg-white border border-gray-200 rounded-lg p-6">
                       <div className="flex items-center space-x-3 mb-4">
                         <div className="p-2 bg-green-100 rounded-lg">
                           <Users className="h-5 w-5 text-green-600" />
                         </div>
                         <h3 className="text-lg font-semibold text-gray-900">Stylist Information</h3>
                       </div>
                       {selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 0 ? (
                         <div className="space-y-4">
                           {selectedAppointment.serviceStylistPairs.map((pair, index) => {
                             // Simplified and safer rendering
                             const stylistInfo = pair?.stylistId ? stylistsData[pair.stylistId] : null;
                             const stylistName = stylistInfo?.name || `Stylist ${pair?.stylistId ? pair.stylistId.slice(-4) : 'N/A'}`;
                             const serviceName = pair?.serviceId ? getServiceName(pair.serviceId) : 'Unknown Service';
                             
                             return (
                               <div key={`stylist-${index}`} className="border border-gray-200 rounded-lg p-4">
                                 <div className="flex items-center space-x-3 mb-3">
                                   <div className="h-10 w-10 rounded-full flex items-center justify-center bg-[#160B53]">
                                     <span className="text-white font-semibold text-sm">
                                       {stylistName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                     </span>
                                   </div>
                                   <div>
                                     <div className="font-semibold text-gray-900">{stylistName}</div>
                                     <div className="text-sm text-gray-500">{serviceName}</div>
                                   </div>
                                 </div>
                                 
                                 <div className="space-y-2">
                                   <div className="flex justify-between items-center py-1">
                                     <span className="font-medium text-gray-700">Email:</span>
                                     <span className="text-gray-600">{stylistInfo?.email || 'N/A'}</span>
                                   </div>
                                   <div className="flex justify-between items-center py-1">
                                     <span className="font-medium text-gray-700">Phone:</span>
                                     <span className="text-gray-600">{stylistInfo?.phone || 'N/A'}</span>
                                   </div>
                                   <div className="flex justify-between items-center py-1">
                                     <span className="font-medium text-gray-700">Status:</span>
                                     <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                       {stylistInfo?.isActive !== false ? 'Active' : 'Inactive'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="text-gray-500 text-center py-4">No stylists assigned</div>
                       )}
                     </div>

                     {/* Notes */}
                     {selectedAppointment.notes && (
                       <div className="bg-white border border-gray-200 rounded-lg p-6">
                         <div className="flex items-center space-x-3 mb-4">
                           <div className="p-2 bg-yellow-100 rounded-lg">
                             <FileText className="h-5 w-5 text-yellow-600" />
                           </div>
                           <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                         </div>
                         <div className="bg-gray-50 p-4 rounded-lg">
                           <p className="text-gray-700">{selectedAppointment.notes}</p>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* History Section */}
                 <div className="bg-white border border-gray-200 rounded-lg p-6">
                   <div className="flex items-center space-x-3 mb-4">
                     <div className="p-2 bg-gray-100 rounded-lg">
                       <Calendar className="h-5 w-5 text-gray-600" />
                     </div>
                     <h3 className="text-lg font-semibold text-gray-900">Appointment History</h3>
                     <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                       {selectedAppointment.history?.length || 0} entries
                     </span>
                   </div>
                   <div className="space-y-3 max-h-60 overflow-y-auto">
                     {selectedAppointment.history && selectedAppointment.history.length > 0 ? (
                       selectedAppointment.history.map((entry, index) => (
                         <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                           <div className="flex-shrink-0">
                             <div className="w-8 h-8 bg-[#160B53] rounded-full flex items-center justify-center">
                               <span className="text-white text-xs font-bold">{index + 1}</span>
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between mb-2">
                               <h4 className="font-medium text-gray-900 text-sm">
                                 {entry.action ? entry.action.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN ACTION'}
                               </h4>
                               <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                 {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'No timestamp'}
                               </span>
                             </div>
                             
                             {/* Detailed Entry Information */}
                             <div className="space-y-2">
                               {entry.notes && (
                                 <div className="bg-white p-2 rounded border-l-2 border-blue-400">
                                   <p className="text-sm text-gray-700"><strong>Notes:</strong> {entry.notes}</p>
                                 </div>
                               )}
                               
                               <div className="flex items-center space-x-4 text-xs text-gray-600">
                                 <span><strong>By:</strong> {usersData[entry.by]?.name || `User ${entry.by ? entry.by.slice(-4) : 'Unknown'}`}</span>
                                 {entry.isNewClient !== undefined && (
                                   <span><strong>New Client:</strong> {entry.isNewClient ? 'Yes' : 'No'}</span>
                                 )}
                               </div>
                               
                               {/* Show additional fields if they exist */}
                               {(entry.newClientName || entry.newClientEmail || entry.newClientPhone) && (
                                 <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-300">
                                   <p className="text-xs text-blue-800 font-medium mb-1">New Client Details:</p>
                                   <div className="space-y-1 text-xs text-blue-700">
                                     {entry.newClientName && <p><strong>Name:</strong> {entry.newClientName}</p>}
                                     {entry.newClientEmail && <p><strong>Email:</strong> {entry.newClientEmail}</p>}
                                     {entry.newClientPhone && <p><strong>Phone:</strong> {entry.newClientPhone}</p>}
                                   </div>
                                 </div>
                               )}
                               
                               {/* Show raw entry data for debugging */}
                               <details className="text-xs">
                                 <summary className="cursor-pointer text-gray-500 hover:text-gray-700">View Raw Data</summary>
                                 <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                   {JSON.stringify(entry, null, 2)}
                                 </pre>
                               </details>
                             </div>
                           </div>
                         </div>
                       ))
                     ) : (
                       <div className="text-gray-500 text-center py-8">
                         <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                         <p>No history available</p>
                         <p className="text-xs">This appointment has no recorded changes</p>
                       </div>
                     )}
                   </div>
                 </div>
                 </div>
               </div>

               {/* Modal Footer */}
               <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-lg">
                 <div className="flex justify-end space-x-3">
                   <Button
                     onClick={() => setShowDetailsModal(false)}
                     className="bg-gray-500 text-white hover:bg-gray-600"
                   >
                     Close
                   </Button>
                   {selectedAppointment.status === "scheduled" && (
                     <Button
                       onClick={() => {
                         setShowDetailsModal(false);
                         handleShowConfirmModal(selectedAppointment);
                       }}
                       className="bg-green-600 text-white hover:bg-green-700"
                     >
                       Confirm Appointment
                     </Button>
                   )}
                   {selectedAppointment.status !== "cancelled" && selectedAppointment.status !== "completed" && (
                     <Button
                       onClick={() => {
                         handleCancelAppointment(selectedAppointment.id);
                         setShowDetailsModal(false);
                       }}
                       className="bg-red-600 text-white hover:bg-red-700"
                     >
                       Cancel Appointment
                     </Button>
                   )}
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* === Confirmation Modal === */}
         {showConfirmModal && appointmentToConfirm && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowConfirmModal(false)}>
             <div className="bg-white rounded-lg w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
               {/* Modal Header */}
               <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="p-2 bg-green-500 rounded-lg">
                       <CheckCircle className="h-6 w-6" />
                     </div>
                     <h2 className="text-xl font-bold">Confirm Appointment</h2>
                   </div>
                   <Button
                     onClick={() => setShowConfirmModal(false)}
                     className="text-white hover:text-gray-200 p-2"
                   >
                     ✕
                   </Button>
                 </div>
               </div>

               {/* Modal Content */}
               <div className="p-6">
                 <div className="space-y-4">
                   <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                     <p className="text-blue-800 font-medium">Are you sure you want to confirm this appointment?</p>
                   </div>

                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h3 className="font-semibold text-gray-900 mb-3">Appointment Details:</h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Client:</span>
                         <span className="font-medium">{appointmentToConfirm.clientInfo?.name || appointmentToConfirm.clientName || 'Unknown'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Date:</span>
                         <span className="font-medium">{new Date(appointmentToConfirm.appointmentDate).toLocaleDateString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Time:</span>
                         <span className="font-medium">{appointmentToConfirm.appointmentTime}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Status:</span>
                         <span className="font-medium text-green-600">Will be confirmed</span>
                       </div>
                     </div>
                   </div>

                   <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                     <p className="text-yellow-800 text-sm">
                       <strong>Note:</strong> Confirmation emails will be sent to the stylist(s) and client automatically.
                     </p>
                   </div>
                 </div>
               </div>

               {/* Modal Footer */}
               <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-lg">
                 <div className="flex justify-end space-x-3">
                   <Button
                     onClick={() => setShowConfirmModal(false)}
                     className="bg-gray-500 text-white hover:bg-gray-600"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleConfirmAppointmentModal}
                     className="bg-green-600 text-white hover:bg-green-700 flex items-center space-x-2"
                   >
                     <CheckCircle className="h-4 w-4" />
                     <span>Confirm Appointment</span>
                   </Button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </DashboardLayout>
  );
};

export default BranchManagerAppointments;
