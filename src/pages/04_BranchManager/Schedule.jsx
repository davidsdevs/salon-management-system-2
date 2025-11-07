// src/pages/04_BranchManager/Schedule.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { userService } from "../../services/userService";
import { scheduleService } from "../../services/scheduleService";

import {
  Users,
  User,
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
  ChevronLeft,
  ChevronRight,
  Receipt,
  Settings,
  Sun,
  Moon,
  Clock,
  Coffee,
  X,
} from "lucide-react";

import {
  startOfWeek,
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";

/**
 * BranchManagerSchedules - Availability-Based Scheduling System
 *
 * Features:
 * - AVAILABILITY-BASED: Staff are UNAVAILABLE by default unless explicitly scheduled
 * - Perfect for appointment booking: only scheduled staff appear as available
 * - Summary cards showing available vs unavailable slots
 * - Filter modal (search, role, branch, status, availability)
 * - View toggle: Daily / Weekly / Monthly
 * - Weekly view shows real dates (Mon..Sun), with Prev/Next navigation
 * - Click cells to set availability (e.g., MWF 9am-5pm)
 * - Bulk actions to make all staff available/unavailable for specific days
 * - Integration ready: Use isStaffAvailable(employeeId, dayOfWeek) for booking
 *
 * APPOINTMENT BOOKING INTEGRATION:
 * - Use isStaffAvailable(employeeId, dayOfWeek) to check if staff can be booked
 * - Only staff with schedules appear as available for appointments
 * - Schedules define exact availability windows (startTime, endTime)
 *
 * Keep your DashboardLayout, Card and Button components; this file expects them to exist.
 */

// Static days reference
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Default shift configuration for a day
const defaultShift = { dayOfWeek: "Monday", startTime: "09:00", endTime: "17:00", notes: "" };

// Availability status - by default, staff are UNAVAILABLE unless explicitly scheduled
const AVAILABILITY_STATUS = {
  UNAVAILABLE: 'unavailable',
  AVAILABLE: 'available'
};

// Utility function to format time in 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${minutes} ${ampm}`;
};

import { branchManagerMenuItems } from "./menuItems";

