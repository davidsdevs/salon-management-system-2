import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES, hasPermission, hasRoleAccess } from '../../utils/roles';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null, allowedRoles = null }) => {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user account is active
  if (!userData.isActive) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Get current role (support both old and new structure)
  const currentRole = userData.currentRole || userData.role;
  const userRoles = userData.roles || [userData.role];

  // Check required role
  if (requiredRole) {
    if (!userRoles.includes(requiredRole) && !hasRoleAccess(currentRole, requiredRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check allowedRoles array (for StaffRoute)
  if (allowedRoles) {
    const hasAllowedRole = userRoles.some(r => allowedRoles.includes(r)) || allowedRoles.includes(currentRole);
    if (!hasAllowedRole) return <Navigate to="/unauthorized" replace />;
  }

  // Check required permission
  if (requiredPermission) {
    const hasPerm = userRoles.some(role => hasPermission(role, requiredPermission)) || hasPermission(currentRole, requiredPermission);
    if (!hasPerm) return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Specific route guards for different user types

export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredPermission="manageUsers">
    {children}
  </ProtectedRoute>
);

export const BranchAdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole={ROLES.BRANCH_ADMIN}>
    {children}
  </ProtectedRoute>
);

export const StaffRoute = ({ children }) => {
  const staffRoles = [
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST,
    ROLES.BRANCH_ADMIN,
    ROLES.BRANCH_MANAGER
  ];

  return (
    <ProtectedRoute allowedRoles={staffRoles}>
      {children}
    </ProtectedRoute>
  );
};

export const ClientRoute = ({ children }) => (
  <ProtectedRoute requiredRole={ROLES.CLIENT}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;