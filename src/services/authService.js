  import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ROLES, hasPermission, getAvailableRoles } from '../utils/roles';

// Auth service class
class AuthService {
  constructor() {
    this.auth = auth;
    this.db = db;
  }

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      
      // Enforce email verification
      if (!user.emailVerified) {
        // Sign out immediately and throw a specific error code
        await this.signOut();
        const error = new Error('Please verify your email address to continue.');
        error.code = 'auth/email-not-verified';
        throw error;
      }

      const userData = await this.getUserData(user.uid);
      
      if (!userData || !userData.isActive) {
        await this.signOut();
        throw new Error('Account is inactive or not found');
      }

      return {
        user: user,
        userData
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Register new user (only clients can self-register)
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      // Force client role for self-registration
      const newUserData = {
        uid: user.uid,
        email: user.email,
        name: userData.name,
        roles: [ROLES.CLIENT], // Array of roles - always client for self-registration
        primaryRole: ROLES.CLIENT, // Primary role for display purposes
        currentRole: ROLES.CLIENT, // Currently active role
        branchId: null, // Clients don't have branch assignments initially
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: userData.phone || '',
        address: userData.address || ''
      };

      await setDoc(doc(this.db, 'users', user.uid), newUserData);

      // Send email verification
      await sendEmailVerification(user);

      return {
        user,
        userData: newUserData
      };
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Resend verification email by signing in temporarily with credentials
  async resendVerification(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await this.signOut();
      return true;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update password
  async updatePassword(newPassword) {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user logged in');
      
      await updatePassword(user, newPassword);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: profileData.name
      });

      // Update Firestore user data
      const userRef = doc(this.db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: new Date()
      });

      return await this.getUserData(user.uid);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user data
  async getCurrentUser() {
    return this.auth.currentUser;
  }

  // Get user data from Firestore
  async getUserData(uid) {
    try {
      const userDoc = await getDoc(doc(this.db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Auth state change listener
  onAuthStateChanged(callback) {
    return onAuthStateChanged(this.auth, callback);
  }

  // Check if user has permission
  hasPermission(userRole, permission) {
    return hasPermission(userRole, permission);
  }

  // Switch user's current role
  async switchRole(userId, newRole) {
    try {
      const userRef = doc(this.db, 'users', userId);
      await updateDoc(userRef, {
        currentRole: newRole,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // Get user's available roles for switching
  getAvailableRolesForUser(userRoles) {
    const availableRoles = [];
    
    // User can always access their own roles
    availableRoles.push(...userRoles);
    
    // Check what other roles they can switch to based on their primary role
    userRoles.forEach(role => {
      const switchableRoles = getAvailableRoles(role);
      switchableRoles.forEach(switchableRole => {
        if (!availableRoles.includes(switchableRole)) {
          availableRoles.push(switchableRole);
        }
      });
    });
    
    return availableRoles;
  }

  // Error handling
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/email-not-verified': 'Please verify your email address to continue.'
    };

    const normalized = new Error(errorMessages[error.code] || error.message);
    normalized.code = error.code;
    return normalized;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