const BranchManagerSchedules = () => {
  const { userData } = useAuth();

  // Data states
  const [staffData, setStaffData] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // calendar view state
  const [view, setView] = useState("week"); // "daily" | "week" | "month"
  const [currentDate, setCurrentDate] = useState(new Date()); // used for week/day/month navigation

  // Modal state for configuring shifts
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeShifts, setEmployeeShifts] = useState([]); // All shifts for selected employee

  // Modal state for quick availability edit
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false);
  const [quickEditData, setQuickEditData] = useState({
    employeeId: null,
    dayOfWeek: null,
    startTime: '09:00',
    endTime: '17:00',
    notes: ''
  });

  // Modal state for CSV export
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    dateRange: 'all', // 'all', 'week', 'month', 'custom'
    customStartDate: '',
    customEndDate: '',
    staffFilter: 'all', // 'all', 'available', 'unavailable'
    dayFilter: 'all', // 'all', 'monday', 'tuesday', etc.
    shiftType: 'all' // 'all', 'morning', 'afternoon', 'evening', 'wholeDay'
  });


  // Load staff and schedules function
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userData?.branchId) {
        console.warn('⚠️ No branchId found in userData:', userData);
        setError('Branch ID not found. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('📅 Loading schedule data for branch:', userData.branchId);

      // Get all users assigned to this branch
      const users = await userService.getUsersByBranch(userData.branchId, userData.roles?.[0] || 'branchManager');
      console.log('👥 Fetched users:', users.length);
      
      // Filter to show only stylists in this branch
      const stylists = users.filter(user => 
        user.roles?.includes('stylist') && 
        user.branchId === userData.branchId &&
        user.isActive === true
      );
      
      console.log('✂️ Filtered stylists:', stylists.length);
      setStaffData(stylists);

      // Load schedules for this branch
      const branchSchedules = await scheduleService.getSchedulesByBranch(userData.branchId);
      console.log('📋 Fetched schedules:', branchSchedules.length);
      setSchedules(branchSchedules || []);
    } catch (err) {
      console.error('❌ Error loading schedule data:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        branchId: userData?.branchId,
        userRole: userData?.roles?.[0]
      });
      setError(err.message || 'Failed to load schedule data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  // Load staff and schedules on mount
  useEffect(() => {
    if (userData?.branchId) {
      loadData();
    } else {
      console.warn('⏳ Waiting for userData...', userData);
      setLoading(false);
    }
  }, [userData?.branchId]); // Only depend on branchId to avoid unnecessary re-renders

  // helpers
  const roles = useMemo(() => ["All", "stylist"], []);
  const branches = useMemo(() => ["All", ...Array.from(new Set(staffData.map(s => s.branchId)))], [staffData]);

  // filtered staff (now includes availability)
  const filteredStaff = useMemo(() => {
    return staffData.filter(s => {
      const fullName = `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim().toLowerCase();
      const matchesQuery = query === "" || fullName.includes(query.toLowerCase()) || (s.email || '').toLowerCase().includes(query.toLowerCase());
      
      const staffRole = s.roles?.includes('stylist') ? 'stylist' : s.role || 'stylist';
      const matchesRole = roleFilter === "All" || staffRole === roleFilter;
      
      const matchesBranch = branchFilter === "All" || s.branchId === branchFilter;
      const matchesStatus = statusFilter === "All" || (statusFilter === "Active" ? s.isActive : !s.isActive);

      // availability: If "Available" means no schedule on the selected period
      let matchesAvailability = true;
      if (availabilityFilter !== "All") {
        // Determine if staff has any schedule at all
        const staffId = s.uid || s.id;
        const hasAnySchedule = schedules.some(sc => sc.employeeId === staffId);
        if (availabilityFilter === "Available") matchesAvailability = !hasAnySchedule;
        if (availabilityFilter === "Busy") matchesAvailability = hasAnySchedule;
      }

      return matchesQuery && matchesRole && matchesBranch && matchesStatus && matchesAvailability;
    });
  }, [staffData, query, roleFilter, branchFilter, statusFilter, availabilityFilter, schedules]);

  // summary values
  const totalStaff = staffData.length;
  const scheduledCount = schedules.length;
  const availableSlots = schedules.length; // Only scheduled slots count as available
  const unavailableSlots = staffData.length * DAYS.length; // All slots are unavailable by default

  // Shift distribution statistics
  const shiftStats = useMemo(() => {
    const stats = {
      byDay: {},
      byShiftType: {
        morning: 0,    // 6am - 12pm
        afternoon: 0,  // 12pm - 6pm
        evening: 0,    // 6pm - 12am
        wholeDay: 0    // 8+ hours
      }
    };

    // Initialize day counts
    DAYS.forEach(day => {
      stats.byDay[day] = 0;
    });

    // Count shifts by day and type
    schedules.forEach(schedule => {
      const day = schedule.dayOfWeek;
      if (stats.byDay[day] !== undefined) {
        stats.byDay[day]++;
      }

      // Determine shift type based on start time and duration
      const startTime = schedule.startTime;
      const endTime = schedule.endTime;
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      const startMinute = parseInt(startTime.split(':')[1]);
      const endMinute = parseInt(endTime.split(':')[1]);
      
      // Calculate duration in hours (more accurate)
      const startTotalMinutes = startHour * 60 + startMinute;
      const endTotalMinutes = endHour * 60 + endMinute;
      const duration = (endTotalMinutes - startTotalMinutes) / 60;

      // Categorize shift types (shifts can be multiple types)
      if (startHour >= 6 && startHour < 12) {
        stats.byShiftType.morning++;
      }
      if (startHour >= 12 && startHour < 18) {
        stats.byShiftType.afternoon++;
      }
      if (startHour >= 18 || startHour < 6) {
        stats.byShiftType.evening++;
      }
      if (duration >= 8) {
        stats.byShiftType.wholeDay++;
      }
    });

    return stats;
  }, [schedules]);

  const roleCounts = useMemo(() => {
    const counts = {};
    staffData.forEach(s => (counts[s.role] = (counts[s.role] || 0) + 1));
    return counts;
  }, [staffData]);

  // schedule utilities
  // NOTE: schedules stored in legacy format: day = "Monday", etc.
  const getSchedule = (employeeId, dayOfWeek) => schedules.find(s => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek);
  
  // Check if staff is available on a specific day
  const isStaffAvailable = (employeeId, dayOfWeek) => {
    return getSchedule(employeeId, dayOfWeek) !== undefined;
  };


  // Configure weekly schedule for an employee (e.g., MWF 9am-6pm)
  const openConfigureSchedule = (employee) => {
    setSelectedEmployee(employee);
    
    // Load existing shifts if any
    const employeeId = employee.uid || employee.id;
    const existingSchedules = schedules.filter(s => s.employeeId === employeeId);
    if (existingSchedules.length > 0) {
      const loadedShifts = existingSchedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        notes: s.notes || ''
      }));
      setEmployeeShifts(loadedShifts);
    } else {
      // Start with no shifts - user adds what they want
      setEmployeeShifts([]);
    }
    
    setIsConfigModalOpen(true);
  };

  // Save shifts configuration
  const saveShifts = async () => {
    try {
      if (!selectedEmployee || !userData?.branchId) return;

      const employeeId = selectedEmployee.uid || selectedEmployee.id;
      
      // First, delete all existing shifts for this employee
      await scheduleService.deleteEmployeeSchedules(employeeId);

      // Then create the new shifts
      if (employeeShifts.length > 0) {
        await scheduleService.createWeeklySchedule(
          employeeId,
          userData.branchId,
          employeeShifts
        );
      }

      // Reload schedules
      const updatedSchedules = await scheduleService.getSchedulesByBranch(userData.branchId);
      setSchedules(updatedSchedules);
      
      setIsConfigModalOpen(false);
      setSelectedEmployee(null);
      alert('Shifts saved successfully!');
    } catch (error) {
      console.error('Error saving shifts:', error);
      alert('Failed to save shifts. Please try again.');
    }
  };

  // Delete a specific day's schedule
  const deleteDaySchedule = async (employeeId, dayOfWeek) => {
    try {
      if (!confirm("Delete this schedule?")) return;
      
      await scheduleService.deleteSchedulesByDay(employeeId, dayOfWeek);
      
      // Reload schedules
      const updatedSchedules = await scheduleService.getSchedulesByBranch(userData.branchId);
      setSchedules(updatedSchedules);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule.');
    }
  };

  // Open quick edit modal for availability
  const openQuickEditModal = (employeeId, day) => {
    const existing = getSchedule(employeeId, day);
    setQuickEditData({
      employeeId,
      dayOfWeek: day,
      startTime: existing?.startTime || '09:00',
      endTime: existing?.endTime || '17:00',
      notes: existing?.notes || ''
    });
    setIsQuickEditModalOpen(true);
  };

  // Save quick edit availability
  const saveQuickEditAvailability = () => {
    const { employeeId, dayOfWeek, startTime, endTime, notes } = quickEditData;
    
    if (!startTime || !endTime) {
      alert('Please enter both start and end times');
      return;
    }

    setSchedules(prev => {
      // remove old record for same employee+day (if any) then add
      const filtered = prev.filter(s => !(s.employeeId === employeeId && s.dayOfWeek === dayOfWeek));
      const newSchedule = {
        id: `s_${Date.now()}`,
        employeeId,
        dayOfWeek,
        startTime,
        endTime,
        notes,
      };
      return [...filtered, newSchedule];
    });
    
    setIsQuickEditModalOpen(false);
    setQuickEditData({
      employeeId: null,
      dayOfWeek: null,
      startTime: '09:00',
      endTime: '17:00',
      notes: ''
    });
  };

  // Remove availability
  const removeAvailability = (employeeId, day) => {
    if (!confirm("Remove availability for this day?")) return;
    setSchedules(prev => prev.filter(s => !(s.employeeId === employeeId && s.dayOfWeek === day)));
  };

  const removeSchedule = (employeeId, day) => {
    if (!confirm("Remove availability for this day?")) return;
    setSchedules(prev => prev.filter(s => !(s.employeeId === employeeId && s.dayOfWeek === day)));
  };

  // Filter data for export based on selected filters
  const getFilteredDataForExport = () => {
    let filteredSchedules = [...schedules];
    let filteredStaff = [...staffData];

    // Filter by staff availability
    if (exportFilters.staffFilter === 'available') {
      const availableStaffIds = new Set(schedules.map(s => s.employeeId));
      filteredStaff = staffData.filter(s => availableStaffIds.has(s.uid || s.id));
      filteredSchedules = schedules.filter(s => availableStaffIds.has(s.employeeId));
    } else if (exportFilters.staffFilter === 'unavailable') {
      const availableStaffIds = new Set(schedules.map(s => s.employeeId));
      filteredStaff = staffData.filter(s => !availableStaffIds.has(s.uid || s.id));
      filteredSchedules = []; // No schedules for unavailable staff
    }

    // Filter by day
    if (exportFilters.dayFilter !== 'all') {
      filteredSchedules = filteredSchedules.filter(s => 
        s.dayOfWeek.toLowerCase() === exportFilters.dayFilter.toLowerCase()
      );
    }

    // Filter by shift type
    if (exportFilters.shiftType !== 'all') {
      filteredSchedules = filteredSchedules.filter(s => {
        const startHour = parseInt(s.startTime.split(':')[0]);
        const endHour = parseInt(s.endTime.split(':')[0]);
        const duration = endHour - startHour;

        switch (exportFilters.shiftType) {
          case 'morning':
            return startHour >= 6 && startHour < 12;
          case 'afternoon':
            return startHour >= 12 && startHour < 18;
          case 'evening':
            return startHour >= 18 || startHour < 6;
          case 'wholeDay':
            return duration >= 8;
          default:
            return true;
        }
      });
    }

    return { filteredSchedules, filteredStaff };
  };

  // export CSV with filters
  const exportFilteredCSV = () => {
    const { filteredSchedules, filteredStaff } = getFilteredDataForExport();
    
    if (!filteredSchedules.length && exportFilters.staffFilter !== 'unavailable') {
      alert("No data to export with current filters.");
      return;
    }

    const header = ["Employee Name", "Role", "Day", "Start Time", "End Time", "Duration (Hours)", "Notes"];
    const csv = [
      header.join(","),
      ...filteredSchedules.map(r => {
        const emp = filteredStaff.find(s => (s.uid || s.id) === r.employeeId);
        const name = emp ? `${emp.firstName || ''} ${emp.middleName || ''} ${emp.lastName || ''}`.trim() : "Unknown";
        const role = emp ? (emp.roles?.includes('stylist') ? 'Stylist' : emp.role || 'Staff') : 'Unknown';
        
        // Calculate duration
        const startHour = parseInt(r.startTime.split(':')[0]);
        const endHour = parseInt(r.endTime.split(':')[0]);
        const duration = endHour - startHour;
        
        return [
          `"${name}"`,
          `"${role}"`,
          r.dayOfWeek,
          formatTime12Hour(r.startTime),
          formatTime12Hour(r.endTime),
          duration,
          `"${(r.notes || "").replace(/"/g, '""')}"`
        ].join(",");
      }),
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedules_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExportModalOpen(false);
  };

  // Open print page in new window
  const openPrintPage = async () => {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    // Get current week period
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = addDays(weekStart, 6); // Sunday
    const weekPeriod = `${format(weekStart, "MMM dd")} - ${format(weekEnd, "MMM dd, yyyy")}`;
    
    // Get current date and time
    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Get generator name
    const generatorName = userData?.firstName && userData?.lastName 
      ? `${userData.firstName} ${userData.lastName}`.trim()
      : userData?.name || 'Unknown User';
    
    // Get branch name from branches collection
    let branchName = 'Branch Name Not Available';
    try {
      const { getFirestore, doc, getDoc } = await import('firebase/firestore');
      const db = getFirestore();
      const branchDoc = await getDoc(doc(db, 'branches', userData.branchId));
      if (branchDoc.exists()) {
        branchName = branchDoc.data().name || 'Branch Name Not Available';
      }
    } catch (error) {
      console.error('Error fetching branch name:', error);
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Schedule - Print</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 0.5in;
          }
          
          body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid black;
            padding-bottom: 15px;
          }
          
          .print-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            color: black;
          }
          
          .print-subtitle {
            font-size: 18px;
            font-weight: 500;
            color: black;
            margin-bottom: 15px;
          }
          
          .print-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: black;
            margin-bottom: 10px;
          }
          
          .print-info-left {
            text-align: left;
          }
          
          .print-info-right {
            text-align: right;
          }
          
          .print-info-item {
            margin-bottom: 3px;
          }
          
          .print-info-label {
            font-weight: 600;
            color: black;
          }
          
          .print-calendar {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            font-size: 12px;
            font-family: 'Poppins', sans-serif;
          }
          
          .print-calendar th,
          .print-calendar td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
            vertical-align: top;
          }
          
          .print-calendar th {
            background: #f0f0f0;
            font-weight: 600;
            font-size: 14px;
            color: black;
          }
          
          .print-calendar .staff-name {
            font-weight: 600;
            text-align: left;
            background: #f8f8f8;
            width: 150px;
            color: black;
          }
          
          .print-calendar .available {
            background: white;
            font-size: 11px;
            padding: 4px;
            color: black;
          }
          
          .print-calendar .unavailable {
            background: #f5f5f5;
            font-size: 11px;
            color: black;
            padding: 4px;
          }
          
          .print-calendar .time-display {
            font-weight: 600;
            margin-bottom: 2px;
            color: black;
          }
          
          .print-calendar .notes {
            font-size: 10px;
            color: black;
            font-style: italic;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: 'Poppins', sans-serif;
            }
            
            .print-header {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .print-title {
              font-size: 24px;
              font-weight: 700;
            }
            
            .print-subtitle {
              font-size: 16px;
              font-weight: 500;
            }
            
            .print-info {
              font-size: 10px;
            }
            
            .print-calendar {
              font-size: 10px;
              font-family: 'Poppins', sans-serif;
            }
            
            .print-calendar th,
            .print-calendar td {
              padding: 4px;
            }
            
            .print-calendar th {
              font-weight: 600;
            }
            
            .print-calendar .staff-name {
              font-weight: 600;
            }
            
            .print-calendar .time-display {
              font-weight: 600;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">Staff Schedule</div>
          <div class="print-subtitle">${branchName}</div>
          <div class="print-info">
            <div class="print-info-left">
              <div class="print-info-item">
                <span class="print-info-label">Week Period:</span> ${weekPeriod}
              </div>
              <div class="print-info-item">
                <span class="print-info-label">Generated by:</span> ${generatorName}
              </div>
            </div>
            <div class="print-info-right">
              <div class="print-info-item">
                <span class="print-info-label">Generated on:</span> ${generatedAt}
              </div>
              <div class="print-info-item">
                <span class="print-info-label">Month:</span> ${format(currentDate, "MMMM yyyy")}
              </div>
            </div>
          </div>
        </div>
        
        <table class="print-calendar">
          <thead>
            <tr>
              <th class="staff-name">Staff Member</th>
              ${DAYS.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${staffData.map(staff => {
              const fullName = `${staff.firstName || ''} ${staff.middleName || ''} ${staff.lastName || ''}`.trim() || staff.name || 'Unknown';
              return `
                <tr>
                  <td class="staff-name">${fullName}</td>
                  ${DAYS.map(day => {
                    const schedule = getSchedule(staff.uid || staff.id, day);
                    if (schedule) {
                      return `
                        <td class="available">
                          <div class="time-display">${formatTime12Hour(schedule.startTime)} - ${formatTime12Hour(schedule.endTime)}</div>
                          ${schedule.notes ? `<div class="notes">${schedule.notes}</div>` : ''}
                        </td>
                      `;
                    } else {
                      return `<td class="unavailable">Unavailable</td>`;
                    }
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <script>
          // Auto-print when page loads
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Legacy export function for backward compatibility
  const exportCSV = (rows = schedules, filename = "schedules.csv") => {
    if (!rows.length) {
      alert("No data to export.");
      return;
    }
    const header = ["Employee", "Day", "Start", "End", "Notes"];
    const csv = [
      header.join(","),
      ...rows.map(r => {
        const emp = staffData.find(s => (s.uid || s.id) === r.employeeId);
        const name = emp ? `${emp.firstName} ${emp.middleName} ${emp.lastName}`.trim() : "Unknown";
        return [`"${name}"`, r.dayOfWeek, r.startTime, r.endTime, `"${(r.notes || "").replace(/"/g, '""')}"`].join(",");
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // calendar helpers
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // navigation helpers
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevMonth = () => setCurrentDate(addDays(currentDate, -30));
  const nextMonth = () => setCurrentDate(addDays(currentDate, 30));
  const prevDay = () => setCurrentDate(addDays(currentDate, -1));
  const nextDay = () => setCurrentDate(addDays(currentDate, 1));
  const formatDate = (date, fmt = "MMM dd") => format(date, fmt);

  // quick toggle: if no schedule -> create default available schedule; if schedule exists -> open edit
  const toggleStatus = (employeeId, day) => {
    const sc = getSchedule(employeeId, day);
    if (sc) {
      upsertSchedule(employeeId, day);
    } else {
      setSchedules(prev => [...prev, { 
        id: `s_${Date.now()}`, 
        employeeId, 
        dayOfWeek: day, 
        startTime: "09:00", 
        endTime: "17:00", 
        notes: "" 
      }]);
    }
  };

  // Add bulk schedule creation for all staff
  const addBulkSchedule = (day, startTime = "09:00", endTime = "17:00") => {
    const newSchedules = filteredStaff.map(staff => ({
      id: `s_${Date.now()}_${staff.uid || staff.id}`,
      employeeId: staff.uid || staff.id,
      dayOfWeek: day,
      startTime: startTime,
      endTime: endTime,
      notes: "Bulk scheduled"
    }));
    
    setSchedules(prev => {
      // Remove existing schedules for this day first
      const filtered = prev.filter(s => s.dayOfWeek !== day);
      return [...filtered, ...newSchedules];
    });
  };

  // Render headers for weekly view - user asked Monday labels bold and text-center
  const renderWeeklyHeaderDates = () =>
    weekDates.map(date => {
      const dayShort = format(date, "EEE"); // Mon, Tue...
      const dayFull = format(date, "EEEE"); // Monday
      const dateLabel = format(date, "MMM dd");
      // Bold and centered for Monday specifically (and keep consistent center for others)
      const isMonday = dayFull === "Monday";
      return (
        <th
          key={date.toISOString()}
          className={`px-6 py-3 text-center text-xs font-medium ${isMonday ? "font-bold" : ""} text-gray-500 uppercase tracking-wider`}
        >
          <div>{dayShort}</div>
          <div className="text-xs text-gray-400">{dateLabel}</div>
        </th>
      );
    });

  // Quick edit state for inline editing
  const [quickEditCell, setQuickEditCell] = useState(null); // { employeeId, dayOfWeek }

  // Handle quick shift edit (3-click principle)
  const handleQuickEdit = (employeeId, dayOfWeek) => {
    setQuickEditCell({ employeeId, dayOfWeek });
  };

  // Save quick edit
  const saveQuickEdit = async (startTime, endTime, employeeId) => {
    try {
      if (!userData?.branchId) return;

      // If clearing (empty times), delete the schedule
      if (!startTime || !endTime) {
        await scheduleService.deleteSchedulesByDay(employeeId, quickEditCell.dayOfWeek);
      } else {
        // Create or update the schedule
        await scheduleService.upsertSchedule({
          employeeId: employeeId,
          branchId: userData.branchId,
          dayOfWeek: quickEditCell.dayOfWeek,
          startTime,
          endTime,
          notes: ''
        });
      }

      // Reload schedules
      const updatedSchedules = await scheduleService.getSchedulesByBranch(userData.branchId);
      setSchedules(updatedSchedules);
      setQuickEditCell(null);
      alert('Shift updated successfully!');
    } catch (error) {
      console.error('Error saving quick edit:', error);
      alert('Failed to save. Please try again.');
    }
  };

  // Weekly body: click cells to edit directly (3-click principle)
  const renderWeeklyBody = () => (
    <>
      {filteredStaff.map(staff => {
        const fullName = `${staff.firstName || ''} ${staff.middleName || ''} ${staff.lastName || ''}`.trim() || staff.name || 'Unknown';
        return (
                     <tr key={staff.uid || staff.id} className="hover:bg-gray-50 transition-colors">
             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
               <div className="flex items-center gap-3">
                 <div className="relative">
                   {staff.profileUrl ? (
                     <img 
                       src={staff.profileUrl} 
                       alt={fullName}
                       className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                       onError={(e) => {
                         e.target.style.display = 'none';
                         e.target.nextSibling.style.display = 'flex';
                       }}
                     />
                   ) : null}
                   <div 
                     className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200 ${staff.profileUrl ? 'hidden' : 'flex'}`}
                   >
                     {fullName.charAt(0).toUpperCase()}
                   </div>
                 </div>
                 <div className="flex-1">
                   <div className="font-medium text-gray-900">{fullName}</div>
                   <div className="text-xs text-gray-500">{staff.roles?.includes('stylist') ? 'Stylist' : staff.role || 'Staff'}</div>
                   <div className="flex gap-2 mt-1">
                     <button
                 onClick={() => openConfigureSchedule(staff)}
                       className="text-xs text-[#160B53] hover:text-[#12094A] underline"
                     >
                       Configure
                     </button>
                   </div>
                 </div>
               </div>
             </td>

          {weekDates.map(d => {
            const dayName = format(d, "EEEE");
            const staffId = staff.uid || staff.id;
              const sc = getSchedule(staffId, dayName);
              const isEditing = quickEditCell?.employeeId === staffId && quickEditCell?.dayOfWeek === dayName;
              
            return (
                <td key={`${staff.uid || staff.id}-${dayName}`} className="px-3 py-3">
                  {isEditing ? (
                    <div className="space-y-2 p-2 bg-blue-50 rounded-lg border-2 border-blue-300">
                      <input
                        type="time"
                        defaultValue={sc?.startTime || '09:00'}
                        className="w-full text-xs border rounded px-2 py-1"
                        placeholder="Start"
                        autoFocus
                      />
                      <input
                        type="time"
                        defaultValue={sc?.endTime || '17:00'}
                        className="w-full text-xs border rounded px-2 py-1"
                        placeholder="End"
                      />
                                             <div className="flex gap-1">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             const inputs = e.target.closest('.space-y-2').querySelectorAll('input[type="time"]');
                             const start = inputs[0].value;
                             const end = inputs[1].value;
                             saveQuickEdit(start, end, quickEditCell.employeeId);
                           }}
                           className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                         >
                           ✓
                         </button>
                        <button
                          onClick={() => setQuickEditCell(null)}
                          className="flex-1 px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                        onClick={() => openQuickEditModal(staff.uid || staff.id, dayName)}
                        className={`transition-all hover:scale-105 px-3 py-2 rounded-lg text-xs text-center w-full inline-block border-2 whitespace-nowrap ${
                            sc 
                            ? "bg-green-100 text-green-900 border-green-300 hover:bg-green-200 font-medium cursor-pointer" 
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 cursor-pointer"
                        }`}
                        title={
                            sc 
                            ? `Available: ${formatTime12Hour(sc.startTime)} - ${formatTime12Hour(sc.endTime)}${sc.notes ? ` — ${sc.notes}` : ""} | Click to edit` 
                            : "Unavailable - Click to set availability"
                        }
                    >
                      {sc ? (
                          <div className="font-semibold text-green-800 whitespace-nowrap">{formatTime12Hour(sc.startTime)} - {formatTime12Hour(sc.endTime)}</div>
                      ) : (
                          <div className="text-red-600 font-medium whitespace-nowrap">Unavailable</div>
                      )}
                </div>
                  )}
              </td>
            );
          })}
          
        </tr>
        );
      })}
    </>
  );

  // Daily view: card-per-stylist; clicking the body toggles edit/creates schedule
  const renderDailyView = () => {
    const dayName = format(currentDate, "EEEE");
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">{format(currentDate, "EEEE, MMMM d, yyyy")}</h3>
            <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-500">{format(currentDate, "MMM dd, yyyy")}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaff.map(stylist => {
            const sc = getSchedule(stylist.id, dayName);
            return (
              <div key={stylist.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#160B53] flex items-center justify-center text-white font-bold text-lg">
                    {stylist.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{stylist.name}</h4>
                    <div className="text-sm text-gray-500">{stylist.role}</div>
                  </div>
                </div>

                {sc ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openQuickEditModal(stylist.uid || stylist.id, dayName)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") openQuickEditModal(stylist.uid || stylist.id, dayName);
                    }}
                    className="p-4 rounded-lg border-2 bg-green-100 text-green-800 border-green-200 cursor-pointer"
                    title={`Available: ${formatTime12Hour(sc.startTime)} - ${formatTime12Hour(sc.endTime)}${sc.notes ? ` — ${sc.notes}` : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium whitespace-nowrap">{formatTime12Hour(sc.startTime)} - {formatTime12Hour(sc.endTime)}</span>
                      </div>
                      <div className="text-xs text-gray-500">Tap to edit</div>
                    </div>
                    {sc.notes && <div className="text-xs text-gray-600 mt-2 p-2 bg-white bg-opacity-50 rounded">{sc.notes}</div>}
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openQuickEditModal(stylist.uid || stylist.id, dayName)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") openQuickEditModal(stylist.uid || stylist.id, dayName);
                    }}
                    className="p-4 rounded-lg border-2 bg-red-100 text-red-800 border-red-200 cursor-pointer"
                    title="Unavailable - click to set availability"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">Unavailable</span>
                      </div>
                      <div className="text-xs text-gray-500">Tap to set availability</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">Not scheduled</div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button onClick={() => openQuickEditModal(stylist.uid || stylist.id, dayName)} className="flex-1 px-3 py-2 text-sm bg-[#160B53] text-white rounded-lg">
                    {sc ? 'Edit Availability' : 'Set Availability'}
                  </button>
                  {sc && <button onClick={() => removeAvailability(stylist.uid || stylist.id, dayName)} className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg">Remove</button>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Monthly view builds a simple calendar grid; legacy schedules matched by weekday name
  const renderMonthlyView = () => {
    const firstOfMonth = startOfMonth(currentDate);
    const lastOfMonth = endOfMonth(currentDate);

    const calendarStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });
    const calendarEnd = addDays(lastOfMonth, (7 - getDay(lastOfMonth || 0)) % 7);

    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // build weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold text-gray-900">{format(currentDate, "MMMM yyyy")}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">{format(currentDate, "MMMM yyyy")}</div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-orange-600">✅</span>
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-600">⏳</span>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-red-600">❌</span>
                <span>Denied</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map(day => {
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                    return (
                      <td key={day.toISOString()} className={`border p-3 align-top ${isCurrentMonth ? "" : "bg-gray-50 text-gray-400"}`}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{format(day, "d")}</div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          {/* Schedule information can be displayed here */}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // main render: keep your UI and add toggles, nav, filters
  if (loading) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Schedule Management">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#160B53]"></div>
              <p className="text-gray-600">Loading schedule data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Schedule Management">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-red-500 text-center">
                <p className="text-lg font-semibold">Error Loading Schedule Data</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Schedule Management">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-blue-50 rounded-full">
      <Users className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Total Staff</p>
      <p className="text-2xl font-semibold text-center">{totalStaff}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-green-50 rounded-full">
      <Calendar className="h-6 w-6 text-green-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Available Shifts</p>
      <p className="text-2xl font-semibold text-center">{availableSlots}</p>
    </div>
  </Card>

  <Card className="bg-white p-4 flex items-center gap-4 shadow-sm border border-gray-200">
    <div className="p-3 bg-red-50 rounded-full">
      <XCircle className="h-6 w-6 text-red-600" />
    </div>
    <div>
      <p className="text-xs text-gray-500">Unavailable Slots</p>
      <p className="text-2xl font-semibold text-center">{unavailableSlots - availableSlots}</p>
    </div>
  </Card>
</div>

        {/* Shift Distribution Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Shifts by Day
            </h3>
            <div className="space-y-2">
              {DAYS.slice(0, 4).map(day => (
                <div key={day} className="flex justify-between text-xs items-center">
                  <span className="text-gray-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    {day.slice(0, 3)}
                  </span>
                  <span className="font-medium text-gray-900">{shiftStats.byDay[day] || 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Shifts by Day (Cont.)
            </h3>
            <div className="space-y-2">
              {DAYS.slice(4).map(day => (
                <div key={day} className="flex justify-between text-xs items-center">
                  <span className="text-gray-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    {day.slice(0, 3)}
                  </span>
                  <span className="font-medium text-gray-900">{shiftStats.byDay[day] || 0}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Shift Types
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Sun className="h-3 w-3 text-orange-500" />
                  Morning
                </span>
                <span className="font-medium text-orange-600">{shiftStats.byShiftType.morning}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Coffee className="h-3 w-3 text-blue-500" />
                  Afternoon
                </span>
                <span className="font-medium text-blue-600">{shiftStats.byShiftType.afternoon}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Moon className="h-3 w-3 text-purple-500" />
                  Evening
                </span>
                <span className="font-medium text-purple-600">{shiftStats.byShiftType.evening}</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Special Shifts
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-green-500" />
                  Whole Day
                </span>
                <span className="font-medium text-green-600">{shiftStats.byShiftType.wholeDay}</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <BarChart3 className="h-3 w-3 text-gray-500" />
                  Total Shifts
                </span>
                <span className="font-medium text-gray-900">{scheduledCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter + Actions */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="h-4 w-4" /> Filter
            </Button>

            <input
              placeholder="Search staff..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="border rounded-md px-3 py-2"
            />
          </div>

          <div className="flex gap-2">
             <Button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A] transition-colors">
               <FileDown className="h-4 w-4" /> Export CSV
            </Button>
             <Button onClick={openPrintPage} className="flex items-center gap-1 border bg-white text-gray-700">
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
        </div>

        {/* Filter Modal */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg p-6 w-96 max-w-full">
              <h2 className="text-lg font-semibold mb-4">Filter Staff</h2>

              <input
                type="text"
                placeholder="Search name..."
                className="border rounded-md p-2 mb-3 w-full"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />

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

              <select
                className="border rounded-md p-2 mb-3 w-full"
                value={availabilityFilter}
                onChange={e => setAvailabilityFilter(e.target.value)}
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("All");
                    setBranchFilter("All");
                    setStatusFilter("All");
                    setAvailabilityFilter("All");
                  }}
                >
                  Reset
                </Button>
                <Button className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors" onClick={() => setIsFilterOpen(false)}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}

                 {/* Configuration Modal */}
         {isConfigModalOpen && selectedEmployee && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
             <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
               {/* Modal Header */}
               <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-2 bg-white/20 rounded-lg">
                       <Calendar className="h-6 w-6" />
                     </div>
                     <div>
                       <h2 className="text-2xl font-bold">Configure Staff Availability</h2>
                       <p className="text-white/80 text-sm mt-1">
                         {selectedEmployee.firstName} {selectedEmployee.lastName}
                       </p>
                     </div>
                   </div>
                   <Button
                     variant="ghost"
                     onClick={() => {
                       setIsConfigModalOpen(false);
                       setSelectedEmployee(null);
                       setEmployeeShifts([]);
                     }}
                     className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                   >
                     <X className="h-5 w-5" />
                   </Button>
                 </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6">
               <div className="flex items-center gap-4 mb-6">
                 <div className="relative">
                   {selectedEmployee.profileUrl ? (
                     <img 
                       src={selectedEmployee.profileUrl} 
                       alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                       className="w-16 h-16 rounded-full object-cover border-3 border-gray-300 shadow-md"
                       onError={(e) => {
                         e.target.style.display = 'none';
                         e.target.nextSibling.style.display = 'flex';
                       }}
                     />
                   ) : null}
                   <div 
                     className={`w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl border-3 border-gray-300 shadow-md ${selectedEmployee.profileUrl ? 'hidden' : 'flex'}`}
                   >
                     {selectedEmployee.firstName?.charAt(0).toUpperCase() || 'S'}
                   </div>
                 </div>
                 <div>
                   <h2 className="text-xl font-bold text-gray-900">Configure Staff Availability</h2>
                   <p className="text-gray-600">
                     <strong>{selectedEmployee.firstName} {selectedEmployee.lastName}</strong>
                     {selectedEmployee.roles?.includes('stylist') && (
                       <span className="ml-2 text-sm text-gray-500">• Stylist</span>
                     )}
                   </p>
                   <p className="text-sm text-gray-500 mt-1">Set which days and times this staff member is available for appointments</p>
                 </div>
               </div>

              {employeeShifts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No availability configured yet. Staff is unavailable by default.</p>
                  <p className="text-sm mt-2">Click "Add Availability" below to set when this staff member is available.</p>
                </div>
              )}

              <div className="space-y-4">
                {employeeShifts.map((shift, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                        <select
                          value={shift.dayOfWeek}
                          onChange={(e) => {
                            const updated = [...employeeShifts];
                            updated[index].dayOfWeek = e.target.value;
                            setEmployeeShifts(updated);
                          }}
                          className="w-full border rounded-md px-3 py-2"
                        >
                          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            const updated = employeeShifts.filter((_, i) => i !== index);
                            setEmployeeShifts(updated);
                          }}
                          className="mt-6 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          value={shift.startTime}
                          onChange={(e) => {
                            const updated = [...employeeShifts];
                            updated[index].startTime = e.target.value;
                            setEmployeeShifts(updated);
                          }}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                          type="time"
                          value={shift.endTime}
                          onChange={(e) => {
                            const updated = [...employeeShifts];
                            updated[index].endTime = e.target.value;
                            setEmployeeShifts(updated);
                          }}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                      <input
                        type="text"
                        value={shift.notes}
                        onChange={(e) => {
                          const updated = [...employeeShifts];
                          updated[index].notes = e.target.value;
                          setEmployeeShifts(updated);
                        }}
                        placeholder="e.g., Morning shift, Special notes"
                        className="w-full border rounded-md px-3 py-2"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setEmployeeShifts([...employeeShifts, { ...defaultShift }])}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#160B53] text-gray-600 hover:text-[#160B53] flex items-center justify-center gap-2"
                >
                  <span className="text-xl">+</span>
                  Add Availability
                </button>
              </div>

              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsConfigModalOpen(false);
                      setSelectedEmployee(null);
                      setEmployeeShifts([]);
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveShifts}
                    className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                  >
                    Save Availability
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BULK ACTIONS */}
        {view === "week" && (
          <Card className="p-4 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Availability Actions</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    const day = prompt("Enter day to make all staff available (e.g., Monday, Tuesday, etc.)", "Monday");
                    if (day) addBulkSchedule(day);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                >
                  <Calendar className="h-4 w-4" />
                  Make All Available
                </Button>
                <Button 
                  onClick={() => {
                    const day = prompt("Enter day to make all staff unavailable", "Monday");
                    if (day) {
                      setSchedules(prev => prev.filter(s => s.dayOfWeek !== day));
                    }
                  }}
                  className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4" />
                  Make All Unavailable
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* VIEW TOGGLE + NAV */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
            className={`${
                view === "daily"
                ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => setView("daily")}
            >
            Daily
            </Button>
           <Button
  className={`${
    view === "week"
      ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
      : "bg-gray-100 hover:bg-gray-200"
  }`}
  onClick={() => setView("week")}
>
  Weekly
</Button>

<Button
  className={`${
    view === "month"
      ? "bg-[#160B53] text-white hover:bg-[#160B53] hover:text-white"
      : "bg-gray-100 hover:bg-gray-200"
  }`}
  onClick={() => setView("month")}
>
  Monthly
</Button>
          </div>

          {view === "week" && (
            <div className="flex items-center gap-2">
              <Button onClick={prevWeek}><ChevronLeft /></Button>
              <div className="text-sm text-gray-600">{formatDate(weekDates[0])} - {formatDate(weekDates[6])}</div>
              <Button onClick={nextWeek}><ChevronRight /></Button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        {view === "week" && (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    {renderWeeklyHeaderDates()}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={weekDates.length + 1} className="px-6 py-8 text-center text-gray-500">No staff found.</td>
                    </tr>
                  ) : (
                    renderWeeklyBody()
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {view === "daily" && (
          <Card>
            <div className="p-4">
              {renderDailyView()}
            </div>
          </Card>
        )}

        {view === "month" && (
          <Card>
            <div className="p-4">
              {renderMonthlyView()}
            </div>
          </Card>
        )}

        {/* Quick Edit Availability Modal */}
        {isQuickEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-96 max-w-md overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {getSchedule(quickEditData.employeeId, quickEditData.dayOfWeek) ? 'Edit Availability' : 'Set Availability'}
                      </h2>
                      <p className="text-white/80 text-sm mt-1">
                        {quickEditData.dayOfWeek} - {staffData.find(s => (s.uid || s.id) === quickEditData.employeeId)?.firstName || 'Staff'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsQuickEditModalOpen(false);
                      setQuickEditData({
                        employeeId: null,
                        dayOfWeek: null,
                        startTime: '09:00',
                        endTime: '17:00',
                        notes: ''
                      });
                    }}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={quickEditData.startTime}
                      onChange={(e) => setQuickEditData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      value={quickEditData.endTime}
                      onChange={(e) => setQuickEditData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={quickEditData.notes}
                      onChange={(e) => setQuickEditData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="e.g., Morning shift, Special notes"
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    />
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsQuickEditModalOpen(false);
                      setQuickEditData({
                        employeeId: null,
                        dayOfWeek: null,
                        startTime: '09:00',
                        endTime: '17:00',
                        notes: ''
                      });
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveQuickEditAvailability}
                    className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                  >
                    {getSchedule(quickEditData.employeeId, quickEditData.dayOfWeek) ? 'Update' : 'Set Available'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CSV Export Modal */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-96 max-w-md overflow-hidden flex flex-col transform transition-all duration-300 scale-100 mx-4">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileDown className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Export Schedule Data</h2>
                      <p className="text-white/80 text-sm mt-1">Choose filters for your CSV export</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setIsExportModalOpen(false)}
                    className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Filter</label>
                    <select
                      value={exportFilters.staffFilter}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, staffFilter: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    >
                      <option value="all">All Staff</option>
                      <option value="available">Available Staff Only</option>
                      <option value="unavailable">Unavailable Staff Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Day Filter</label>
                    <select
                      value={exportFilters.dayFilter}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, dayFilter: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    >
                      <option value="all">All Days</option>
                      {DAYS.map(day => (
                        <option key={day} value={day.toLowerCase()}>{day}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                    <select
                      value={exportFilters.shiftType}
                      onChange={(e) => setExportFilters(prev => ({ ...prev, shiftType: e.target.value }))}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#160B53]"
                    >
                      <option value="all">All Shift Types</option>
                      <option value="morning">Morning Shifts (6 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon Shifts (12 PM - 6 PM)</option>
                      <option value="evening">Evening Shifts (6 PM - 12 AM)</option>
                      <option value="wholeDay">Whole Day Shifts (8+ hours)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsExportModalOpen(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={exportFilteredCSV}
                    className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                  >
                    Export CSV
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

// Export utility functions for appointment booking integration
export const getStaffAvailability = (schedules, employeeId, dayOfWeek) => {
  return schedules.find(s => s.employeeId === employeeId && s.dayOfWeek === dayOfWeek);
};

export const isStaffAvailable = (schedules, employeeId, dayOfWeek) => {
  return getStaffAvailability(schedules, employeeId, dayOfWeek) !== undefined;
};

export const getAvailableStaffForDay = (schedules, staffData, dayOfWeek) => {
  return staffData.filter(staff => 
    isStaffAvailable(schedules, staff.uid || staff.id, dayOfWeek)
  );
};

export default BranchManagerSchedules;
