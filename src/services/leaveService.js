/**
 * Leave Service - Handles leave request operations
 * 
 * This service manages leave requests, approvals, and integrations
 * with the schedule system.
 */

import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { LeaveRequestModel, LEAVE_STATUS, LEAVE_TYPES } from '../models/LeaveRequestModel';

class LeaveService {
  constructor() {
    this.collectionName = 'staff_leave_requests';
  }

  // Create a new leave request
  async createLeaveRequest(leaveData) {
    try {
      const leaveRequest = new LeaveRequestModel(leaveData);
      
      // Validate the leave request
      const validation = leaveRequest.validate();
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Check for overlapping leave requests
      await this.checkForOverlappingLeaves(leaveRequest);

      // If this is a direct approval (approved status), cancel any overlapping pending leaves
      if (leaveRequest.status === LEAVE_STATUS.APPROVED) {
        await this.cancelOverlappingPendingLeaves(leaveRequest);
      }

      // Add to history
      leaveRequest.history.push({
        action: 'created',
        by: leaveRequest.createdBy,
        timestamp: new Date().toISOString(),
        notes: leaveRequest.status === LEAVE_STATUS.APPROVED ? 'Leave added directly' : 'Leave request created'
      });

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...leaveRequest.toFirestore(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        leaveRequest: {
          id: docRef.id,
          ...leaveRequest.toFirestore()
        }
      };
    } catch (error) {
      console.error('Error creating leave request:', error);
      throw error;
    }
  }

  // Get leave requests by employee
  async getLeaveRequestsByEmployee(employeeId, branchId = null) {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('employeeId', '==', employeeId),
        orderBy('createdAt', 'desc')
      );

      if (branchId) {
        q = query(
          collection(db, this.collectionName),
          where('employeeId', '==', employeeId),
          where('branchId', '==', branchId),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const leaveRequests = [];

      querySnapshot.forEach((doc) => {
        leaveRequests.push(LeaveRequestModel.fromFirestore(doc));
      });

      return {
        success: true,
        leaveRequests
      };
    } catch (error) {
      console.error('Error getting leave requests by employee:', error);
      throw error;
    }
  }

  // Get leave requests by branch (for managers)
  async getLeaveRequestsByBranch(branchId, status = null) {
    try {
      // First get all leave requests for the branch
      let q = query(
        collection(db, this.collectionName),
        where('branchId', '==', branchId)
      );

      const querySnapshot = await getDocs(q);
      const leaveRequests = [];

      querySnapshot.forEach((doc) => {
        const leaveRequest = LeaveRequestModel.fromFirestore(doc);
        
        // Filter by status if specified
        if (!status || leaveRequest.status === status) {
          leaveRequests.push(leaveRequest);
        }
      });

      // Sort by createdAt in descending order (most recent first)
      leaveRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });

