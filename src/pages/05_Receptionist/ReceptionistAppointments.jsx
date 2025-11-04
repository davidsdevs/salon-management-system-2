import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import AppointmentForm from '../../components/appointment/AppointmentForm';
import AppointmentDetails from '../../components/appointment/AppointmentDetails';
import RescheduleModal from '../../components/appointment/RescheduleModal';
import CancelModal from '../../components/appointment/CancelModal';
import FilterModal from '../../components/appointment/FilterModal';
import { appointmentService, APPOINTMENT_STATUS } from '../../services/appointmentService';
import { transactionService } from '../../services/transactionService';
import { branchService } from '../../services/branchService';
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
  X,
  AlertCircle,
  Users,
  Home,
  Receipt,
  UserCog,
  Printer,
  Download,
  FileText,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Play,
  Zap,
  Rocket,
  CreditCard,
  Coins,
  DollarSign,
  Banknote,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';

const ReceptionistAppointments = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [stylistFilter, setStylistFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Modal states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  
  // Confirmation dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  
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
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  // Recently changed/highlight state
  const [highlightedAppointmentId, setHighlightedAppointmentId] = useState(null);

  useEffect(() => {
    loadAppointments();
    loadClients();
    loadBranches();
  }, []);

  useEffect(() => {
    if (!highlightedAppointmentId) return;
    const timer = setTimeout(() => {
      setHighlightedAppointmentId(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [highlightedAppointmentId]);



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



  const loadBranches = async () => {
    try {
      const branchesData = await branchService.getBranches(userData?.roles?.[0], userData?.userId);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading branches:', error);
      showError('Failed to load branches');
    }
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
      
      // Set up filters for receptionist - load ALL appointments for client-side filtering
      const filters = {
        branchId: branchId // Filter by receptionist's branch only
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
      
      const createdAppointment = await appointmentService.createAppointment(appointmentData, userData.roles?.[0], userData.uid);
      const newAppointmentId = createdAppointment?.id;
      
      setLoadingMessage('Loading appointments...');
      await loadAppointments();
      
      setShowAppointmentForm(false);
      setShowLoadingModal(false);
      showSuccess('Appointment created and confirmed!');

      // Focus on the newly created appointment (now in CONFIRMED tab)
      setStatusFilter(APPOINTMENT_STATUS.CONFIRMED);
      setCurrentPage(1);
      if (newAppointmentId) {
        setHighlightedAppointmentId(newAppointmentId);
        setTimeout(() => {
          const row = document.getElementById(`apt-row-${newAppointmentId}`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
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
      setStatusFilter(APPOINTMENT_STATUS.CONFIRMED);
      setCurrentPage(1);
      setHighlightedAppointmentId(appointmentId);
      // Defer scrolling to allow DOM to render
      setTimeout(() => {
        const row = document.getElementById(`apt-row-${appointmentId}`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
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
      setStatusFilter(APPOINTMENT_STATUS.IN_SERVICE);
      setCurrentPage(1);
      setHighlightedAppointmentId(appointmentId);
      setTimeout(() => {
        const row = document.getElementById(`apt-row-${appointmentId}`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } catch (error) {
      console.error('Error marking appointment as in service:', error);
      setShowLoadingModal(false);
      showError('Failed to mark appointment as in service: ' + error.message);
    } finally {
      setMarkingInService(null);
    }
  };

  const handleViewTransaction = async (appointmentId) => {
    try {
      // Navigate to POS & Billing page with the appointment ID as a query parameter
      navigate(`/pos-billing?appointmentId=${appointmentId}`);
    } catch (error) {
      console.error('Error navigating to transaction:', error);
      showError('Failed to view transaction: ' + error.message);
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

  const handleConfirmAction = (action, data) => {
    setConfirmAction(action);
    setConfirmData(data);
    setShowConfirmDialog(true);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction || !confirmData) return;

    try {
      switch (confirmAction) {
        case 'confirm':
          await handleConfirmAppointment(confirmData.id);
          break;
        case 'markInService':
          await handleMarkAsInService(confirmData.id);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error executing confirmed action:', error);
    } finally {
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setConfirmData(null);
    }
  };

  // Print Report Functions
  const handleOpenPrintModal = async () => {
    try {
      setIsGeneratingReport(true);
      setShowLoadingModal(true);
      setLoadingMessage('Generating report...');

      // Use the filtered appointments from the current filter modal
      await generatePrintReport(filteredAppointments);
      
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

    // Build filter description
    const filterParts = [];
    if (dateRange.start || dateRange.end) {
      const startLabel = dateRange.start || 'Any';
      const endLabel = dateRange.end || 'Any';
      filterParts.push(`Date: ${startLabel} to ${endLabel}`);
    }
    if (stylistFilter) {
      filterParts.push(`Stylist: ${stylistFilter}`);
    }
    if (serviceFilter) {
      filterParts.push(`Service: ${serviceFilter}`);
    }
    if (statusFilter !== 'all') {
      filterParts.push(`Status: ${statusFilter}`);
    }
    const filterDescription = filterParts.length > 0 ? filterParts.join(' | ') : 'No filters applied';

    // Calculate statistics
    const totalAppointments = filteredAppointments.length;
    const pendingCount = filteredAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.PENDING).length;
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
            @page { margin: 0.5cm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 10px;
            color: #333;
            font-size: 11px;
          }
          .header {
            text-align: center;
            border-bottom: 1px solid #160B53;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .header h1 {
            color: #160B53;
            margin: 0;
            font-size: 18px;
          }
          .header p {
            margin: 2px 0;
            color: #666;
            font-size: 10px;
          }
          .report-info {
            background: #f8f9fa;
            padding: 6px 8px;
            border-radius: 4px;
            margin-bottom: 8px;
            font-size: 10px;
          }
          .report-info p {
            margin: 2px 0;
          }
          .report-info h3 {
            margin: 0 0 4px 0;
            font-size: 12px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            margin-bottom: 12px;
          }
          .stat-card {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 4px;
            text-align: center;
            border-left: 2px solid #160B53;
          }
          .stat-number {
            font-size: 14px;
            font-weight: bold;
            color: #160B53;
          }
          .stat-label {
            color: #666;
            font-size: 9px;
          }
          .schedule-section {
            margin-bottom: 12px;
            page-break-inside: avoid;
          }
          .date-header {
            background: #160B53;
            color: white;
            padding: 4px 8px;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
            border-radius: 2px;
          }
          .appointment-item {
            display: grid;
            grid-template-columns: 60px 1fr;
            gap: 8px;
            padding: 4px 6px;
            border-bottom: 1px solid #e5e7eb;
            align-items: start;
          }
          .appointment-item:last-child {
            border-bottom: none;
          }
          .time-slot {
            font-weight: bold;
            color: #160B53;
            font-size: 10px;
            padding-top: 2px;
          }
          .appointment-details {
            font-size: 10px;
          }
          .appointment-details .client-name {
            font-weight: bold;
            color: #111;
            margin-bottom: 1px;
          }
          .appointment-details .service-info {
            color: #666;
            margin-bottom: 1px;
          }
          .appointment-details .stylist-info {
            color: #666;
            font-size: 9px;
          }
          .status-badge {
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: bold;
          }
          .status-scheduled { background: #dbeafe; color: #1e40af; }
          .status-confirmed { background: #dcfce7; color: #166534; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-completed { background: #f3f4f6; color: #374151; }
          .status-cancelled { background: #fee2e2; color: #dc2626; }
          .footer {
            margin-top: 12px;
            text-align: center;
            color: #666;
            font-size: 9px;
          }
          h3 {
            font-size: 13px;
            margin: 8px 0 6px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Appointment Report</h1>
          <p><strong>Branch:</strong> ${userData.branchName || 'N/A'}</p>
          <p><strong>Generated:</strong> ${reportDate}</p>
          <p><strong>Filters Applied:</strong> ${filterDescription}</p>
        </div>

        <div class="report-info">
          <h3>Report Summary</h3>
          <p><strong>Total Appointments:</strong> ${totalAppointments}</p>
          <p><strong>Filters Applied:</strong> ${filterDescription}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${totalAppointments}</div>
            <div class="stat-label">Total Appointments</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${pendingCount}</div>
            <div class="stat-label">Pending</div>
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

        <h3>Appointment Schedule</h3>
        ${(() => {
          // Group appointments by date
          const grouped = {};
          filteredAppointments.forEach(apt => {
            const date = formatDate(apt.appointmentDate);
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(apt);
          });
          
          // Sort dates and appointments within each date
          return Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b)).map(date => {
            const dayAppointments = grouped[date].sort((a, b) => {
              const timeA = a.appointmentTime || '';
              const timeB = b.appointmentTime || '';
              return timeA.localeCompare(timeB);
            });
            
            return `
              <div class="schedule-section">
                <div class="date-header">${date} (${dayAppointments.length} appointment${dayAppointments.length !== 1 ? 's' : ''})</div>
                ${dayAppointments.map(apt => `
                  <div class="appointment-item">
                    <div class="time-slot">${formatTime(apt.appointmentTime)}</div>
                    <div class="appointment-details">
                      <div class="client-name">${apt.clientName || 'N/A'} <span class="status-badge status-${apt.status?.toLowerCase().replace('_', '-')}">${apt.status || 'N/A'}</span></div>
                      <div class="service-info">Service: ${apt.serviceName || 'N/A'}</div>
                      <div class="stylist-info">Stylist: ${apt.stylistName || 'Unassigned'}${apt.notes ? ' • ' + apt.notes : ''}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('');
        })()}

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
      [APPOINTMENT_STATUS.PENDING]: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending',
        icon: Clock
      },
      [APPOINTMENT_STATUS.CONFIRMED]: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Confirmed',
        icon: CheckCircle
      },
      [APPOINTMENT_STATUS.IN_SERVICE]: { 
        color: 'bg-orange-100 text-orange-800', 
        label: 'In Service',
        icon: Scissors
      },
      [APPOINTMENT_STATUS.COMPLETED]: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Completed',
        icon: CheckCircle
      },
      [APPOINTMENT_STATUS.CANCELLED]: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Cancelled',
        icon: X
      }
    };

    const config = statusConfig[status] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: status,
      icon: Clock
    };
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
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

  // Sorting functions
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  const sortAppointments = (appointments) => {
    if (!sortColumn) {
      // Default sort logic based on status filter
      if (statusFilter === APPOINTMENT_STATUS.PENDING) {
        // For pending appointments, sort by appointment date/time (soonest first)
        return [...appointments].sort((a, b) => {
          const aDateTime = new Date(`${a.appointmentDate} ${a.appointmentTime}`);
          const bDateTime = new Date(`${b.appointmentDate} ${b.appointmentTime}`);
          return aDateTime - bDateTime; // Ascending order (soonest first)
        });
      } else if (statusFilter === APPOINTMENT_STATUS.CONFIRMED || 
                 statusFilter === APPOINTMENT_STATUS.IN_SERVICE || 
                 statusFilter === APPOINTMENT_STATUS.COMPLETED) {
        // For confirmed, in service, and completed, sort by updatedAt (latest updated first)
        return [...appointments].sort((a, b) => {
          const aDate = a.updatedAt ? (a.updatedAt.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt)) : new Date(0);
          const bDate = b.updatedAt ? (b.updatedAt.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt)) : new Date(0);
          return bDate - aDate; // Descending order (latest updated first)
        });
      } else {
        // For all other statuses (including 'all'), sort by creation date (newest first)
        return [...appointments].sort((a, b) => {
          const aDate = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
          const bDate = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
          return bDate - aDate; // Descending order (newest first)
        });
      }
    }

    return [...appointments].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'date':
          aValue = new Date(a.appointmentDate);
          bValue = new Date(b.appointmentDate);
          break;
        case 'time':
          aValue = a.appointmentTime || '';
          bValue = b.appointmentTime || '';
          break;
        case 'client':
          aValue = a.clientName || '';
          bValue = b.clientName || '';
          break;
        case 'services':
          aValue = a.serviceStylistPairs?.length || 0;
          bValue = b.serviceStylistPairs?.length || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'notes':
          aValue = a.notes || '';
          bValue = b.notes || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Get unique stylists and services for dropdowns
  const uniqueStylists = React.useMemo(() => {
    const stylists = new Set();
    appointments.forEach(apt => {
      if (apt.stylistName) stylists.add(apt.stylistName);
      apt.serviceStylistPairs?.forEach(pair => {
        if (pair.stylistName) stylists.add(pair.stylistName);
      });
    });
    return Array.from(stylists).sort();
  }, [appointments]);

  const uniqueServices = React.useMemo(() => {
    const services = new Set();
    appointments.forEach(apt => {
      if (apt.serviceName) services.add(apt.serviceName);
      apt.serviceStylistPairs?.forEach(pair => {
        if (pair.serviceName) services.add(pair.serviceName);
      });
    });
    return Array.from(services).sort();
  }, [appointments]);

  const filteredAppointments = sortAppointments(appointments.filter(appointment => {
    const matchesSearch = appointment.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.stylistName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    
    const matchesDate = (!dateRange.start && !dateRange.end) || (
      appointment.appointmentDate &&
      (
        (!dateRange.start || new Date(formatDate(appointment.appointmentDate)) >= new Date(dateRange.start)) &&
        (!dateRange.end || new Date(formatDate(appointment.appointmentDate)) <= new Date(dateRange.end))
      )
    );
    
    const matchesStylist = !stylistFilter || 
      appointment.stylistName === stylistFilter ||
      appointment.serviceStylistPairs?.some(pair => pair.stylistName === stylistFilter);
    
    const matchesService = !serviceFilter || 
      appointment.serviceName === serviceFilter ||
      appointment.serviceStylistPairs?.some(pair => pair.serviceName === serviceFilter);
    
    return matchesSearch && matchesStatus && matchesDate && matchesStylist && matchesService;
  }));

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, dateRange.start, dateRange.end, stylistFilter, serviceFilter]);

  // Calculate tab counts (memoized to prevent unnecessary recalculations)
  const tabCounts = React.useMemo(() => ({
    all: appointments.length,
    pending: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.PENDING).length,
    confirmed: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.CONFIRMED).length,
    inService: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.IN_SERVICE).length,
    completed: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.COMPLETED).length,
    cancelled: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.CANCELLED).length
  }), [appointments]);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/receptionist-appointments', label: 'Appointments', icon: Calendar },
    { path: '/pos-billing', label: 'POS & Billing', icon: Receipt },
    { path: '/receptionist/clients', label: 'Clients', icon: Users },
    { path: '/profile', label: 'Profile', icon: UserCog },
  ];

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Appointment Management">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent w-full sm:w-64"
              />
          </div>

            {/* Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilterModal(true)}
              className={`border-gray-300 hover:border-[#160B53] ${
                (dateRange.start || dateRange.end || stylistFilter || serviceFilter) ? 'bg-blue-50 border-blue-300 text-blue-700' : ''
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
              {(dateRange.start || dateRange.end || stylistFilter || serviceFilter) && (
                <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[dateRange.start, dateRange.end, stylistFilter, serviceFilter].filter(Boolean).length}
                </span>
              )}
            </Button>

            {/* Filter Modal */}
            <FilterModal
              isOpen={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              dateRange={dateRange}
              setDateRange={setDateRange}
              stylistFilter={stylistFilter}
              setStylistFilter={setStylistFilter}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              uniqueStylists={uniqueStylists}
              uniqueServices={uniqueServices}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleOpenPrintModal}
              variant="outline"
              className="border-[#160B53] text-[#160B53] hover:bg-[#160B53] hover:text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          <Button 
            onClick={() => setShowAppointmentForm(true)}
              disabled={creatingAppointment}
              className="bg-[#160B53] hover:bg-[#160B53]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creatingAppointment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Booking...
                </>
              ) : (
                <>
            <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </>
              )}
          </Button>
        </div>
              </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-4 p-4 pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.all}</span>
              <span>All</span>
              </div>
          </button>
          <button
            onClick={() => setStatusFilter(APPOINTMENT_STATUS.PENDING)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === APPOINTMENT_STATUS.PENDING
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.pending}</span>
              <span>Pending</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(APPOINTMENT_STATUS.CONFIRMED)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === APPOINTMENT_STATUS.CONFIRMED
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.confirmed}</span>
              <span>Confirmed</span>
              </div>
          </button>
          <button
            onClick={() => setStatusFilter(APPOINTMENT_STATUS.IN_SERVICE)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === APPOINTMENT_STATUS.IN_SERVICE
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.inService}</span>
              <span>In Service</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(APPOINTMENT_STATUS.COMPLETED)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === APPOINTMENT_STATUS.COMPLETED
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`} 
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.completed}</span>
              <span>Completed</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter(APPOINTMENT_STATUS.CANCELLED)}
            className={`flex-1 justify-center px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              statusFilter === APPOINTMENT_STATUS.CANCELLED
                ? 'bg-white text-[#160B53] border-b-2 border-[#160B53]'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <span className="text-lg font-bold mr-2">{tabCounts.cancelled}</span>
              <span>Cancelled</span>
            </div>
          </button>
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
              Book First Appointment
            </Button>
          </Card>
        ) : (
          <Card className="-mt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date & Time</span>
                      {getSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('client')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Client</span>
                      {getSortIcon('client')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('services')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Services</span>
                      {getSortIcon('services')}
                    </div>
                  </th>
                  {statusFilter === 'all' && (
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </th>
                  )}
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('notes')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Notes</span>
                      {getSortIcon('notes')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAppointments.map((appointment) => (
                  <tr
                    key={appointment.id}
                    id={`apt-row-${appointment.id}`}
                    className={`transition-colors ${
                      highlightedAppointmentId === appointment.id
                        ? 'bg-yellow-50 ring-2 ring-yellow-300'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(appointment.appointmentDate)}
                            </div>
                          <div className="text-sm text-gray-500 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(appointment.appointmentTime)}</span>
                            </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.clientName}
                            </div>
                          {appointment.clientPhone && (
                            <div className="text-sm text-gray-500">
                              {appointment.clientPhone}
                            </div>
                          )}
                          </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1 mb-1">
                          <Scissors className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{appointment.serviceCount || 1} Service(s)</span>
                        </div>
                        {appointment.serviceStylistPairs?.slice(0, 2).map((pair, index) => (
                          <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 rounded mb-1">
                            <div className="font-medium">{pair.serviceName}</div>
                            <div className="text-gray-500">
                              {pair.stylistName || 'Unassigned'}
                            </div>
                          </div>
                        )) || (
                          <div className="text-xs text-gray-600 bg-gray-50 p-1 rounded mb-1">
                            <div className="font-medium">{appointment.serviceName || 'Service'}</div>
                            <div className="text-gray-500">
                              {appointment.stylistName || 'Unassigned'}
                            </div>
                          </div>
                        )}
                        {appointment.serviceStylistPairs?.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{appointment.serviceStylistPairs.length - 2} more
                            </div>
                        )}
                      </div>
                    </td>
                    {statusFilter === 'all' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(appointment.status)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {appointment.notes || '-'}
                            </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewAppointment(appointment)}
                                  title="View Details"
                            className="p-2 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                        
                                <Button
                                  size="sm"
                                  variant="outline"
                          onClick={() => handlePrintSingleAppointment(appointment)}
                          disabled={printingSingleAppointment === appointment.id}
                          title="Print"
                          className="p-2 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-200"
                        >
                          {printingSingleAppointment === appointment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                                </Button>

                                {/* Reschedule Button - for PENDING and CONFIRMED appointments */}
                                {(appointment.status === APPOINTMENT_STATUS.PENDING || 
                                  appointment.status === APPOINTMENT_STATUS.CONFIRMED) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenReschedule(appointment)}
                                    title="Reschedule"
                                    className="p-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-all duration-200"
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                )}

                                {/* Cancel Button - for PENDING and CONFIRMED appointments */}
                                {(appointment.status === APPOINTMENT_STATUS.PENDING || 
                                  appointment.status === APPOINTMENT_STATUS.CONFIRMED) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenCancel(appointment)}
                                    title="Cancel Appointment"
                                    className="p-2 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                        
                                {appointment.status === APPOINTMENT_STATUS.PENDING && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmAction('confirm', appointment)}
                            disabled={confirmingAppointment === appointment.id}
                            title="Confirm"
                            className="bg-green-600 hover:bg-green-700 text-white p-2 transition-all duration-200 hover:shadow-md"
                                  >
                            {confirmingAppointment === appointment.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                    <CheckCircle className="h-4 w-4" />
                            )}
                                  </Button>
                                )}
                        
                        {appointment.status === APPOINTMENT_STATUS.CONFIRMED && (
                                  <Button
                                    size="sm"
                            onClick={() => handleConfirmAction('markInService', appointment)}
                            disabled={markingInService === appointment.id}
                            title="Start Service"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 transition-all duration-200 hover:shadow-md"
                          >
                            {markingInService === appointment.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Rocket className="h-4 w-4" />
                            )}
                                  </Button>
                                )}

                        {appointment.status === APPOINTMENT_STATUS.IN_SERVICE && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                            onClick={() => handleViewTransaction(appointment.id)}
                            title="View Transaction"
                            className="p-2 hover:bg-yellow-50 hover:border-yellow-300 hover:text-yellow-600 transition-all duration-200"
                          >
                            <Banknote className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
                            </div>
          </Card>
        )}

        {/* Pagination Controls */}
        {filteredAppointments.length > itemsPerPage && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredAppointments.length)} of {filteredAppointments.length} appointments
                          </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={currentPage === pageNum ? "bg-[#160B53] text-white" : ""}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className={currentPage === totalPages ? "bg-[#160B53] text-white" : ""}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
                        </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
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
            branches={branches}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="print-modal-container bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Generate Appointment Report</h3>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={isGeneratingReport}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={printDateRange.startDate}
                          onChange={(e) => setPrintDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                          disabled={isGeneratingReport}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">End Date</label>
                        <input
                          type="date"
                          value={printDateRange.endDate}
                          onChange={(e) => setPrintDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#160B53] focus:border-transparent text-sm"
                          disabled={isGeneratingReport}
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
                      disabled={isGeneratingReport}
                    >
                      <option value="all">All Statuses</option>
                      <option value={APPOINTMENT_STATUS.PENDING}>Pending</option>
                      <option value={APPOINTMENT_STATUS.CONFIRMED}>Confirmed</option>
                      <option value={APPOINTMENT_STATUS.IN_SERVICE}>In Service</option>
                      <option value={APPOINTMENT_STATUS.COMPLETED}>Completed</option>
                      <option value={APPOINTMENT_STATUS.CANCELLED}>Cancelled</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
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

                <div className="mt-8 flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPrintModal(false)}
                    disabled={isGeneratingReport}
                    className="text-gray-700 border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport || !printDateRange.startDate || !printDateRange.endDate}
                    className="bg-[#160B53] hover:bg-[#1a0f6b] text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        )}
        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Action
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  {confirmAction === 'confirm' && 'Are you sure you want to confirm this appointment?'}
                  {confirmAction === 'markInService' && 'Are you sure you want to mark this appointment as "In Service"? This will create a service transaction invoice.'}
                </p>
                {confirmData && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Client:</strong> {confirmData.clientName}<br/>
                      <strong>Date:</strong> {formatDate(confirmData.appointmentDate)}<br/>
                      <strong>Time:</strong> {formatTime(confirmData.appointmentTime)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                    setConfirmData(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={executeConfirmedAction}
                  className="bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                >
                  Confirm
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
