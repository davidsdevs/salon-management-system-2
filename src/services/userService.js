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
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  deleteUser as deleteAuthUser,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { ROLES, canManageUser } from '../utils/roles';

class UserService {
  constructor() {
    this.db = db;
    this.collection = 'users';
  }

  // Generate a temporary password
  generateTemporaryPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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

  // Create new user (Alternative approach - no logout)
  async createUser(userData, currentUserRole) {
    try {
      // Check if current user can create users with this role
      if (!canManageUser(currentUserRole, userData.role)) {
        throw new Error('Insufficient permissions to create user with this role');
      }

      // For now, create user in Firestore only
      // The user will need to register themselves via the login page
      const primaryRole = Array.isArray(userData.roles) && userData.roles.length > 0 
        ? userData.roles[0] 
        : userData.role;

      const newUser = {
        ...userData,
        role: primaryRole,
        roles: userData.roles || [primaryRole],
        isActive: true,
        needsRegistration: true, // Flag indicating user needs to register
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

  // Alternative method: Create user with Firebase Auth (causes logout)
  async createUserWithAuth(userData, currentUserRole) {
    try {
      // Check if current user can create users with this role
      if (!canManageUser(currentUserRole, userData.role)) {
        throw new Error('Insufficient permissions to create user with this role');
      }

      // Store current user info before creating new user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();

      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        temporaryPassword
      );

      // Update the user's display name
      const fullName = `${userData.firstName} ${userData.middleName ? userData.middleName + ' ' : ''}${userData.lastName}`.trim();
      await updateProfile(userCredential.user, {
        displayName: fullName
      });

      // Send password reset email so user can set their own password
      await sendPasswordResetEmail(auth, userData.email);

      // Store user data in Firestore with Firebase Auth UID
      const primaryRole = Array.isArray(userData.roles) && userData.roles.length > 0 
        ? userData.roles[0] 
        : userData.role;

      const newUser = {
        ...userData,
        role: primaryRole,
        roles: userData.roles || [primaryRole],
        uid: userCredential.user.uid,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(this.db, this.collection), newUser);
      
      // Sign out the newly created user
      await signOut(auth);
      
      // Note: The current user will be logged out due to Firebase Auth limitations
      // This is expected behavior when creating users from the client side
      console.log('User created successfully in both Firestore and Firebase Auth.');
      console.log('Current user has been signed out. Please sign in again to continue.');
      
      return {
        id: docRef.id,
        uid: userCredential.user.uid,
        ...newUser,
        requiresReauth: true // Flag to indicate re-authentication is needed
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

      // Note: We can't delete Firebase Auth users from client side
      // The Firebase Auth account will remain but the user will be marked as inactive
      // To fully delete the Firebase Auth account, you would need to use Firebase Functions
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
      // Get all users first, then apply all filters client-side for independence
      const q = query(collection(this.db, this.collection));
      const snapshot = await getDocs(q);
      const users = [];
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        
        // Filter by permissions first
        if (!this.canViewUser(currentUserRole, userData)) return;
        
        // Apply all filters independently
        let passesAllFilters = true;
        
        // Search term filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const fullName = `${userData.firstName || ''} ${userData.middleName || ''} ${userData.lastName || ''}`.trim().toLowerCase();
          const matchesSearch = 
            fullName.includes(searchLower) ||
            userData.firstName?.toLowerCase().includes(searchLower) ||
            userData.middleName?.toLowerCase().includes(searchLower) ||
            userData.lastName?.toLowerCase().includes(searchLower) ||
            userData.email?.toLowerCase().includes(searchLower) ||
            userData.phone?.toLowerCase().includes(searchLower) ||
            userData.role?.toLowerCase().includes(searchLower) ||
            userData.branchId?.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) passesAllFilters = false;
        }
        
        // Role filter
        if (filters.role && userData.role !== filters.role) {
          passesAllFilters = false;
        }
        
        // Branch ID filter
        if (filters.branchId && userData.branchId !== filters.branchId) {
          passesAllFilters = false;
        }
        
        // Active status filter
        if (filters.isActive !== undefined && userData.isActive !== filters.isActive) {
          passesAllFilters = false;
        }
        
        if (passesAllFilters) {
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

  // Get users by role
  async getUsersByRole(role) {
    try {
      console.log('Getting users with role:', role);
      
      const q = query(
        collection(this.db, this.collection),
        where('role', '==', role),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const users = [];
      
      console.log('Found', snapshot.size, 'users with role', role);
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        users.push({
          id: doc.id,
          ...userData
        });
      });

      console.log('Returning', users.length, 'users');
      return users;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  }

  // Get users by branch
  async getUsersByBranch(branchId, currentUserRole) {
    try {
      console.log('Getting users for branch:', branchId, 'with role:', currentUserRole);
      
      const q = query(
        collection(this.db, this.collection),
        where('branchId', '==', branchId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const users = [];
      
      console.log('Found', snapshot.size, 'users in branch');
      
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (this.canViewUser(currentUserRole, userData)) {
          users.push({
            id: doc.id,
            ...userData
          });
        }
      });

      console.log('Returning', users.length, 'users after permission check');
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

  // Assign user to branch
  async assignUserToBranch(userId, branchId, currentUserRole, currentUserId) {
    try {
      if (!this.canManageUser(currentUserRole, null, currentUserId)) {
        throw new Error('You do not have permission to assign users to branches');
      }

      const userRef = doc(this.db, this.collection, userId);
      await updateDoc(userRef, {
        branchId: branchId,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error assigning user to branch:', error);
      throw error;
    }
  }

  // Remove user from branch
  async removeUserFromBranch(userId, currentUserRole, currentUserId) {
    try {
      if (!this.canManageUser(currentUserRole, null, currentUserId)) {
        throw new Error('You do not have permission to remove users from branches');
      }

      const userRef = doc(this.db, this.collection, userId);
      await updateDoc(userRef, {
        branchId: null,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error removing user from branch:', error);
      throw error;
    }
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
        
        await updateDoc(userRef, {
          roles: updatedRoles,
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