      return {
        success: true,
        leaveRequests
      };
    } catch (error) {
      console.error('Error getting leave requests by branch:', error);
      throw error;
    }
  }

  // Get pending leave requests for a branch
  async getPendingLeaveRequests(branchId) {
    return this.getLeaveRequestsByBranch(branchId, LEAVE_STATUS.PENDING);
  }

  // Approve a leave request
  async approveLeaveRequest(leaveRequestId, approvedBy, approvedByName, notes = '') {
    try {
      const leaveRef = doc(db, this.collectionName, leaveRequestId);
      const leaveDoc = await getDoc(leaveRef);

      if (!leaveDoc.exists()) {
        throw new Error('Leave request not found');
      }

      const currentLeave = leaveDoc.data();

      if (currentLeave.status !== LEAVE_STATUS.PENDING) {
        throw new Error('Only pending leave requests can be approved');
      }

      // Add to history
      const historyEntry = {
        action: 'approved',
        by: approvedBy,
        timestamp: new Date().toISOString(),
        notes: notes || 'Leave request approved'
      };

      await updateDoc(leaveRef, {
        status: LEAVE_STATUS.APPROVED,
        approvedBy,
        approvedByName,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        history: [...(currentLeave.history || []), historyEntry]
      });

      return {
        success: true,
        message: 'Leave request approved successfully'
      };
    } catch (error) {
      console.error('Error approving leave request:', error);
      throw error;
    }
  }

  // Deny a leave request
  async denyLeaveRequest(leaveRequestId, deniedBy, deniedByName, deniedReason, notes = '') {
    try {
      const leaveRef = doc(db, this.collectionName, leaveRequestId);
      const leaveDoc = await getDoc(leaveRef);

      if (!leaveDoc.exists()) {
        throw new Error('Leave request not found');
      }

      const currentLeave = leaveDoc.data();

      if (currentLeave.status !== LEAVE_STATUS.PENDING) {
        throw new Error('Only pending leave requests can be denied');
      }

      // Add to history
      const historyEntry = {
        action: 'denied',
        by: deniedBy,
        timestamp: new Date().toISOString(),
        notes: notes || 'Leave request denied'
      };

      await updateDoc(leaveRef, {
        status: LEAVE_STATUS.DENIED,
        approvedBy: deniedBy,
        approvedByName: deniedByName,
        deniedReason,
        updatedAt: serverTimestamp(),
        history: [...(currentLeave.history || []), historyEntry]
      });

      return {
        success: true,
        message: 'Leave request denied successfully'
      };
    } catch (error) {
      console.error('Error denying leave request:', error);
      throw error;
    }
  }

  // Cancel a leave request (by employee)
  async cancelLeaveRequest(leaveRequestId, cancelledBy, notes = '') {
    try {
      const leaveRef = doc(db, this.collectionName, leaveRequestId);
      const leaveDoc = await getDoc(leaveRef);

      if (!leaveDoc.exists()) {
        throw new Error('Leave request not found');
      }

      const currentLeave = leaveDoc.data();

      if (currentLeave.status === LEAVE_STATUS.APPROVED) {
        // Check if leave has already started
        const today = new Date();
        const startDate = new Date(currentLeave.startDate);
        
        if (today >= startDate) {
          throw new Error('Cannot cancel leave that has already started');
        }
      }

      if (currentLeave.status === LEAVE_STATUS.CANCELLED) {
        throw new Error('Leave request is already cancelled');
      }

      // Add to history
      const historyEntry = {
        action: 'cancelled',
        by: cancelledBy,
        timestamp: new Date().toISOString(),
        notes: notes || 'Leave request cancelled'
      };

      await updateDoc(leaveRef, {
        status: LEAVE_STATUS.CANCELLED,
        updatedAt: serverTimestamp(),
        history: [...(currentLeave.history || []), historyEntry]
      });

      return {
        success: true,
        message: 'Leave request cancelled successfully'
      };
    } catch (error) {
      console.error('Error cancelling leave request:', error);
      throw error;
    }
  }

  // Get leave requests for a specific date range
  async getLeaveRequestsByDateRange(branchId, startDate, endDate) {
    try {
      // Get all approved leave requests for the branch
      const q = query(
        collection(db, this.collectionName),
        where('branchId', '==', branchId),
        where('status', '==', LEAVE_STATUS.APPROVED)
      );

      const querySnapshot = await getDocs(q);
      const leaveRequests = [];

      querySnapshot.forEach((doc) => {
        const leaveRequest = LeaveRequestModel.fromFirestore(doc);
        
        // Filter by date range
        const leaveStart = new Date(leaveRequest.startDate);
        const leaveEnd = new Date(leaveRequest.endDate);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(endDate);

        // Check if leave overlaps with the date range
        if (leaveStart <= rangeEnd && leaveEnd >= rangeStart) {
          leaveRequests.push(leaveRequest);
        }
      });

      // Sort by start date
      leaveRequests.sort((a, b) => {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return dateA - dateB;
      });

      return {
        success: true,
        leaveRequests
      };
    } catch (error) {
      console.error('Error getting leave requests by date range:', error);
      throw error;
    }
  }

  // Check for overlapping leave requests
  async checkForOverlappingLeaves(leaveRequest) {
    try {
      // Get all leave requests for the employee
      const q = query(
        collection(db, this.collectionName),
        where('employeeId', '==', leaveRequest.employeeId)
      );

      const querySnapshot = await getDocs(q);
      const overlappingLeaves = [];

      querySnapshot.forEach((doc) => {
        const existingLeave = LeaveRequestModel.fromFirestore(doc);
        
        // Skip the same leave request if updating
        if (existingLeave.id === leaveRequest.id) {
          return;
        }

        // Only check APPROVED leaves for conflicts
        // Pending leaves can be overridden by direct approval
        if (existingLeave.status !== LEAVE_STATUS.APPROVED) {
          return;
        }

        const existingStart = new Date(existingLeave.startDate);
        const existingEnd = new Date(existingLeave.endDate);
        const newStart = new Date(leaveRequest.startDate);
        const newEnd = new Date(leaveRequest.endDate);

        // Check for overlap
        if (newStart <= existingEnd && newEnd >= existingStart) {
          overlappingLeaves.push(existingLeave);
        }
      });

      if (overlappingLeaves.length > 0) {
        throw new Error(`Overlapping approved leave found: ${overlappingLeaves[0].getFormattedDateRange()}`);
      }

      return true;
    } catch (error) {
      console.error('Error checking for overlapping leaves:', error);
      throw error;
    }
  }

  // Cancel overlapping pending leaves when a direct approval is made
  async cancelOverlappingPendingLeaves(approvedLeave) {
    try {
      // Get all pending leave requests for the employee
      const q = query(
        collection(db, this.collectionName),
        where('employeeId', '==', approvedLeave.employeeId),
        where('status', '==', LEAVE_STATUS.PENDING)
      );

      const querySnapshot = await getDocs(q);
      const overlappingPendingLeaves = [];

      querySnapshot.forEach((doc) => {
        const existingLeave = LeaveRequestModel.fromFirestore(doc);
        
        const existingStart = new Date(existingLeave.startDate);
        const existingEnd = new Date(existingLeave.endDate);
        const newStart = new Date(approvedLeave.startDate);
        const newEnd = new Date(approvedLeave.endDate);

        // Check for overlap
        if (newStart <= existingEnd && newEnd >= existingStart) {
          overlappingPendingLeaves.push({ id: doc.id, leave: existingLeave });
        }
      });

      // Cancel overlapping pending leaves
      for (const { id, leave } of overlappingPendingLeaves) {
        const leaveRef = doc(db, this.collectionName, id);
        await updateDoc(leaveRef, {
          status: LEAVE_STATUS.CANCELLED,
          updatedAt: serverTimestamp(),
          history: [...(leave.history || []), {
            action: 'cancelled',
            by: approvedLeave.createdBy,
            timestamp: new Date().toISOString(),
            notes: 'Cancelled due to direct leave approval for overlapping period'
          }]
        });
      }

      return overlappingPendingLeaves.length;
    } catch (error) {
      console.error('Error cancelling overlapping pending leaves:', error);
      // Don't throw error - this is a cleanup operation
      return 0;
    }
  }

  // Get leave statistics for a branch
  async getLeaveStatistics(branchId, startDate, endDate) {
    try {
      const { leaveRequests } = await this.getLeaveRequestsByDateRange(branchId, startDate, endDate);
      
      const stats = {
        total: leaveRequests.length,
        byType: {},
        byStatus: {},
        byMonth: {},
        upcoming: 0,
        active: 0
      };

      leaveRequests.forEach(leave => {
        // Count by type
        stats.byType[leave.leaveType] = (stats.byType[leave.leaveType] || 0) + 1;
        
        // Count by status
        stats.byStatus[leave.status] = (stats.byStatus[leave.status] || 0) + 1;
        
        // Count by month
        const month = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
        
        // Count upcoming and active
        if (leave.isUpcoming()) {
          stats.upcoming++;
        }
        if (leave.isActive()) {
          stats.active++;
        }
      });

      return {
        success: true,
        statistics: stats
      };
    } catch (error) {
      console.error('Error getting leave statistics:', error);
      throw error;
    }
  }

  // Delete a leave request (admin only)
  async deleteLeaveRequest(leaveRequestId) {
    try {
      await deleteDoc(doc(db, this.collectionName, leaveRequestId));
      
      return {
        success: true,
        message: 'Leave request deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting leave request:', error);
      throw error;
    }
  }
}

export const leaveService = new LeaveService();
