import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        setLoading(true);
        setError(null);

        if (firebaseUser) {
          // Get user data from Firestore
          const userData = await authService.getUserData(firebaseUser.uid);
          
          if (userData && userData.isActive) {
            // Check for stored role preference
            const storedRole = localStorage.getItem('selectedRole');
            let processedUserData = userData;
            
            // If user has multiple roles and a stored role preference
            if (userData.roles && userData.roles.length > 1 && storedRole && userData.roles.includes(storedRole)) {
              // Reorder roles to put stored role first
              const reorderedRoles = [storedRole, ...userData.roles.filter(role => role !== storedRole)];
              processedUserData = {
                ...userData,
                roles: reorderedRoles
              };
            }
            
            setUser(firebaseUser);
            setUserData(processedUserData);
          } else {
            // User is inactive or not found
            setUser(null);
            setUserData(null);
            await authService.signOut();
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError(error.message);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign in
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.signIn(email, password);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (email, password, userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authService.register(email, password, userData);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear stored role preference
      localStorage.removeItem('selectedRole');
      
      await authService.signOut();
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await authService.resetPassword(email);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setError(null);
      await authService.updatePassword(newPassword);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUserData = await authService.updateProfile(profileData);
      setUserData(updatedUserData);
      return updatedUserData;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    try {
      if (user) {
        const userData = await authService.getUserData(user.uid);
        
        // Check for stored role preference
        const storedRole = localStorage.getItem('selectedRole');
        let processedUserData = userData;
        
        // If user has multiple roles and a stored role preference
        if (userData.roles && userData.roles.length > 1 && storedRole && userData.roles.includes(storedRole)) {
          // Reorder roles to put stored role first
          const reorderedRoles = [storedRole, ...userData.roles.filter(role => role !== storedRole)];
          processedUserData = {
            ...userData,
            roles: reorderedRoles
          };
        }
        
        setUserData(processedUserData);
        return processedUserData;
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      setError(error.message);
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!userData) return false;
    return authService.hasPermission(userData.roles?.[0], permission);
  };

  // Check if user has role
  const hasRole = (role) => {
    return userData?.role === role;
  };

  // Check if user has any of the roles
  const hasAnyRole = (roles) => {
    return roles.includes(userData?.role);
  };

  // Get user's branch ID
  const getUserBranchId = () => {
    return userData?.branchId;
  };

  // Check if user is admin
  const isAdmin = () => {
    const adminRoles = ['systemAdmin', 'franchiseOwner', 'branchAdmin', 'branchManager'];
    return adminRoles.includes(userData?.role);
  };

  // Check if user is staff
  const isStaff = () => {
    const staffRoles = ['receptionist', 'inventoryController', 'stylist'];
    return staffRoles.includes(userData?.role);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Switch user's current role (for login role selection)
  const switchRole = async (newRole) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Check if user has this role
      const userRoles = userData.roles || [];
      if (!userRoles.includes(newRole)) {
        throw new Error('You do not have this role assigned');
      }
      
      // Store the selected role in localStorage for persistence
      localStorage.setItem('selectedRole', newRole);
      
      // Move the selected role to the front of the roles array
      const updatedRoles = [newRole, ...userRoles.filter(role => role !== newRole)];
      
      // Update local userData with reordered roles
      setUserData(prev => ({
        ...prev,
        roles: updatedRoles
      }));
      
      return true;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const value = {
    // State
    user,
    userData,
    loading,
    error,
    
    // Auth methods
    signIn,
    register,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserData,
    
    // Permission methods
    hasPermission,
    hasRole,
    hasAnyRole,
    getUserBranchId,
    isAdmin,
    isStaff,
    
    // Utility methods
    clearError,
    
    // Role switching methods
    switchRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};  
