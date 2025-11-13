// src/services/activityLogService.js
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

class ActivityLogService {
  constructor() {
    this.collection = 'activityLogs';
  }

  /**
   * Create an activity log entry
   * @param {Object} logData - Activity log data
   * @param {string} logData.module - Module name (e.g., 'stocks', 'transactions')
   * @param {string} logData.action - Action type (e.g., 'create', 'update', 'adjust', 'delete')
   * @param {string} logData.entityType - Entity type (e.g., 'stock', 'product')
   * @param {string} logData.entityId - Entity ID
   * @param {string} logData.entityName - Entity name (e.g., product name)
   * @param {string} logData.branchId - Branch ID
   * @param {string} logData.branchName - Branch name
   * @param {string} logData.userId - User ID who performed the action
   * @param {string} logData.userName - User name who performed the action
   * @param {string} logData.userRole - User role
   * @param {Object} logData.changes - Object describing what changed (before/after)
   * @param {string} logData.reason - Reason for the action (optional)
   * @param {string} logData.notes - Additional notes (optional)
   * @param {Object} logData.metadata - Additional metadata (optional)
   * @returns {Promise<string>} - Activity log ID
   */
  async createActivityLog(logData) {
    try {
      const logRef = await addDoc(collection(db, this.collection), {
        module: String(logData.module || ''),
        action: String(logData.action || ''),
        entityType: String(logData.entityType || ''),
        entityId: String(logData.entityId || ''),
        entityName: String(logData.entityName || ''),
        branchId: String(logData.branchId || ''),
        branchName: String(logData.branchName || ''),
        userId: String(logData.userId || ''),
        userName: String(logData.userName || ''),
        userRole: String(logData.userRole || ''),
        changes: logData.changes || {},
        reason: String(logData.reason || ''),
        notes: String(logData.notes || ''),
        metadata: logData.metadata || {},
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });
      
      return logRef.id;
    } catch (error) {
      console.error('Error creating activity log:', error);
      throw new Error('Failed to create activity log');
    }
  }

  /**
   * Get activity logs with filters
   * @param {Object} filters - Filter options
   * @param {string} filters.module - Filter by module
   * @param {string} filters.action - Filter by action
   * @param {string} filters.entityType - Filter by entity type
   * @param {string} filters.entityId - Filter by entity ID
   * @param {string} filters.branchId - Filter by branch ID
   * @param {string} filters.userId - Filter by user ID
   * @param {Date} filters.startDate - Start date filter
   * @param {Date} filters.endDate - End date filter
   * @param {number} filters.limit - Limit number of results
   * @param {Object} filters.startAfter - Document to start after (for pagination)
   * @returns {Promise<Object>} - { success, logs, hasMore }
   */
  async getActivityLogs(filters = {}) {
    try {
      let q = query(collection(db, this.collection));

      // Apply filters
      if (filters.module) {
        q = query(q, where('module', '==', filters.module));
      }
      if (filters.action) {
        q = query(q, where('action', '==', filters.action));
      }
      if (filters.entityType) {
        q = query(q, where('entityType', '==', filters.entityType));
      }
      if (filters.entityId) {
        q = query(q, where('entityId', '==', filters.entityId));
      }
      if (filters.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
      }
      if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
      }

      // Order by timestamp descending (newest first)
      q = query(q, orderBy('timestamp', 'desc'));

      // Apply date filters (client-side for simplicity)
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      if (filters.startAfter) {
        q = query(q, startAfter(filters.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const logs = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate 
          ? data.createdAt.toDate() 
          : (data.timestamp?.toDate ? data.timestamp.toDate() : new Date());
        
        // Apply date filters client-side
        if (filters.startDate) {
          const startDate = filters.startDate instanceof Date ? filters.startDate : new Date(filters.startDate);
          if (createdAt < startDate) return;
        }
        if (filters.endDate) {
          const endDate = filters.endDate instanceof Date ? filters.endDate : new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (createdAt > endDate) return;
        }

        logs.push({
          id: doc.id,
          ...data,
          createdAt,
          timestamp: createdAt
        });
      });

      // Sort by timestamp descending (newest first)
      logs.sort((a, b) => {
        const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
        const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
        return bTime - aTime;
      });

      const hasMore = querySnapshot.docs.length === (filters.limit || 100);

      return { 
        success: true, 
        logs,
        hasMore
      };
    } catch (error) {
      console.error('Error getting activity logs:', error);
      return { 
        success: false, 
        message: error.message, 
        logs: [],
        hasMore: false
      };
    }
  }

  /**
   * Get activity logs for a specific entity (e.g., stock history for a product)
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - { success, logs }
   */
  async getEntityActivityLogs(entityType, entityId, filters = {}) {
    return this.getActivityLogs({
      ...filters,
      entityType,
      entityId
    });
  }

  /**
   * Get activity logs for a specific module (e.g., all stock activities)
   * @param {string} module - Module name
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - { success, logs }
   */
  async getModuleActivityLogs(module, filters = {}) {
    return this.getActivityLogs({
      ...filters,
      module
    });
  }

  /**
   * Get activity logs for a specific branch
   * @param {string} branchId - Branch ID
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - { success, logs }
   */
  async getBranchActivityLogs(branchId, filters = {}) {
    return this.getActivityLogs({
      ...filters,
      branchId
    });
  }

  /**
   * Get activity logs for a specific date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} - { success, logs }
   */
  async getActivityLogsByDateRange(startDate, endDate, filters = {}) {
    return this.getActivityLogs({
      ...filters,
      startDate,
      endDate
    });
  }
}

export const activityLogService = new ActivityLogService();
export default activityLogService;









