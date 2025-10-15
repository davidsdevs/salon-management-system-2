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
import { ROLES, canManageUser } from '../utils/roles';

class UserService {
  constructor() {
    this.db = db;
    this.collection = 'users';
  }

  // Get all users (with pagination)
  async getUsers(currentUserRole, currentUserId, pageSize = 20, lastDoc = null) {
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
      const users = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        // Filter users based on role permissions
        if (this.canViewUser(currentUserRole, userData)) {
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });

      return {
        users,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(this.db, this.collection, userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }

  // Create new user
  async createUser(userData, currentUserRole) {
    try {
      // Check if current user can create users with this role
      if (!canManageUser(currentUserRole, userData.role)) {
        throw new Error('Insufficient permissions to create user with this role');
      }

      const newUser = {
        ...userData,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.collection), newUser);
      
      return {
        id: docRef.id,
        ...newUser
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  async updateUser(userId, updateData, currentUserRole) {
    try {
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentUserData = userDoc.data();

      // Check if current user can manage this user
      if (!canManageUser(currentUserRole, currentUserData.role)) {
        throw new Error('Insufficient permissions to update this user');
      }

      // Check if trying to change role
      if (updateData.role && updateData.role !== currentUserData.role) {
        if (!canManageUser(currentUserRole, updateData.role)) {
          throw new Error('Insufficient permissions to assign this role');
        }
      }

      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedData);
      
      return {
        id: userId,
        ...currentUserData,
        ...updatedData
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (soft delete by setting isActive to false)
  async deleteUser(userId, currentUserRole) {
    try {
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      // Check if current user can manage this user
      if (!canManageUser(currentUserRole, userData.role)) {
        throw new Error('Insufficient permissions to delete this user');
      }

      await updateDoc(userRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Reactivate user
  async reactivateUser(userId, currentUserRole) {
    try {
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();

      // Check if current user can manage this user
      if (!canManageUser(currentUserRole, userData.role)) {
        throw new Error('Insufficient permissions to reactivate this user');
      }

      await updateDoc(userRef, {
        isActive: true,
        reactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error reactivating user:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, currentUserRole, filters = {}) {
    try {
      let q = query(collection(this.db, this.collection));

      // Add filters
      if (filters.role) {
        q = query(q, where('role', '==', filters.role));
      }
      if (filters.branchId) {
        q = query(q, where('branchId', '==', filters.branchId));
      }
      if (filters.isActive !== undefined) {
        q = query(q, where('isActive', '==', filters.isActive));
      }

      const snapshot = await getDocs(q);
      const users = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Filter by search term
        const matchesSearch = !searchTerm || 
          userData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userData.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Filter by permissions
        if (matchesSearch && this.canViewUser(currentUserRole, userData)) {
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });

      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get users by branch
  async getUsersByBranch(branchId, currentUserRole) {
    try {
      const q = query(
        collection(this.db, this.collection),
        where('branchId', '==', branchId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const users = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (this.canViewUser(currentUserRole, userData)) {
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });

      return users;
    } catch (error) {
      console.error('Error getting users by branch:', error);
      throw error;
    }
  }

  // Helper method to check if user can view another user
  canViewUser(currentUserRole, targetUserData) {
    // System admin can view all users
    if (currentUserRole === ROLES.SYSTEM_ADMIN) {
      return true;
    }

    // Operational Manager can view all users
    if (currentUserRole === ROLES.OPERATIONAL_MANAGER) {
      return true;
    }

    // Branch admin and manager can view users in their branch
    if ([ROLES.BRANCH_ADMIN, ROLES.BRANCH_MANAGER].includes(currentUserRole)) {
      return true; // Will be filtered by branch in the query
    }

    // Other roles can only view themselves
    return false;
  }

  // Get user statistics
  async getUserStats(currentUserRole) {
    try {
      const q = query(collection(this.db, this.collection));
      const snapshot = await getDocs(q);
      
      const stats = {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: {}
      };

      snapshot.forEach((doc) => {
        const userData = doc.data();
        
        if (this.canViewUser(currentUserRole, userData)) {
          stats.total++;
          
          if (userData.isActive) {
            stats.active++;
          } else {
            stats.inactive++;
          }

          const role = userData.role || 'unknown';
          stats.byRole[role] = (stats.byRole[role] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Assign multiple roles to a user
  async assignMultipleRoles(userId, roles, currentUserRole) {
    try {
      // Check if current user can manage this user
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (!this.canManageUser(currentUserRole, userData.role)) {
        throw new Error('You do not have permission to manage this user');
      }
      
      // Validate roles
      const validRoles = Object.values(ROLES);
      const invalidRoles = roles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: ${invalidRoles.join(', ')}`);
      }
      
      // Update user with multiple roles
      await updateDoc(userRef, {
        roles: roles,
        primaryRole: roles[0], // First role is primary
        currentRole: roles[0], // Set current role to primary
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error('Error assigning multiple roles:', error);
      throw error;
    }
  }

  // Add a role to an existing user
  async addRoleToUser(userId, newRole, currentUserRole) {
    try {
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (!this.canManageUser(currentUserRole, userData.role)) {
        throw new Error('You do not have permission to manage this user');
      }
      
      // Get existing roles
      const existingRoles = userData.roles || [userData.role];
      
      // Add new role if not already present
      if (!existingRoles.includes(newRole)) {
        const updatedRoles = [...existingRoles, newRole];
        
        await updateDoc(userRef, {
          roles: updatedRoles,
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error adding role to user:', error);
      throw error;
    }
  }

  // Remove a role from a user
  async removeRoleFromUser(userId, roleToRemove, currentUserRole) {
    try {
      const userRef = doc(this.db, this.collection, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      if (!this.canManageUser(currentUserRole, userData.role)) {
        throw new Error('You do not have permission to manage this user');
      }
      
      // Get existing roles
      const existingRoles = userData.roles || [userData.role];
      
      // Remove role if present
      if (existingRoles.includes(roleToRemove)) {
        const updatedRoles = existingRoles.filter(role => role !== roleToRemove);
        
        // Ensure user has at least one role
        if (updatedRoles.length === 0) {
          throw new Error('User must have at least one role');
        }
        
        // Update current role if it was removed
        const newCurrentRole = userData.currentRole === roleToRemove ? updatedRoles[0] : userData.currentRole;
        
        await updateDoc(userRef, {
          roles: updatedRoles,
          currentRole: newCurrentRole,
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
export default userService;
