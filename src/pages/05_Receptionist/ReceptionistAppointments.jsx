import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../shared/AppointmentForm';
import AppointmentDetails from '../shared/AppointmentDetails';
import RescheduleModal from '../shared/RescheduleModal';
import CancelModal from '../shared/CancelModal';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Scissors, 
  Plus, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Home,
  Receipt,
  UserCog,
  Printer,
  Download,
  FileText,
  Package
} from 'lucide-react';

const ReceptionistAppointments = () => {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(APPOINTMENT_STATUS.SCHEDULED);
  const [dateFilter, setDateFilter] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  
  // Notification states
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Loading states for buttons
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [confirmingAppointment, setConfirmingAppointment] = useState(null);
  const [markingInService, setMarkingInService] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  
  // Loading modal state
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Print report states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [printStatusFilter, setPrintStatusFilter] = useState('all');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [printingSingleAppointment, setPrintingSingleAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadClients();
  }, [statusFilter]);


  // Helper functions for notifications
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 5000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorMessage(true);
    setTimeout(() => setShowErrorMessage(false), 5000);
  };



  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get user's branch ID for filtering
      const branchId = userData.branchId;
      const userRole = userData.roles?.[0];
      
      console.log('Loading appointments for receptionist:', {
        branchId,
        userRole,
        statusFilter
      });
      
      // Set up filters for receptionist
      const filters = {
        branchId: branchId, // Filter by receptionist's branch
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const result = await appointmentService.getAppointments(
        filters,
        userRole,
        userData.uid
      );
      
      console.log('Appointments loaded:', result);
      setAppointments(result.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientsData = await appointmentService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateAppointment = async (appointmentData) => {
    if (creatingAppointment) return; // Prevent duplicate submissions
    
    try {
      setCreatingAppointment(true);
      setShowLoadingModal(true);
      setLoadingMessage('Creating appointment...');
      
      await appointmentService.createAppointment(appointmentData, userData.roles?.[0], userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowAppointmentForm(false);
      setShowLoadingModal(false);
      showSuccess('Appointment created successfully!');
    } catch (error) {
      console.error('Error creating appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to create appointment: ' + error.message);
    } finally {
      setCreatingAppointment(false);
    }
  };


  const handleConfirmAppointment = async (appointmentId) => {
    if (confirmingAppointment === appointmentId) return; // Prevent duplicate submissions
    
    try {
      setConfirmingAppointment(appointmentId);
      setShowLoadingModal(true);
      setLoadingMessage('Confirming appointment...');
      
      await appointmentService.updateAppointment(appointmentId, { 
        status: APPOINTMENT_STATUS.CONFIRMED 
      }, userData.roles?.[0], userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowLoadingModal(false);
      showSuccess('Appointment confirmed successfully!');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to confirm appointment: ' + error.message);
    } finally {
      setConfirmingAppointment(null);
    }
  };

  const handleMarkAsInService = async (appointmentId) => {
    if (markingInService === appointmentId) return; // Prevent duplicate submissions
    
    try {
      setMarkingInService(appointmentId);
      setShowLoadingModal(true);
      setLoadingMessage('Marking appointment as in service and creating invoice...');
      
      const result = await appointmentService.markAsInService(appointmentId, userData.uid);
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowLoadingModal(false);
      showSuccess(`Appointment marked as in service! Invoice ${result.transactionId} created successfully.`);
    } catch (error) {
      console.error('Error marking appointment as in service:', error);
      setShowLoadingModal(false);
      showError('Failed to mark appointment as in service: ' + error.message);
    } finally {
      setMarkingInService(null);
    }
  };


  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  // Reschedule and Cancel handlers
  const handleRescheduleAppointment = async (appointmentId, newDate, newTime, reason) => {
    try {
      setShowLoadingModal(true);
      setLoadingMessage('Rescheduling appointment...');
      
      await appointmentService.rescheduleAppointment(
        appointmentId, 
        newDate, 
        newTime, 
        userData.roles?.[0], 
        userData.uid, 
        reason
      );
      
      setShowRescheduleModal(false);
      setRescheduleAppointment(null);
      setShowLoadingModal(false);
      showSuccess('Appointment rescheduled successfully!');
      await loadAppointments();
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to reschedule appointment: ' + error.message);
    }
  };

  const handleOpenReschedule = (appointment) => {
    setRescheduleAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      setShowLoadingModal(true);
      setLoadingMessage('Cancelling appointment...');
      
      await appointmentService.cancelAppointment(
        appointmentId, 
        reason, 
        userData.roles?.[0], 
        userData.uid
      );
      
      setShowCancelModal(false);
      setCancelAppointment(null);
      setShowLoadingModal(false);
      showSuccess('Appointment cancelled successfully!');
      await loadAppointments();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setShowLoadingModal(false);
      showError('Failed to cancel appointment: ' + error.message);
    }
  };

  const handleOpenCancel = (appointment) => {
    setCancelAppointment(appointment);
    setShowCancelModal(true);
  };

  // Print Report Functions
  const handleOpenPrintModal = () => {
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setPrintDateRange({
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    });
    setPrintStatusFilter('all');
    setShowPrintModal(true);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      setShowLoadingModal(true);
      setLoadingMessage('Generating report...');

      // Filter appointments based on print criteria
      const filteredForPrint = appointments.filter(appointment => {
        const appointmentDate = appointment.appointmentDate?.toDate ? 
          appointment.appointmentDate.toDate() : 
          new Date(appointment.appointmentDate);
        
        const startDate = new Date(printDateRange.startDate);
        const endDate = new Date(printDateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Include full end date
        
        const matchesDate = appointmentDate >= startDate && appointmentDate <= endDate;
        const matchesStatus = printStatusFilter === 'all' || appointment.status === printStatusFilter;
        
        return matchesDate && matchesStatus;
      });

      // Generate and print the report
      await generatePrintReport(filteredForPrint);
      
      setShowPrintModal(false);
      setShowLoadingModal(false);
      showSuccess('Report generated and sent to printer!');
    } catch (error) {
      console.error('Error generating report:', error);
      setShowLoadingModal(false);
      showError('Failed to generate report: ' + error.message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const generatePrintReport = async (filteredAppointments) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get current date and time for report header
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate statistics
    const totalAppointments = filteredAppointments.length;
    const scheduledCount = filteredAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.SCHEDULED).length;
    const confirmedCount = filteredAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.CONFIRMED).length;
    const completedCount = filteredAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.COMPLETED).length;
    const cancelledCount = filteredAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.CANCELLED).length;

    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Report - ${userData.branchName || 'Salon'}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #160B53;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #160B53;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            color: #666;
          }
          .report-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #160B53;
          }
          .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #160B53;
          }
          .stat-label {
            color: #666;
            font-size: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #160B53;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-scheduled { background: #dbeafe; color: #1e40af; }
          .status-confirmed { background: #dcfce7; color: #166534; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-completed { background: #f3f4f6; color: #374151; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Appointment Report</h1>
          <p><strong>Branch:</strong> ${userData.branchName || 'N/A'}</p>
          <p><strong>Generated:</strong> ${reportDate}</p>
          <p><strong>Report Period:</strong> ${printDateRange.startDate} to ${printDateRange.endDate}</p>
        </div>

        <div class="report-info">
          <h3>Report Summary</h3>
          <p><strong>Total Appointments:</strong> ${totalAppointments}</p>
          <p><strong>Date Range:</strong> ${printDateRange.startDate} to ${printDateRange.endDate}</p>
          <p><strong>Status Filter:</strong> ${printStatusFilter === 'all' ? 'All Statuses' : printStatusFilter}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${totalAppointments}</div>
            <div class="stat-label">Total Appointments</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${scheduledCount}</div>
            <div class="stat-label">Scheduled</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${confirmedCount}</div>
            <div class="stat-label">Confirmed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${completedCount}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${cancelledCount}</div>
            <div class="stat-label">Cancelled</div>
          </div>
        </div>

        <h3>Appointment Details</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Client</th>
              <th>Service</th>
              <th>Stylist</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredAppointments.map(appointment => `
              <tr>
                <td>${formatDate(appointment.appointmentDate)}</td>
                <td>${formatTime(appointment.appointmentTime)}</td>
                <td>${appointment.clientName || 'N/A'}</td>
                <td>${appointment.serviceName || 'N/A'}</td>
                <td>${appointment.stylistName || 'Unassigned'}</td>
                <td><span class="status-badge status-${appointment.status?.toLowerCase().replace('_', '-')}">${appointment.status || 'N/A'}</span></td>
                <td>${appointment.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by Salon Management System</p>
          <p>Report generated on ${reportDate}</p>
        </div>
      </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  // Print Single Appointment Function
  const handlePrintSingleAppointment = async (appointment) => {
    try {
      setPrintingSingleAppointment(appointment.id);
      setShowLoadingModal(true);
      setLoadingMessage('Generating appointment report...');

      await generateSingleAppointmentReport(appointment);
      
      setShowLoadingModal(false);
      showSuccess('Appointment report generated and sent to printer!');
    } catch (error) {
      console.error('Error generating single appointment report:', error);
      setShowLoadingModal(false);
      showError('Failed to generate appointment report: ' + error.message);
    } finally {
      setPrintingSingleAppointment(null);
    }
  };

  const generateSingleAppointmentReport = async (appointment) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get current date and time for report header
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Generate HTML content for single appointment report
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Report - ${appointment.clientName || 'Client'}</title>
        <style>
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #160B53;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #160B53;
            margin: 0;
            font-size: 32px;
            font-weight: bold;
          }
          .header p {
            margin: 5px 0;
            color: #666;
            font-size: 16px;
          }
          .appointment-details {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 25px;
            border-left: 5px solid #160B53;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            color: #374151;
            font-size: 16px;
            min-width: 120px;
          }
          .detail-value {
            color: #1f2937;
            font-size: 16px;
            text-align: right;
            flex: 1;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-scheduled { background: #dbeafe; color: #1e40af; }
          .status-confirmed { background: #dcfce7; color: #166534; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-completed { background: #f3f4f6; color: #374151; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .notes-section {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            border-left: 4px solid #0ea5e9;
          }
          .notes-title {
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .notes-content {
            color: #0c4a6e;
            font-size: 15px;
            line-height: 1.5;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
          }
          .qr-placeholder {
            width: 120px;
            height: 120px;
            background: #e5e7eb;
            border: 2px dashed #9ca3af;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            font-size: 12px;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Appointment Report</h1>
          <p><strong>Branch:</strong> ${userData.branchName || 'N/A'}</p>
          <p><strong>Generated:</strong> ${reportDate}</p>
        </div>

        <div class="appointment-details">
          <h2 style="margin: 0 0 20px 0; color: #160B53; font-size: 24px;">Appointment Details</h2>
          
          <div class="detail-row">
            <span class="detail-label">Client Name:</span>
            <span class="detail-value">${appointment.clientName || 'N/A'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Service:</span>
            <span class="detail-value">${appointment.serviceName || 'N/A'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Stylist:</span>
            <span class="detail-value">${appointment.stylistName || 'Unassigned'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Date:</span>
            <span class="detail-value">${formatDate(appointment.appointmentDate)}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Time:</span>
            <span class="detail-value">${formatTime(appointment.appointmentTime)}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value">
              <span class="status-badge status-${appointment.status?.toLowerCase().replace('_', '-')}">
                ${appointment.status || 'N/A'}
              </span>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Appointment ID:</span>
            <span class="detail-value">${appointment.id || 'N/A'}</span>
          </div>
        </div>

        ${appointment.notes ? `
          <div class="notes-section">
            <div class="notes-title">📝 Special Notes & Instructions</div>
            <div class="notes-content">${appointment.notes}</div>
          </div>
        ` : ''}

        <div class="qr-section">
          <div class="qr-placeholder">
            QR Code<br/>Placeholder
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">
            Scan QR code for digital appointment details
          </p>
        </div>

        <div class="footer">
          <p><strong>Salon Management System</strong></p>
          <p>Report generated on ${reportDate}</p>
          <p>For inquiries, contact: ${userData.branchName || 'Salon'} Branch</p>
        </div>
      </body>
      </html>
    `;

    // Write content to print window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };



  const getStatusBadge = (status) => {
    const statusConfig = {
      [APPOINTMENT_STATUS.SCHEDULED]: { color: 'bg-blue-100 text-blue-800', label: 'Scheduled' },
      [APPOINTMENT_STATUS.CONFIRMED]: { color: 'bg-green-100 text-green-800', label: 'Confirmed' },
      [APPOINTMENT_STATUS.IN_SERVICE]: { color: 'bg-yellow-100 text-yellow-800', label: 'In Service' },
      [APPOINTMENT_STATUS.COMPLETED]: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      [APPOINTMENT_STATUS.CANCELLED]: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', label: status };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    // If time is already in HH:MM format, convert to 12-hour format
    if (typeof time === 'string' && time.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    }
    // If time is a timestamp, format it
    const d = time.toDate ? time.toDate() : new Date(time);
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    const matchesDate = !dateFilter || (appointment.appointmentDate && 
      formatDate(appointment.appointmentDate).toLowerCase().includes(dateFilter.toLowerCase()));
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/receptionist-appointments', label: 'Appointments', icon: Calendar },
    { path: '/service-transactions', label: 'Service Transactions', icon: Scissors },
    { path: '/product-transactions', label: 'Product Transactions', icon: Package },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointment Management - Pending Confirmations">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex space-x-3">
            <Button 
              onClick={handleOpenPrintModal}
              variant="outline"
              className="border-[#160B53] text-[#160B53] hover:bg-[#160B53] hover:text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            </div>
            {statusFilter === APPOINTMENT_STATUS.SCHEDULED && (
              <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">Showing Pending Confirmations</span>
              </div>
            )}
          </div>
          <Button 
            onClick={() => setShowAppointmentForm(true)}
            disabled={creatingAppointment}
            className="bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingAppointment ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
            <Plus className="h-4 w-4 mr-2" />
            Create Appointment
              </>
            )}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => {
                    const today = new Date();
                    const aptDate = apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate);
                    return aptDate.toDateString() === today.toDateString();
                  }).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Confirmation</p>
                <p className="text-2xl font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === APPOINTMENT_STATUS.SCHEDULED).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={APPOINTMENT_STATUS.SCHEDULED}>Scheduled</option>
                <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                <option value={APPOINTMENT_STATUS.IN_SERVICE}>In Service</option>
                <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
                <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="Filter by date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-4">No appointments match your current filters.</p>
            <Button 
              onClick={() => setShowAppointmentForm(true)}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Appointment
            </Button>
          </Card>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:p-6">
              <div className="flow-root">
                <ul className="divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <li key={appointment.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4 mb-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{formatDate(appointment.appointmentDate)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{formatTime(appointment.appointmentTime)}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{appointment.clientName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Scissors className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{appointment.serviceName}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{appointment.serviceName}</h3>
                              <p className="text-sm text-gray-600">Client: {appointment.clientName}</p>
                              <p className="text-sm text-gray-600">Stylist: {appointment.stylistName}</p>
                              {appointment.notes && (
                                <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(appointment.status)}
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewAppointment(appointment)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePrintSingleAppointment(appointment)}
                                  disabled={printingSingleAppointment === appointment.id}
                                  title="Print Appointment Report"
                                  className="text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {printingSingleAppointment === appointment.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                                  ) : (
                                    <Printer className="h-4 w-4" />
                                  )}
                                </Button>
                                {appointment.status === APPOINTMENT_STATUS.SCHEDULED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleConfirmAppointment(appointment.id)}
                                    disabled={confirmingAppointment === appointment.id}
                                    title="Confirm Appointment"
                                    className="text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {confirmingAppointment === appointment.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                    ) : (
                                    <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMarkAsInService(appointment.id)}
                                    disabled={markingInService === appointment.id}
                                    title="Mark as In Service"
                                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {markingInService === appointment.id ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    ) : (
                                      <Scissors className="h-4 w-4" />
                                    )}
                                  </Button>
                                )}
                                {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                                 appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenReschedule(appointment)}
                                    title="Reschedule Appointment"
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                )}
                                {appointment.status !== APPOINTMENT_STATUS.COMPLETED && 
                                 appointment.status !== APPOINTMENT_STATUS.CANCELLED && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenCancel(appointment)}
                                    title="Cancel Appointment"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Appointment Form Modal */}
        {showAppointmentForm && (
          <AppointmentForm
            isOpen={showAppointmentForm}
            onClose={() => {
              setShowAppointmentForm(false);
              setSelectedAppointment(null);
            }}
            onSubmit={handleCreateAppointment}
            initialData={null}
            isEditing={false}
            loading={creatingAppointment}
            clients={clients}
            userData={userData}
          />
        )}

        {/* Appointment Details Modal */}
        {showAppointmentDetails && selectedAppointment && (
          <AppointmentDetails
            isOpen={showAppointmentDetails}
            onClose={() => {
              setShowAppointmentDetails(false);
              setSelectedAppointment(null);
            }}
            appointment={selectedAppointment}
            onCancel={() => {
              setShowAppointmentDetails(false);
              handleCancelAppointmentWithConfirmation(selectedAppointment.id);
            }}
            loading={false}
          />
        )}


        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {showErrorMessage && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <XCircle className="h-5 w-5 mr-2" />
            {errorMessage}
          </div>
        )}

        {/* Loading Modal */}
        {showLoadingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8">
              <div className="flex flex-col items-center text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600">{loadingMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && rescheduleAppointment && (
          <RescheduleModal
            isOpen={showRescheduleModal}
            onClose={() => {
              setShowRescheduleModal(false);
              setRescheduleAppointment(null);
            }}
            appointment={rescheduleAppointment}
            onReschedule={handleRescheduleAppointment}
            loading={false}
          />
        )}

        {/* Cancel Modal */}
        {showCancelModal && cancelAppointment && (
          <CancelModal
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setCancelAppointment(null);
            }}
            appointment={cancelAppointment}
            onCancel={handleCancelAppointment}
            loading={false}
          />
        )}

        {/* Print Report Modal */}
        {showPrintModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-[#160B53] mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Generate Report</h3>
                </div>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={printDateRange.startDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Date</label>
                      <Input
                        type="date"
                        value={printDateRange.endDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={printStatusFilter}
                    onChange={(e) => setPrintStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value={APPOINTMENT_STATUS.SCHEDULED}>Scheduled</option>
                    <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                    <option value={APPOINTMENT_STATUS.IN_SERVICE}>In Service</option>
                    <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
                    <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Report Preview:</strong> This will generate a comprehensive report with appointment statistics and detailed appointment information for the selected date range and status filter.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowPrintModal(false)}
                  disabled={isGeneratingReport}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || !printDateRange.startDate || !printDateRange.endDate}
                  className="bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReceptionistAppointments;
