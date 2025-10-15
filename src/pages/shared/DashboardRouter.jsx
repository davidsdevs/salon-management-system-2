import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/roles';

// Import role-specific dashboards
import SystemAdminDashboard from '../01_SystemAdmin/Dashboard';
import OperationalManagerDashboard from '../02_OperationalManager/Dashboard';
import BranchAdminDashboard from '../03_BranchAdmin/Dashboard';
import BranchManagerDashboard from '../04_BranchManager/Dashboard';
import ReceptionistDashboard from '../05_Receptionist/Dashboard';
import InventoryControllerDashboard from '../06_InventoryController/Dashboard';
import StylistDashboard from '../07_Stylist/Dashboard';
import ClientDashboard from '../08_Client/Dashboard';

const DashboardRouter = () => {
  const { userData } = useAuth();

  // Get current role (support both old and new structure)
  let currentRole = userData?.currentRole || userData?.role;
  
  // If user has roles array but no currentRole, use the first role
  if (!currentRole && userData?.roles && userData.roles.length > 0) {
    currentRole = userData.roles[0];
  }
  
  // Debug logging
  console.log('DashboardRouter - userData:', userData);
  console.log('DashboardRouter - currentRole:', currentRole);

  // Route to the appropriate dashboard based on user's current role
  switch (currentRole) {
    case ROLES.SYSTEM_ADMIN:
      return <SystemAdminDashboard />;
    
    case ROLES.OPERATIONAL_MANAGER:
      return <OperationalManagerDashboard />;
    
    case ROLES.BRANCH_ADMIN:
      return <BranchAdminDashboard />;
    
    case ROLES.BRANCH_MANAGER:
      return <BranchManagerDashboard />;
    
    case ROLES.RECEPTIONIST:
      return <ReceptionistDashboard />;
    
    case ROLES.INVENTORY_CONTROLLER:
      return <InventoryControllerDashboard />;
    
    case ROLES.STYLIST:
      return <StylistDashboard />;
    
    case ROLES.CLIENT:
      return <ClientDashboard />;
    
    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to David's Salon</h1>
            <p className="text-gray-600">Your role is not recognized. Please contact support.</p>
            <p className="text-sm text-gray-500 mt-2">Detected role: {currentRole}</p>
            <p className="text-sm text-gray-500">Available roles: {Object.values(ROLES).join(', ')}</p>
          </div>
        </div>
      );
  }
};

export default DashboardRouter;
