import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ROLES } from '../utils/roles';

class BranchService {
  constructor() {
    this.db = db;
    this.collection = 'branches';
  }

  // Get all branches (with pagination)
  async getBranches(currentUserRole, currentUserId, pageSize = 20, lastDoc = null) {
    try {
      let q = query(
        collection(this.db, this.collection),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const branches = [];

      snapshot.forEach((doc) => {
        const branchData = doc.data();
        
        if (this.canViewBranch(currentUserRole, branchData, currentUserId)) {
          branches.push({
            id: doc.id,
            ...branchData
          });
        }
      });

      return branches;
    } catch (error) {
      console.error('Error getting branches:', error);
      throw error;
    }
  }

  // Get branch by ID
  async getBranch(branchId, currentUserRole, currentUserId) {
    try {
      const branchRef = doc(this.db, this.collection, branchId);
      const branchDoc = await getDoc(branchRef);
      
      if (!branchDoc.exists()) {
        throw new Error('Branch not found');
      }
      
      const branchData = branchDoc.data();
      
      if (!this.canViewBranch(currentUserRole, branchData, currentUserId)) {
        throw new Error('You do not have permission to view this branch');
      }
      
      return {
        id: branchDoc.id,
        ...branchData
      };
    } catch (error) {
      console.error('Error getting branch:', error);
      throw error;
    }
  }

  // Create new branch
  async createBranch(branchData, currentUserRole, currentUserId) {
    try {
      if (!this.canManageBranch(currentUserRole)) {
        throw new Error('You do not have permission to create branches');
      }

      const newBranch = {
        name: branchData.name,
        address: branchData.address,
        contactNumber: branchData.contactNumber,
        operatingHours: branchData.operatingHours || this.getDefaultOperatingHours(),
        holidays: branchData.holidays || [],
        services: branchData.services || [],
        branchAdminId: branchData.branchAdminId || null,
        managerId: branchData.managerId || null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.collection), newBranch);
      
      return {
        id: docRef.id,
        ...newBranch
      };
    } catch (error) {
      console.error('Error creating branch:', error);
      throw error;
    }
  }

  // Update branch
  async updateBranch(branchId, updateData, currentUserRole, currentUserId) {
    try {
      const branchRef = doc(this.db, this.collection, branchId);
      const branchDoc = await getDoc(branchRef);
      
      if (!branchDoc.exists()) {
        throw new Error('Branch not found');
      }
      
      const branchData = branchDoc.data();
      
      if (!this.canManageBranch(currentUserRole, branchData, currentUserId)) {
        throw new Error('You do not have permission to update this branch');
      }

      await updateDoc(branchRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  }

  // Deactivate branch
  async deactivateBranch(branchId, currentUserRole, currentUserId) {
    try {
      if (!this.canManageBranch(currentUserRole)) {
        throw new Error('You do not have permission to deactivate branches');
      }

      const branchRef = doc(this.db, this.collection, branchId);
      await updateDoc(branchRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deactivating branch:', error);
      throw error;
    }
  }

  // Activate branch
  async activateBranch(branchId, currentUserRole, currentUserId) {
    try {
      if (!this.canManageBranch(currentUserRole)) {
        throw new Error('You do not have permission to activate branches');
      }

      const branchRef = doc(this.db, this.collection, branchId);
      await updateDoc(branchRef, {
        isActive: true,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error activating branch:', error);
      throw error;
    }
  }

  // Get branch statistics
  async getBranchStats(currentUserRole, currentUserId) {
    try {
      const q = query(collection(this.db, this.collection));
      const snapshot = await getDocs(q);
      
      const stats = {
        total: 0,
        active: 0,
        inactive: 0
      };

      snapshot.forEach((doc) => {
        const branchData = doc.data();
        
        if (this.canViewBranch(currentUserRole, branchData, currentUserId)) {
          stats.total++;
          
          if (branchData.isActive) {
            stats.active++;
          } else {
            stats.inactive++;
          }
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting branch stats:', error);
      throw error;
    }
  }

  // Get default operating hours
  getDefaultOperatingHours() {
    return {
      monday: { open: "09:00", close: "18:00" },
      tuesday: { open: "09:00", close: "18:00" },
      wednesday: { open: "09:00", close: "18:00" },
      thursday: { open: "09:00", close: "18:00" },
      friday: { open: "09:00", close: "18:00" },
      saturday: { open: "09:00", close: "17:00" },
      sunday: { open: "10:00", close: "16:00" }
    };
  }

  // Permission checks
  canViewBranch(currentUserRole, branchData, currentUserId) {
    // System Admin can view all branches
    if (currentUserRole === ROLES.SYSTEM_ADMIN) {
      return true;
    }
    
    // Operational Manager can view all branches
    if (currentUserRole === ROLES.OPERATIONAL_MANAGER) {
      return true;
    }
    
    // Branch Admin can view their assigned branch
    if (currentUserRole === ROLES.BRANCH_ADMIN && branchData.branchAdminId === currentUserId) {
      return true;
    }
    
    // Branch Manager can view their assigned branch
    if (currentUserRole === ROLES.BRANCH_MANAGER && branchData.managerId === currentUserId) {
      return true;
    }
    
    // Other roles can view active branches
    return branchData.isActive;
  }

  canManageBranch(currentUserRole, branchData = null, currentUserId = null) {
    // System Admin can manage all branches
    if (currentUserRole === ROLES.SYSTEM_ADMIN) {
      return true;
    }
    
    // Operational Manager can manage all branches
    if (currentUserRole === ROLES.OPERATIONAL_MANAGER) {
      return true;
    }
    
    // Branch Admin can manage their assigned branch
    if (currentUserRole === ROLES.BRANCH_ADMIN && branchData && branchData.branchAdminId === currentUserId) {
      return true;
    }
    
    return false;
  }
}

// Export singleton instance
export const branchService = new BranchService();
export default branchService;

