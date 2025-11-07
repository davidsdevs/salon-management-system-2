/**
 * LeaveManagement - Branch Manager's leave request management page
 * 
 * This page allows branch managers to view, approve, and deny
 * leave requests from their staff members.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../shared/DashboardLayout';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { leaveService } from '../../services/leaveService';
import { LEAVE_STATUS, STATUS_LABELS, LEAVE_TYPE_LABELS } from '../../models/LeaveRequestModel';

import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Eye,
  User,
  Building,
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';

// Menu items for branch manager
const menuItems = [
  { path: "/dashboard", label: "Dashboard", icon: Calendar },
  { path: "/appointments", label: "Appointments", icon: Calendar },
  { path: "/staff", label: "Staff", icon: User },
  { path: "/schedule", label: "Schedule", icon: Clock },
  { path: "/inventory", label: "Inventory", icon: Building },
  { path: "/transactions", label: "Transactions", icon: FileText },
  { path: "/leave-management", label: "Leave Management", icon: Calendar },
  { path: "/settings", label: "Settings", icon: Building },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

const LeaveManagement = () => {
  const { userData } = useAuth();
  
  // Data states
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'deny'
  const [actionNotes, setActionNotes] = useState('');

  // Load leave requests
  useEffect(() => {
    loadLeaveRequests();
  }, [userData]);

  const loadLeaveRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userData?.branchId) {
        throw new Error('Branch ID not found');
      }

      const result = await leaveService.getLeaveRequestsByBranch(userData.branchId);
      
      if (result.success) {
        setLeaveRequests(result.leaveRequests);
      } else {
        throw new Error('Failed to load leave requests');
      }
    } catch (err) {
      console.error('Error loading leave requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadLeaveRequests();
    setRefreshing(false);
  };

  // Filter leave requests
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter(request => {
      const matchesSearch = 
        request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.notes.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || request.status === statusFilter;
      const matchesType = typeFilter === 'All' || request.leaveType === typeFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'All') {
        const today = new Date();
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        
        switch (dateFilter) {
          case 'today':
            matchesDate = requestStart <= today && requestEnd >= today;
            break;
          case 'thisWeek':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            matchesDate = requestStart <= weekEnd && requestEnd >= weekStart;
            break;
          case 'thisMonth':
            matchesDate = requestStart.getMonth() === today.getMonth() && 
                         requestStart.getFullYear() === today.getFullYear();
            break;
          case 'upcoming':
            matchesDate = requestStart > today;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [leaveRequests, searchQuery, statusFilter, typeFilter, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === LEAVE_STATUS.PENDING).length;
    const approved = leaveRequests.filter(r => r.status === LEAVE_STATUS.APPROVED).length;
    const denied = leaveRequests.filter(r => r.status === LEAVE_STATUS.DENIED).length;
    
    return { total, pending, approved, denied };
  }, [leaveRequests]);

  // Handle approve/deny actions
  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      setLoading(true);
      
      if (actionType === 'approve') {
        await leaveService.approveLeaveRequest(
          selectedRequest.id,
          userData.uid,
          userData.displayName || userData.email,
          actionNotes
        );
      } else if (actionType === 'deny') {
        await leaveService.denyLeaveRequest(
          selectedRequest.id,
          userData.uid,
          userData.displayName || userData.email,
          actionNotes,
          actionNotes
        );
      }

      // Refresh data
      await loadLeaveRequests();
      
      // Close modals
      setIsActionModalOpen(false);
      setIsDetailModalOpen(false);
      setSelectedRequest(null);
      setActionNotes('');
      
    } catch (err) {
      console.error('Error processing leave request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case LEAVE_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case LEAVE_STATUS.APPROVED:
        return 'bg-green-100 text-green-800';
      case LEAVE_STATUS.DENIED:
        return 'bg-red-100 text-red-800';
      case LEAVE_STATUS.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case LEAVE_STATUS.PENDING:
        return <Clock className="h-4 w-4" />;
      case LEAVE_STATUS.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case LEAVE_STATUS.DENIED:
        return <XCircle className="h-4 w-4" />;
      case LEAVE_STATUS.CANCELLED:
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading && leaveRequests.length === 0) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Leave Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading leave requests...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Leave Management">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-full">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-full">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Denied</p>
                <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by employee name, reason, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Status</option>
                <option value={LEAVE_STATUS.PENDING}>Pending</option>
                <option value={LEAVE_STATUS.APPROVED}>Approved</option>
                <option value={LEAVE_STATUS.DENIED}>Denied</option>
                <option value={LEAVE_STATUS.CANCELLED}>Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Types</option>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Dates</option>
                <option value="today">Today</option>
                <option value="thisWeek">This Week</option>
                <option value="thisMonth">This Month</option>
                <option value="upcoming">Upcoming</option>
              </select>

              <Button
                onClick={refreshData}
                disabled={refreshing}
                variant="outline"
                className="px-3"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Leave Requests Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {request.employeeName.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.employeeName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.leaveType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {LEAVE_TYPE_LABELS[request.leaveType]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.getFormattedDateRange()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.getFormattedTimeRange()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {request.getDurationInDays()} day{request.getDurationInDays() !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{STATUS_LABELS[request.status]}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {request.status === LEAVE_STATUS.PENDING && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType('approve');
                                setIsActionModalOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType('deny');
                                setIsActionModalOpen(true);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </Card>

        {/* Detail Modal */}
        {isDetailModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Leave Request Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Employee</label>
                    <p className="text-sm text-gray-900">{selectedRequest.employeeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Leave Type</label>
                    <p className="text-sm text-gray-900">{LEAVE_TYPE_LABELS[selectedRequest.leaveType]}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-sm text-gray-900">{selectedRequest.startDate}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-sm text-gray-900">{selectedRequest.endDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-sm text-gray-900">
                      {selectedRequest.getDurationInDays()} day{selectedRequest.getDurationInDays() !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Schedule</label>
                    <p className="text-sm text-gray-900">{selectedRequest.getFormattedTimeRange()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Reason</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedRequest.reason}</p>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRequest.notes}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                      {getStatusIcon(selectedRequest.status)}
                      <span className="ml-1">{STATUS_LABELS[selectedRequest.status]}</span>
                    </span>
                  </div>
                </div>

                {selectedRequest.approvedBy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Processed By</label>
                      <p className="text-sm text-gray-900">{selectedRequest.approvedByName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Processed At</label>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.approvedAt ? new Date(selectedRequest.approvedAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {selectedRequest.deniedReason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Denial Reason</label>
                    <p className="text-sm text-gray-900 mt-1">{selectedRequest.deniedReason}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
                {selectedRequest.status === LEAVE_STATUS.PENDING && (
                  <>
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setActionType('approve');
                        setIsActionModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        setActionType('deny');
                        setIsActionModalOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Deny
                    </Button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Action Modal */}
        {isActionModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {actionType === 'approve' ? 'Approve Leave Request' : 'Deny Leave Request'}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsActionModalOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>{selectedRequest.employeeName}</strong> - {LEAVE_TYPE_LABELS[selectedRequest.leaveType]}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedRequest.getFormattedDateRange()} ({selectedRequest.getDurationInDays()} day{selectedRequest.getDurationInDays() !== 1 ? 's' : ''})
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Reason for Denial'}
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === 'approve' ? 'Add any notes about this approval...' : 'Please provide a reason for denying this request...'}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={actionType === 'deny'}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsActionModalOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAction}
                  disabled={loading}
                  className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                >
                  {loading ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Deny')}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LeaveManagement;

