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
import {
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Printer,
  FileDown,
  Home,
  Package,
  UserCog,
  Eye,
  Filter,
  FileText,
  Receipt,
  Settings,
  Search,
  X,
  Clock,
  User,
  Scissors,
  CheckCircle,
} from "lucide-react";
import { branchManagerMenuItems } from "./menuItems";

// Chart imports removed - focusing on printing and export features

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
  
  // Debug appointmentsData changes
  useEffect(() => {
    console.log('🔄 APPOINTMENTS DATA CHANGED:');
    console.log('New appointmentsData length:', appointmentsData.length);
    console.log('New appointmentsData:', appointmentsData);
    console.log('Stack trace:', new Error().stack);
  }, [appointmentsData]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [stylistsData, setStylistsData] = useState({});
  const [servicesData, setServicesData] = useState({});
  const [usersData, setUsersData] = useState({});
  const [branchData, setBranchData] = useState(null);

  // Simple display helper
  const displayAppointments = (appointments) => {
    console.log('📋 DISPLAYING APPOINTMENTS:');
    console.log('Total appointments:', appointments.length);
    appointments.forEach((apt, index) => {
      console.log(`Appointment ${index + 1}:`, {
        id: apt.id,
        clientName: apt.clientName,
        appointmentDate: apt.appointmentDate,
        appointmentTime: apt.appointmentTime,
        status: apt.status
      });
    });
  };

  // === Load Appointments ===
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        setAppointmentsError(null);
        
              // Get user's branchId for filtering
              const userBranchId = userData.branchId;
              console.log('🎯 FILTERING BY BRANCH ID:', userBranchId);

              console.log('🔍 FETCHING APPOINTMENTS FOR BRANCH:');
              console.log('User role: branchManager');
              console.log('User ID:', userData.uid);
              console.log('User branchId:', userBranchId);
              console.log('✅ FILTERING BY BRANCH ID - FETCHING APPOINTMENTS FOR BRANCH');
              
              // Filter appointments by branchId
              console.log('🎯 FILTERING APPOINTMENTS BY BRANCH ID:', userBranchId);
              const result = await appointmentApiService.getAppointments({ branchId: userBranchId }, 'branchManager', userData.uid);

        console.log('📊 APPOINTMENTS RESULT:');
        console.log('Result object:', result);
        console.log('Result.appointments:', result.appointments);
        console.log('Result.appointments length:', result.appointments?.length || 0);
        
        // Check if result.appointments is actually an array
        if (result.appointments) {
          console.log('✅ result.appointments exists and is:', typeof result.appointments);
          console.log('Is array?', Array.isArray(result.appointments));
          console.log('Length:', result.appointments.length);
        } else {
          console.log('❌ result.appointments is missing or undefined!');
        }
        
        // Show all appointments found
              console.log('📊 APPOINTMENTS FOUND FOR BRANCH:', result.appointments?.length || 0);
              
              // Display appointments found for this branch
              if (result.appointments && result.appointments.length > 0) {
                console.log('📋 APPOINTMENTS TO DISPLAY FOR BRANCH:');
                result.appointments.forEach((apt, index) => {
                  console.log(`Appointment ${index + 1}:`, {
                    id: apt.id,
                    clientName: apt.clientName,
                    appointmentDate: apt.appointmentDate,
                    appointmentTime: apt.appointmentTime,
                    status: apt.status,
                    branchId: apt.branchId
                  });
                });
              }
              
              // Branch appointments fetched - showing only appointments for this branch

        if (result.appointments && result.appointments.length > 0) {
          setAppointmentsData(result.appointments);
          
          // FORCE TEST: Set appointments immediately to test if state update works
          console.log('🧪 FORCE TESTING: Setting appointments directly...');
          setTimeout(() => {
            console.log('🧪 FORCE TEST: Current appointmentsData after timeout:', appointmentsData);
          }, 100);
          
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

              // Branch information loaded - showing only appointments for this branch
        } else {
          // No appointments found for this branch
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

          if (userData && userData.branchId) {
      loadAppointments();
    }
  }, [userData?.branchId]);

  // === Filter State ===
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stylistFilter, setStylistFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  // Set default date range to show today's appointments only
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Clear all filters (reset to today's appointments)
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
    console.log('🔍 FILTERING APPOINTMENTS:');
    console.log('Raw appointmentsData:', appointmentsData);
    console.log('appointmentsData length:', appointmentsData.length);
    console.log('Current filters:', {
      query,
      statusFilter,
      stylistFilter,
      serviceFilter,
      dateFrom,
      dateTo
    });
    
    // If appointmentsData is empty, return empty array
    if (!appointmentsData || appointmentsData.length === 0) {
      console.log('❌ NO APPOINTMENTS DATA - RETURNING EMPTY ARRAY');
      return [];
    }
    
    // Default: Show only today's appointments if no filters are applied
    const hasFilters = query || statusFilter !== 'All' || stylistFilter !== 'All' || serviceFilter !== 'All' || dateFrom || dateTo;
    
    if (!hasFilters) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('📅 DEFAULT FILTER: Showing only today\'s appointments:', today);
      const todayAppointments = appointmentsData.filter(apt => apt.appointmentDate === today);
      console.log('📊 Today\'s appointments found:', todayAppointments.length);
      return todayAppointments;
    }
    
    // Apply custom filters when user has set them
    console.log('🎯 CUSTOM FILTERS APPLIED - Showing filtered data');
    let filtered = appointmentsData;
    
    // Apply search query filter
    if (query) {
      filtered = filtered.filter((a) => {
        const searchTerm = query.toLowerCase();
        const clientName = (a.clientName || a.clientInfo?.name || '').toLowerCase();
        const clientEmail = (a.clientEmail || a.clientInfo?.email || '').toLowerCase();
        const clientPhone = (a.clientPhone || a.clientInfo?.phone || '').toLowerCase();
        
        return clientName.includes(searchTerm) || 
               clientEmail.includes(searchTerm) || 
               clientPhone.includes(searchTerm);
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    
    // Apply stylist filter
    if (stylistFilter !== 'All') {
      filtered = filtered.filter((a) => {
        if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
          return a.serviceStylistPairs.some(pair => pair.stylistId === stylistFilter);
        }
        return a.stylistId === stylistFilter;
      });
    }
    
    // Apply service filter
    if (serviceFilter !== 'All') {
      filtered = filtered.filter((a) => {
        if (a.serviceStylistPairs && Array.isArray(a.serviceStylistPairs)) {
          return a.serviceStylistPairs.some(pair => pair.serviceId === serviceFilter);
        }
        return a.serviceIds && a.serviceIds.includes(serviceFilter);
      });
    }
    
    // Apply date filters
    if (dateFrom) {
      filtered = filtered.filter((a) => a.appointmentDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((a) => a.appointmentDate <= dateTo);
    }
    
    console.log('✅ FINAL FILTERED APPOINTMENTS:', filtered.length);
    return filtered;
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
    if (stylistId === 'any_available') return 'No One Preferred';
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

  // === Chart Data (Removed trend - focusing on actionable features) ===

  // Stylist Performance chart removed - focusing on actionable features

  // === Actions ===
  const exportToExcel = async (rows = filteredAppointments, filename = "appointments.xlsx") => {
    if (!rows.length) { alert("No data to export."); return; }
    
    console.log('📊 EXPORTING EXCEL - Data received:', rows.length, 'appointments');
    console.log('📊 First appointment structure:', rows[0]);
    
    try {
      // Import the XLSX library for better customization
      const XLSX = await import('xlsx');
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Find maximum number of services across all appointments
      const findMaxServices = (appointments) => {
        let maxServices = 0;
        appointments.forEach(appointment => {
          const serviceCount = appointment.serviceStylistPairs?.length || 0;
          if (serviceCount > maxServices) {
            maxServices = serviceCount;
          }
        });
        return Math.min(maxServices, 10); // Cap at 10 services for Excel readability
      };

      // Prepare data with dynamic service breakdown
      const prepareAppointmentData = (appointments) => {
        const maxServices = findMaxServices(appointments);
        console.log(`📊 Maximum services found: ${maxServices}`);
        
        return appointments.map((appointment, index) => {
          const services = appointment.serviceStylistPairs || [];
          const totalPrice = services.reduce((sum, service) => sum + (service.servicePrice || 0), 0);
          
          const result = {
            rowNumber: index + 1,
            clientName: appointment.clientName || appointment.client || 'N/A',
            appointmentDate: appointment.appointmentDate || appointment.date || 'N/A',
            appointmentTime: appointment.appointmentTime || appointment.time || 'N/A',
            status: appointment.status || 'N/A',
            totalPrice: totalPrice,
            clientEmail: appointment.clientEmail || 'N/A',
            clientPhone: appointment.clientPhone || 'N/A',
            notes: appointment.notes || 'N/A',
            clientId: appointment.clientId || 'N/A',
            updatedAt: appointment.updatedAt ? new Date(appointment.updatedAt).toLocaleString() : 'N/A'
          };
          
          // Add dynamic service columns
          for (let i = 0; i < maxServices; i++) {
            const service = services[i] || { serviceName: '', servicePrice: 0, stylistName: '' };
            result[`service${i + 1}Name`] = service.serviceName || '';
            result[`service${i + 1}Price`] = service.servicePrice || 0;
            result[`service${i + 1}Stylist`] = service.stylistName || '';
          }
          
          return result;
        });
      };
      
      // Create main data sheet with detailed service breakdown
      const mainData = prepareAppointmentData(rows);
      const maxServices = findMaxServices(rows);
      
      // Create main worksheet with dynamic service breakdown
      const mainWorksheetData = [];
      
      // Create dynamic headers
      const headers = [
        'Row #', 'Client Name', 'Appointment Date', 'Appointment Time', 'Status'
      ];
      
      // Add dynamic service headers
      for (let i = 1; i <= maxServices; i++) {
        headers.push(`Service ${i}`, `Price ${i}`, `Stylist ${i}`);
      }
      
      // Add remaining headers
      headers.push('TOTAL PRICE', 'Client Email', 'Client Phone', 'Notes');
      
      mainWorksheetData.push(headers);
      
      // Add data rows with dynamic service breakdown
      mainData.forEach(appointment => {
        const row = [
          appointment.rowNumber,
          appointment.clientName,
          appointment.appointmentDate,
          appointment.appointmentTime,
          appointment.status
        ];
        
        // Add dynamic service data
        for (let i = 1; i <= maxServices; i++) {
          row.push(
            appointment[`service${i}Name`] || '',
            appointment[`service${i}Price`] || 0,
            appointment[`service${i}Stylist`] || ''
          );
        }
        
        // Add remaining data
        row.push(
          appointment.totalPrice, // Actual calculated total
          appointment.clientEmail,
          appointment.clientPhone,
          appointment.notes
        );
        
        mainWorksheetData.push(row);
      });
      
      // Add summary row
      const totalRevenue = mainData.reduce((sum, apt) => sum + apt.totalPrice, 0);
      const summaryRow = ['SUMMARY', 'TOTAL APPOINTMENTS', mainData.length, '', ''];
      
      // Add empty service columns
      for (let i = 1; i <= maxServices; i++) {
        summaryRow.push('', '', '');
      }
      
      // Add total revenue and empty columns
      summaryRow.push(totalRevenue, '', '', '');
      mainWorksheetData.push(summaryRow);
      
      // Create the main worksheet
      const mainWorksheet = XLSX.utils.aoa_to_sheet(mainWorksheetData);
      XLSX.utils.book_append_sheet(workbook, mainWorksheet, '📊 Detailed Appointments');
      
      // Create individual stylist sheets
      const allStylists = new Set();
      rows.forEach(appointment => {
        appointment.serviceStylistPairs?.forEach(pair => {
          if (pair.stylistId !== 'any_available' && pair.stylistName) {
            allStylists.add(pair.stylistName);
          }
        });
      });
      
      // Create sheets for each stylist
      allStylists.forEach(stylistName => {
        const stylistAppointments = rows.filter(apt => 
          apt.serviceStylistPairs?.some(pair => pair.stylistName === stylistName)
        );
        
        if (stylistAppointments.length === 0) return; // Skip if no appointments
        
        const stylistData = prepareAppointmentData(stylistAppointments);
        const stylistMaxServices = findMaxServices(stylistAppointments);
        const stylistWorksheetData = [];
        
        // Create dynamic headers for stylist sheet
        const stylistHeaders = [
          'Row #', 'Client Name', 'Appointment Date', 'Appointment Time', 'Status'
        ];
        
        // Add dynamic service headers
        for (let i = 1; i <= stylistMaxServices; i++) {
          stylistHeaders.push(`Service ${i}`, `Price ${i}`, `Stylist ${i}`);
        }
        
        // Add remaining headers
        stylistHeaders.push('TOTAL PRICE', 'Client Email', 'Client Phone', 'Notes');
        stylistWorksheetData.push(stylistHeaders);
        
        // Add data rows with dynamic service breakdown
        stylistData.forEach(appointment => {
          const row = [
            appointment.rowNumber,
            appointment.clientName,
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.status
          ];
          
          // Add dynamic service data
          for (let i = 1; i <= stylistMaxServices; i++) {
            row.push(
              appointment[`service${i}Name`] || '',
              appointment[`service${i}Price`] || 0,
              appointment[`service${i}Stylist`] || ''
            );
          }
          
          // Add remaining data
          row.push(
            appointment.totalPrice, // Actual calculated total
            appointment.clientEmail,
            appointment.clientPhone,
            appointment.notes
          );
          
          stylistWorksheetData.push(row);
        });
        
        // Add summary row
        const totalRevenue = stylistData.reduce((sum, apt) => sum + apt.totalPrice, 0);
        const summaryRow = ['SUMMARY', 'TOTAL APPOINTMENTS', stylistData.length, '', ''];
        
        // Add empty service columns
        for (let i = 1; i <= stylistMaxServices; i++) {
          summaryRow.push('', '', '');
        }
        
        // Add total revenue and empty columns
        summaryRow.push(totalRevenue, '', '', '');
        stylistWorksheetData.push(summaryRow);
        
        const cleanStylistName = stylistName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 31);
        const stylistWorksheet = XLSX.utils.aoa_to_sheet(stylistWorksheetData);
        XLSX.utils.book_append_sheet(workbook, stylistWorksheet, `👤 ${cleanStylistName}`);
      });
      
      // Create "Any Available" sheet if needed
      const hasAnyAvailable = rows.some(apt => 
        apt.serviceStylistPairs?.some(pair => pair.stylistId === 'any_available')
      );
      
      if (hasAnyAvailable) {
        const anyAvailableAppointments = rows.filter(apt => 
          apt.serviceStylistPairs?.some(pair => pair.stylistId === 'any_available')
        );
        
        if (anyAvailableAppointments.length === 0) return; // Skip if no appointments
        
        const anyAvailableData = prepareAppointmentData(anyAvailableAppointments);
        const anyAvailableMaxServices = findMaxServices(anyAvailableAppointments);
        const anyAvailableWorksheetData = [];
        
        // Create dynamic headers for any available sheet
        const anyAvailableHeaders = [
          'Row #', 'Client Name', 'Appointment Date', 'Appointment Time', 'Status'
        ];
        
        // Add dynamic service headers
        for (let i = 1; i <= anyAvailableMaxServices; i++) {
          anyAvailableHeaders.push(`Service ${i}`, `Price ${i}`, `Stylist ${i}`);
        }
        
        // Add remaining headers
        anyAvailableHeaders.push('TOTAL PRICE', 'Client Email', 'Client Phone', 'Notes');
        anyAvailableWorksheetData.push(anyAvailableHeaders);
        
        // Add data rows with dynamic service breakdown
        anyAvailableData.forEach(appointment => {
          const row = [
            appointment.rowNumber,
            appointment.clientName,
            appointment.appointmentDate,
            appointment.appointmentTime,
            appointment.status
          ];
          
          // Add dynamic service data
          for (let i = 1; i <= anyAvailableMaxServices; i++) {
            row.push(
              appointment[`service${i}Name`] || '',
              appointment[`service${i}Price`] || 0,
              appointment[`service${i}Stylist`] || ''
            );
          }
          
          // Add remaining data
          row.push(
            appointment.totalPrice, // Actual calculated total
            appointment.clientEmail,
            appointment.clientPhone,
            appointment.notes
          );
          
          anyAvailableWorksheetData.push(row);
        });
        
        // Add summary row
        const totalRevenue = anyAvailableData.reduce((sum, apt) => sum + apt.totalPrice, 0);
        const summaryRow = ['SUMMARY', 'TOTAL APPOINTMENTS', anyAvailableData.length, '', ''];
        
        // Add empty service columns
        for (let i = 1; i <= anyAvailableMaxServices; i++) {
          summaryRow.push('', '', '');
        }
        
        // Add total revenue and empty columns
        summaryRow.push(totalRevenue, '', '', '');
        anyAvailableWorksheetData.push(summaryRow);
        
        const anyAvailableWorksheet = XLSX.utils.aoa_to_sheet(anyAvailableWorksheetData);
        XLSX.utils.book_append_sheet(workbook, anyAvailableWorksheet, '👥 Any Available');
      }
      
      // Generate filename with format: BranchName_CreatedByName_DateCreated
      const branchNameClean = branchName.replace(/[^a-zA-Z0-9]/g, '_');
      const createdByName = `${userData?.firstName || 'Unknown'}_${userData?.lastName || 'User'}`.replace(/[^a-zA-Z0-9]/g, '_');
      const dateCreated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const finalFilename = `${branchNameClean}_${createdByName}_${dateCreated}.xlsx`;
      
      // Generate and download the file
      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error creating Excel file:', error);
      console.log('Falling back to HTML-to-Excel method...');
      // Fallback to a simpler Excel format
      try {
        await createSimpleExcel(rows, filename);
      } catch (fallbackError) {
        console.error('Fallback Excel creation failed:', fallbackError);
        // Final fallback to CSV
        exportCSV(rows, filename);
      }
    }
  };

  const createSimpleExcel = async (rows, filename) => {
    // Find maximum number of services
    const findMaxServices = (appointments) => {
      let maxServices = 0;
      appointments.forEach(appointment => {
        const serviceCount = appointment.serviceStylistPairs?.length || 0;
        if (serviceCount > maxServices) {
          maxServices = serviceCount;
        }
      });
      return Math.min(maxServices, 10); // Cap at 10 services
    };

    const maxServices = findMaxServices(rows);
    console.log(`📊 HTML-to-Excel: Maximum services found: ${maxServices}`);
    
    // Create dynamic headers
    const headers = [
      'Row #', 'Client Name', 'Appointment Date', 'Appointment Time', 'Status'
    ];
    
    // Add dynamic service headers
    for (let i = 1; i <= maxServices; i++) {
      headers.push(`Service ${i}`, `Price ${i}`, `Stylist ${i}`);
    }
    
    // Add remaining headers
    headers.push('TOTAL PRICE', 'Client Email', 'Client Phone', 'Notes');
    
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <meta name="ExcelCreated" content="1">
        <meta name="ProgId" content="Excel.Sheet">
        <meta name="Generator" content="Salon Management System">
        <!--[if gte mso 9]><xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Appointments Report</x:Name>
                <x:WorksheetOptions>
                  <x:DefaultRowHeight>285</x:DefaultRowHeight>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml><![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th { background-color: #160B53; color: white; font-weight: bold; padding: 8px; text-align: center; }
          td { padding: 6px; border: 1px solid #ccc; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .status-completed { background-color: #d4edda; color: #155724; font-weight: bold; }
          .status-cancelled { background-color: #f8d7da; color: #721c24; font-weight: bold; }
          .status-confirmed { background-color: #d1ecf1; color: #0c5460; font-weight: bold; }
          .status-scheduled { background-color: #fff3cd; color: #856404; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
          ${rows.map((row, index) => {
            // Process service breakdown
            const services = row.serviceStylistPairs || [];
            const totalPrice = services.reduce((sum, service) => sum + (service.servicePrice || 0), 0);
            
            let serviceCells = '';
            for (let i = 0; i < maxServices; i++) {
              const service = services[i] || { serviceName: '', servicePrice: 0, stylistName: '' };
              serviceCells += `
                <td>${service.serviceName || ''}</td>
                <td>${service.servicePrice || 0}</td>
                <td>${service.stylistName || ''}</td>
              `;
            }
            
            return `
            <tr>
              <td>${index + 1}</td>
              <td>${row.clientName || row.client || 'N/A'}</td>
              <td>${row.appointmentDate || row.date || 'N/A'}</td>
              <td>${row.appointmentTime || row.time || 'N/A'}</td>
              <td class="status-${(row.status || '').toLowerCase()}">${row.status || 'N/A'}</td>
              ${serviceCells}
              <td>₱${totalPrice}</td>
              <td>${row.clientEmail || 'N/A'}</td>
              <td>${row.clientPhone || 'N/A'}</td>
              <td>${row.notes || 'N/A'}</td>
            </tr>
          `;
          }).join('')}
        </table>
      </body>
      </html>
    `;
    
    const blob = new Blob([html], { 
      type: 'application/vnd.ms-excel'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xls') ? filename : filename.replace('.xlsx', '.xls');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCSV = (rows = filteredAppointments, filename = "appointments.csv") => {
    if (!rows.length) { alert("No data to export."); return; }
    const header = ["Date", "Customer", "Service", "Stylist", "Status", "Revenue"];
    const csv = [header.join(","), ...rows.map(r => [r.date, `"${r.customer}"`, `"${r.service}"`, `"${r.staff}"`, r.status, r.revenue].join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  };

  const printReport = async () => {
    try {
      console.log('Print report clicked');
      console.log('Filtered appointments:', filteredAppointments);
      
      // Fetch branch name using branchId
      let branchName = 'Unknown Branch';
      console.log('Fetching branch name for branchId:', userData?.branchId);
      
      if (userData?.branchId) {
        try {
          // Get branch name WHERE branchId === branches.doc.id
          console.log('🔍 Calling branchService.getBranch with ID:', userData.branchId);
          const branchInfo = await branchService.getBranch(userData.branchId, 'branchManager', userData.uid);
          console.log('📊 Branch info received:', branchInfo);
          console.log('📊 Branch info type:', typeof branchInfo);
          console.log('📊 Branch info keys:', branchInfo ? Object.keys(branchInfo) : 'null/undefined');
          
          if (branchInfo && branchInfo.name) {
            branchName = branchInfo.name;
            console.log('✅ Branch name found:', branchName);
          } else {
            console.warn('❌ Branch info found but no name property');
            console.log('Branch info structure:', branchInfo);
            console.log('Available properties:', branchInfo ? Object.keys(branchInfo) : 'none');
          }
        } catch (error) {
          console.error('❌ Error fetching branch name:', error);
          console.error('Error details:', error.message);
          console.error('Error stack:', error.stack);
          
          // Try alternative approach - direct Firestore query
          try {
            console.log('🔄 Trying alternative approach with direct Firestore query...');
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');
            
            const branchRef = doc(db, 'branches', userData.branchId);
            const branchDoc = await getDoc(branchRef);
            
            if (branchDoc.exists()) {
              const branchData = branchDoc.data();
              console.log('📊 Direct Firestore query result:', branchData);
              if (branchData.name) {
                branchName = branchData.name;
                console.log('✅ Branch name found via direct query:', branchName);
              }
            } else {
              console.warn('❌ Branch document does not exist');
            }
          } catch (directError) {
            console.error('❌ Direct Firestore query also failed:', directError);
          }
        }
      } else {
        console.warn('❌ No branchId found in userData');
        console.log('UserData structure:', userData);
      }
      
      console.log('📋 Final branch name for report:', branchName);
      
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
        
        // Get stylist details for the report
        let stylistDetails = 'No stylist assigned';
        let stylistType = 'any_available';
        
        if (appointment.serviceStylistPairs && appointment.serviceStylistPairs.length > 0) {
          const stylistNames = appointment.serviceStylistPairs.map(pair => {
            if (pair.stylistId === 'any_available') {
              return 'Any Available';
            } else {
              return getStylistName(pair.stylistId);
            }
          });
          stylistDetails = stylistNames.join(', ');
          
          // Check if any stylist is not "any_available"
          const hasSpecificStylist = appointment.serviceStylistPairs.some(pair => pair.stylistId !== 'any_available');
          stylistType = hasSpecificStylist ? 'specific' : 'any_available';
        }
      
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
          stylist: stylistDetails,
          stylistType: stylistType,
        status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
        revenue: `₱${estimatedRevenue.toLocaleString()}`
      };
      
      console.log('Generated appointment data:', appointmentData);
      return appointmentData;
    });
    
    console.log('Table data generated:', tableData);

    // Calculate stylist statistics
    const stylistStats = {
      specificStylists: 0,
      anyAvailable: 0,
      total: tableData.length
    };
    
    tableData.forEach(apt => {
      if (apt.stylistType === 'specific') {
        stylistStats.specificStylists++;
      } else if (apt.stylistType === 'any_available') {
        stylistStats.anyAvailable++;
      }
    });
    
    console.log('Stylist statistics:', stylistStats);

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
          <title>Appointments Report - Branch Appointments</title>
          <style>
            @page {
              margin: 0.5in;
              size: A4;
            }
            
            * {
              font-family: Arial, sans-serif;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .report-header {
              text-align: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #000;
            }
            .report-title {
              font-size: 18px;
              font-weight: bold;
              color: #000;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .report-subtitle {
              font-size: 12px;
              color: #000;
              margin-bottom: 10px;
            }
            .report-info-simple {
              margin-bottom: 15px;
              padding: 8px 0;
              border-bottom: 1px solid #000;
            }
            .info-row {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              font-size: 10px;
              line-height: 1.2;
            }
            .info-label {
              font-weight: bold;
              color: #000;
              margin-right: 5px;
            }
            .info-value {
              font-weight: normal;
              color: #000;
              margin-right: 15px;
            }
            .info-separator {
              color: #000;
              margin: 0 8px;
            }
            .summary-simple {
              margin: 10px 0;
              padding: 5px 0;
              border-top: 1px solid #000;
              font-size: 10px;
            }
            .summary-item {
              font-weight: normal;
              color: #000;
              margin-right: 15px;
            }
            .summary-separator {
              color: #000;
              margin: 0 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 10px;
            }
            th {
              background-color: #fff;
              color: #000;
              padding: 8px 6px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #000;
              font-size: 10px;
              text-transform: uppercase;
            }
            td {
              padding: 6px;
              border: 1px solid #000;
              vertical-align: top;
              font-size: 10px;
            }
            .status-badge {
              font-size: 9px;
              font-weight: normal;
              text-transform: capitalize;
              color: #000;
            }
            .service-tag {
              display: inline;
              color: #000;
              font-size: 9px;
              margin-right: 5px;
            }
            .revenue {
              font-weight: bold;
              color: #000;
              font-size: 10px;
            }
            .client-name {
              font-weight: bold;
              color: #000;
            }
            .date-time {
              color: #000;
              font-size: 9px;
            }
            .report-footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 9px;
              color: #000;
            }
            .report-footer p {
              margin: 3px 0;
            }
            .summary-stats {
              display: flex;
              justify-content: space-around;
              margin: 15px 0;
              padding: 10px 0;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
            }
            .stat-item {
              text-align: center;
            }
            .stat-number {
              font-size: 16px;
              font-weight: bold;
              color: #000;
            }
            .stat-label {
              font-size: 9px;
              color: #000;
              text-transform: uppercase;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="report-title">Branch Appointments Report</div>
            <div class="report-subtitle">Branch Manager Dashboard</div>
          </div>
          
          <div class="report-info-simple">
            <div class="info-row">
              <span class="info-label">Branch:</span>
              <span class="info-value">${branchName}</span>
              <span class="info-separator">|</span>
              <span class="info-label">Period:</span>
              <span class="info-value">${dateFrom && dateTo ? 
                `${new Date(dateFrom).toLocaleDateString('en-US', { 
                year: 'numeric', 
                  month: 'short', 
                day: 'numeric' 
                })} - ${new Date(dateTo).toLocaleDateString('en-US', { 
                year: 'numeric',
                  month: 'short', 
                  day: 'numeric' 
                })}` : 
                new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })
              }</span>
              <span class="info-separator">|</span>
              <span class="info-label">Generated by:</span>
              <span class="info-value">${userData?.firstName || 'Unknown'} ${userData?.lastName || 'User'}</span>
              <span class="info-separator">|</span>
              <span class="info-label">Records:</span>
              <span class="info-value">${filteredAppointments.length}</span>
            </div>
          </div>

          <div class="summary-stats">
            <div class="stat-item">
              <div class="stat-number">${filteredAppointments.length}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">₱${totalRevenue.toLocaleString()}</div>
              <div class="stat-label">Revenue</div>
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
                  <th style="width: 15%;">Client</th>
                  <th style="width: 12%;">Date & Time</th>
                  <th style="width: 25%;">Services</th>
                  <th style="width: 20%;">Stylist</th>
                  <th style="width: 8%;">Status</th>
                  <th style="width: 12%;">Revenue</th>
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
                    ).join(', ')}</div>
                  </td>
                  <td>
                    <div>${row.stylist}</div>
                    <div style="font-size: 9px; margin-top: 2px;">
                      ${row.stylistType === 'specific' ? 'Specific' : 'Any Available'}
                    </div>
                  </td>
                  <td>
                    <span class="status-badge">${row.status}</span>
                  </td>
                  <td class="revenue">${row.revenue}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary-simple">
            <span class="summary-item">Total: ${stylistStats.total} appointments</span>
            <span class="summary-separator">|</span>
            <span class="summary-item">Revenue: ₱${totalRevenue.toLocaleString()}</span>
            <span class="summary-separator">|</span>
            <span class="summary-item">Specific Stylists: ${stylistStats.specificStylists}</span>
            <span class="summary-separator">|</span>
            <span class="summary-item">Any Available: ${stylistStats.anyAvailable}</span>
          </div>
          
          <div class="report-footer">
            <p><strong>Salon Management System</strong></p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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
    exportToExcel(rows, `${stylist.replace(/\s+/g, "_")}_appointments.xlsx`);
  };

  // === Appointment Actions ===

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


  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Appointments Overview">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* === Summary Cards === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-full"><Calendar className="h-6 w-6 text-blue-600"/></div>
            <div>
              <p className="text-xs text-gray-500">
                {filteredAppointments.length !== appointmentsData.length ? 'Filtered Appointments' : (query || statusFilter !== 'All' || stylistFilter !== 'All' || serviceFilter !== 'All' || dateFrom || dateTo ? 'All Appointments' : 'Today\'s Appointments')}
                {filteredAppointments.length !== appointmentsData.length && (
                  <span className="text-blue-600 font-medium"> ({filteredAppointments.length} of {appointmentsData.length})</span>
                )}
              </p>
              <p className="text-2xl font-semibold text-center">{totalAppointments}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-full"><Calendar className="h-6 w-6 text-green-600"/></div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-center">{completed}</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-full"><Calendar className="h-6 w-6 text-red-600"/></div>
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
                <Filter className="h-4 w-4" /> Show All Appointments
                {(filteredAppointments.length !== appointmentsData.length || 
                  (dateFrom !== "" || dateTo !== "" || statusFilter !== "All" || stylistFilter !== "All" || serviceFilter !== "All" || query !== "")) && (
                  <span className="bg-white text-[#160B53] text-xs rounded-full px-2 py-1 ml-1 font-medium">
                    Active
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
                <option value="in_service">In Service</option>
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

        </div>
          </div>
        </Card>

        {/* === Filter Modal === */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={() => setIsFilterOpen(false)}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Filter className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Filter Appointments</h2>
                      <p className="text-white/80 text-sm mt-1">Refine your search with multiple filters</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    variant="ghost"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Active Filters Chips */}
              {(query || statusFilter !== "All" || stylistFilter !== "All" || serviceFilter !== "All" || dateFrom || dateTo) && (
                <div className="px-6 pt-4 pb-2 border-b border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500">Active Filters:</span>
                    {query && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        Search: "{query}"
                        <button onClick={() => setQuery("")} className="hover:bg-blue-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {statusFilter !== "All" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Status: {statusFilter}
                        <button onClick={() => setStatusFilter("All")} className="hover:bg-green-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {stylistFilter !== "All" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        Stylist: {getStylistName(stylistFilter)}
                        <button onClick={() => setStylistFilter("All")} className="hover:bg-purple-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {serviceFilter !== "All" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Service: {getServiceName(serviceFilter)}
                        <button onClick={() => setServiceFilter("All")} className="hover:bg-orange-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {(dateFrom || dateTo) && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                        Date: {dateFrom || 'Any'} - {dateTo || 'Any'}
                        <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="hover:bg-indigo-200 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Search */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Search className="h-4 w-4 text-[#160B53]" />
                    Search Client
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Type client name to search..." 
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all" 
                      value={query} 
                      onChange={e => setQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Calendar className="h-4 w-4 text-[#160B53]" />
                    Quick Date Filters
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { 
                        label: 'Today', 
                        action: () => { 
                          const today = new Date().toISOString().split('T')[0]; 
                          setDateFrom(today); 
                          setDateTo(today); 
                        } 
                      },
                      { 
                        label: 'This Week', 
                        action: () => { 
                          const today = new Date(); 
                          const dayOfWeek = today.getDay(); 
                          const weekStart = new Date(today); 
                          weekStart.setDate(today.getDate() - dayOfWeek); 
                          const weekEnd = new Date(weekStart); 
                          weekEnd.setDate(weekStart.getDate() + 6); 
                          setDateFrom(weekStart.toISOString().split('T')[0]); 
                          setDateTo(weekEnd.toISOString().split('T')[0]); 
                        } 
                      },
                      { 
                        label: 'This Month', 
                        action: () => { 
                          const today = new Date(); 
                          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); 
                          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); 
                          setDateFrom(monthStart.toISOString().split('T')[0]); 
                          setDateTo(monthEnd.toISOString().split('T')[0]); 
                        } 
                      },
                      { 
                        label: 'All Dates', 
                        action: () => { 
                          setDateFrom(""); 
                          setDateTo(""); 
                        } 
                      },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={preset.action}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#160B53] transition-all text-sm font-medium text-gray-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Clock className="h-4 w-4 text-[#160B53]" />
                    Custom Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">From Date</label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all" 
                        value={dateFrom} 
                        onChange={e => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1 font-medium">To Date</label>
                      <input 
                        type="date" 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all" 
                        value={dateTo} 
                        onChange={e => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <CheckCircle className="h-4 w-4 text-[#160B53]" />
                      Status
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all bg-white" 
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

                  {/* Stylist Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <User className="h-4 w-4 text-[#160B53]" />
                      Stylist
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all bg-white" 
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

                  {/* Service Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Scissors className="h-4 w-4 text-[#160B53]" />
                      Service
                    </label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#160B53] focus:border-[#160B53] transition-all bg-white" 
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
                </div>

                {/* Results Preview */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900">Results Preview</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredAppointments.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-between gap-3">
                  <Button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all"
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                    Clear All
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-all"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setIsFilterOpen(false)}
                      className="px-6 bg-[#160B53] text-white hover:bg-[#12094A] transition-all shadow-md"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === Action Tools Bar === */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => exportToExcel(filteredAppointments, "appointments_filtered.xlsx")} 
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] shadow-sm whitespace-nowrap"
              >
                <FileDown className="h-4 w-4"/> Export Excel
              </Button>
              <Button 
                onClick={() => exportCSV(filteredAppointments, "appointments.csv")}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap"
              >
                <FileText className="h-4 w-4"/> Export CSV
              </Button>
              <Button 
                onClick={() => printReport()}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm whitespace-nowrap"
              >
                <Printer className="h-4 w-4"/> Print Report
              </Button>
            </div>
          </div>
        </Card>

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
                       <span>Client</span>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span>Date & Time</span>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span>Services</span>
                     </th>
                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span>Status</span>
                     </th>
                     <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span>Revenue</span>
                     </th>
                     <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                       <span>Actions</span>
                     </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  console.log('🎯 RENDERING TABLE:');
                  console.log('filteredAppointments length:', filteredAppointments.length);
                  console.log('filteredAppointments:', filteredAppointments);
                  return null;
                })()}
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                     filteredAppointments.map((appointment, index) => {
                       const clientName = appointment.clientName || appointment.clientInfo?.name || 'Unknown';
                       
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

                                {/* View only - no actions for Branch Manager */}
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
           <div 
             className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
             onClick={() => setShowDetailsModal(false)}
           >
             <div 
               className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4" 
               onClick={(e) => e.stopPropagation()}
             >
               {/* Modal Header */}
               <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-2 bg-white/20 rounded-lg">
                       <Calendar className="h-6 w-6" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-bold">Appointment Details</h2>
                       <p className="text-white/80 text-sm mt-1">
                         {selectedAppointment.appointmentDate ? 
                           new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                             weekday: 'long',
                             year: 'numeric',
                             month: 'long',
                             day: 'numeric'
                           }) : 'Date not available'} at {selectedAppointment.appointmentTime || 'Time not available'}
                       </p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
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
                       variant="ghost"
                       className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                     >
                       <X className="h-5 w-5" />
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
                             {selectedAppointment.clientName || selectedAppointment.clientInfo?.name || 'Unknown'}
                           </span>
                         </div>
                         {(selectedAppointment.clientInfo?.phone || selectedAppointment.clientPhone) && (
                           <div className="flex justify-between items-center py-2 border-b border-gray-100">
                             <span className="font-medium text-gray-700">Phone:</span>
                             <span className="text-gray-600">{selectedAppointment.clientInfo?.phone || selectedAppointment.clientPhone}</span>
                           </div>
                         )}
                         {(selectedAppointment.clientInfo?.email || selectedAppointment.clientEmail) && (
                           <div className="flex justify-between items-center py-2">
                             <span className="font-medium text-gray-700">Email:</span>
                             <span className="text-gray-600">{selectedAppointment.clientInfo?.email || selectedAppointment.clientEmail}</span>
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
                             const stylistName = pair?.stylistId === 'any_available' ? 'No One Preferred' : (stylistInfo?.name || `Stylist ${pair?.stylistId ? pair.stylistId.slice(-4) : 'N/A'}`);
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
                                   {pair?.stylistId === 'any_available' ? (
                                     <div className="text-center py-4">
                                       <div className="text-gray-500 text-sm">No specific stylist assigned</div>
                                       <div className="text-gray-400 text-xs mt-1">Any available stylist will handle this service</div>
                                     </div>
                                   ) : (
                                     <>
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
                                     </>
                                   )}
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
                               </div>
                               
                               
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
               <div className="border-t border-gray-200 p-6 bg-gray-50">
                 <div className="flex justify-between items-center">
                   <div className="flex gap-2">
                     <Button
                       onClick={() => {
                         // Print single appointment details
                         const printWindow = window.open('', '_blank');
                         if (!printWindow) {
                           alert('Please allow pop-ups for this site to print.');
                           return;
                         }
                         
                        const printContent = `
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>Appointment Details - ${selectedAppointment.id}</title>
                            <style>
                              @page { margin: 1cm; size: A4; }
                              body { font-family: Arial, sans-serif; font-size: 11px; color: #000; }
                              .header { text-align: center; margin-bottom: 15px; border-bottom: 1px solid #000; padding-bottom: 8px; }
                              .header h1 { font-size: 16px; font-weight: bold; color: #000; margin: 5px 0; }
                              .header p { font-size: 10px; color: #000; margin: 2px 0; }
                              .section { margin-bottom: 12px; }
                              .section-title { font-weight: bold; color: #000; margin-bottom: 6px; font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 3px; }
                              .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ccc; }
                              .info-label { font-weight: bold; color: #000; }
                              .info-value { color: #000; }
                              table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
                              th, td { border: 1px solid #000; padding: 6px; text-align: left; }
                              th { background-color: #fff; color: #000; font-weight: bold; }
                              .total-row { font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            <div class="header">
                              <h1>Appointment Details</h1>
                              <p>Branch: ${branchData?.name || 'Unknown Branch'}</p>
                              <p>Generated: ${new Date().toLocaleString()}</p>
                            </div>
                            
                            <div class="section">
                              <div class="section-title">Client Information</div>
                              <div class="info-row">
                                <span class="info-label">Name:</span>
                                <span class="info-value">${selectedAppointment.clientName || selectedAppointment.clientInfo?.name || 'Unknown'}</span>
                              </div>
                              ${selectedAppointment.clientInfo?.phone || selectedAppointment.clientPhone ? `
                              <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span class="info-value">${selectedAppointment.clientInfo?.phone || selectedAppointment.clientPhone}</span>
                              </div>
                              ` : ''}
                              ${selectedAppointment.clientInfo?.email || selectedAppointment.clientEmail ? `
                              <div class="info-row">
                                <span class="info-label">Email:</span>
                                <span class="info-value">${selectedAppointment.clientInfo?.email || selectedAppointment.clientEmail}</span>
                              </div>
                              ` : ''}
                            </div>
                            
                            <div class="section">
                              <div class="section-title">Appointment Details</div>
                              <div class="info-row">
                                <span class="info-label">Date:</span>
                                <span class="info-value">${selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                              </div>
                              <div class="info-row">
                                <span class="info-label">Time:</span>
                                <span class="info-value">${selectedAppointment.appointmentTime || 'N/A'}</span>
                              </div>
                              <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="info-value">${selectedAppointment.status ? selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1) : 'Unknown'}</span>
                              </div>
                            </div>
                            
                            <div class="section">
                              <div class="section-title">Services & Pricing</div>
                              <table>
                                <thead>
                                  <tr>
                                    <th>Service</th>
                                    <th>Stylist</th>
                                    <th>Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  ${selectedAppointment.serviceStylistPairs && selectedAppointment.serviceStylistPairs.length > 0 ? 
                                    selectedAppointment.serviceStylistPairs.map(pair => `
                                      <tr>
                                        <td>${pair.serviceId ? getServiceName(pair.serviceId) : 'Unknown Service'}</td>
                                        <td>${pair.stylistId ? (pair.stylistId === 'any_available' ? 'Any Available' : getStylistName(pair.stylistId)) : 'Unassigned'}</td>
                                        <td>₱${pair.serviceId ? getServicePrice(pair.serviceId).toLocaleString() : '0'}</td>
                                      </tr>
                                    `).join('') : 
                                    '<tr><td colspan="3">No services</td></tr>'
                                  }
                                  <tr class="total-row">
                                    <td colspan="2">Total:</td>
                                    <td>₱${selectedAppointment.serviceStylistPairs ? selectedAppointment.serviceStylistPairs.reduce((sum, pair) => sum + (pair.serviceId ? getServicePrice(pair.serviceId) : 0), 0).toLocaleString() : '0'}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            ${selectedAppointment.notes ? `
                            <div class="section">
                              <div class="section-title">Notes</div>
                              <p style="color: #000; margin-top: 5px;">${selectedAppointment.notes}</p>
                            </div>
                            ` : ''}
                          </body>
                          </html>
                        `;
                         
                         printWindow.document.write(printContent);
                         printWindow.document.close();
                         printWindow.focus();
                         
                         setTimeout(() => {
                           printWindow.print();
                           printWindow.close();
                         }, 250);
                       }}
                       className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                     >
                       <Printer className="h-4 w-4"/> Print Details
                     </Button>
                   </div>
                   <Button
                     onClick={() => setShowDetailsModal(false)}
                     variant="outline"
                     className="border-gray-300 text-gray-700 hover:bg-gray-100"
                   >
                     Close
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
