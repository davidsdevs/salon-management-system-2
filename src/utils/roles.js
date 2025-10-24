// User roles and their permissions
export const ROLES = {
  SYSTEM_ADMIN: 'systemAdmin',
  OPERATIONAL_MANAGER: 'operationalManager',
  BRANCH_ADMIN: 'branchAdmin',
  BRANCH_MANAGER: 'branchManager',
  RECEPTIONIST: 'receptionist',
  INVENTORY_CONTROLLER: 'inventoryController',
  STYLIST: 'stylist',
  CLIENT: 'client'
};

// Role permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.SYSTEM_ADMIN]: [
    'manageUsers',
    'manageBranches',
    'viewReports',
    'manageRoles',
    'viewAllData',
    'systemSettings'
  ],
  [ROLES.OPERATIONAL_MANAGER]: [
    'viewReports',
    'viewAllBranches',
    'viewAnalytics',
    'managePromotions',
    'viewAppointments', // Read-only access for reporting
    'branchMonitoring', // Monitor all branches
    'viewBranchStatus' // View branch operational status
  ],
  [ROLES.BRANCH_ADMIN]: [
    'manageStaff',
    'viewReports',
    'manageAppointments',
    'manageInventory',
    'manageClients',
    'branchSettings',
    'assignStaff', // Assign users to branch
    'removeStaff', // Remove users from branch
    'manageOperatingHours', // Set branch operating hours
    'manageHolidays', // Manage branch holidays
    'manageBranchServices', // Configure branch-specific services
    'posTransactions',
    'voidTransactions',
    'viewPOSReports'
  ],
  [ROLES.BRANCH_MANAGER]: [
    'viewReports',
    'manageAppointments',
    'manageStaff',
    'viewInventory',
    'manageClients',
    'posTransactions',
    'voidTransactions',
    'viewPOSReports'
  ],
  [ROLES.RECEPTIONIST]: [
    'manageAppointments',
    'createBilling',
    'manageClients',
    'viewSchedule',
    'posTransactions',
    'processPayments',
    'applyDiscounts',
    'manageLoyaltyPoints'
  ],
  [ROLES.INVENTORY_CONTROLLER]: [
    'manageInventory',
    'viewReports',
    'manageSuppliers',
    'viewAppointments'
  ],
  [ROLES.STYLIST]: [
    'viewAppointments', // Only assigned appointments
    'updateServiceStatus', // Mark as completed
    'viewSchedule',
    'manageProfile'
  ],
  [ROLES.CLIENT]: [
    'bookAppointments', // Book new appointments
    'rescheduleAppointments', // Reschedule existing appointments
    'cancelAppointments', // Cancel appointments
    'viewHistory', // View appointment history
    'manageProfile',
    'viewServices'
  ]
};

// Role hierarchy for access control
export const ROLE_HIERARCHY = {
  [ROLES.SYSTEM_ADMIN]: 8,
  [ROLES.OPERATIONAL_MANAGER]: 7,
  [ROLES.BRANCH_ADMIN]: 6,
  [ROLES.BRANCH_MANAGER]: 5,
  [ROLES.RECEPTIONIST]: 4,
  [ROLES.INVENTORY_CONTROLLER]: 4,
  [ROLES.STYLIST]: 3,
  [ROLES.CLIENT]: 2
};

// Helper functions
export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export const hasRoleAccess = (userRole, targetRole) => {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return userLevel >= targetLevel;
};

export const canManageUser = (currentUserRole, targetUserRole) => {
  return hasRoleAccess(currentUserRole, targetUserRole);
};

export const getRoleDisplayName = (role) => {
  const displayNames = {
    [ROLES.SYSTEM_ADMIN]: 'System Administrator',
    [ROLES.OPERATIONAL_MANAGER]: 'Operational Manager',
    [ROLES.BRANCH_ADMIN]: 'Branch Administrator',
    [ROLES.BRANCH_MANAGER]: 'Branch Manager',
    [ROLES.RECEPTIONIST]: 'Receptionist',
    [ROLES.INVENTORY_CONTROLLER]: 'Inventory Controller',
    [ROLES.STYLIST]: 'Stylist',
    [ROLES.CLIENT]: 'Client'
  };
  return displayNames[role] || role;
};

export const getAllRoles = () => Object.values(ROLES);

export const getAdminRoles = () => [
  ROLES.SYSTEM_ADMIN,
  ROLES.OPERATIONAL_MANAGER,
  ROLES.BRANCH_ADMIN,
  ROLES.BRANCH_MANAGER
];

export const getStaffRoles = () => [
  ROLES.RECEPTIONIST,
  ROLES.INVENTORY_CONTROLLER,
  ROLES.STYLIST
];

// Role switching permissions
export const ROLE_SWITCHING_PERMISSIONS = {
  [ROLES.SYSTEM_ADMIN]: getAllRoles(),
  [ROLES.OPERATIONAL_MANAGER]: [
    ROLES.OPERATIONAL_MANAGER,
    ROLES.BRANCH_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.BRANCH_ADMIN]: [
    ROLES.BRANCH_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.BRANCH_MANAGER]: [
    ROLES.BRANCH_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.RECEPTIONIST]: [ROLES.RECEPTIONIST],
  [ROLES.INVENTORY_CONTROLLER]: [ROLES.INVENTORY_CONTROLLER],
  [ROLES.STYLIST]: [ROLES.STYLIST],
  [ROLES.CLIENT]: [ROLES.CLIENT]
};

export const canSwitchToRole = (currentRole, targetRole) => {
  const availableRoles = ROLE_SWITCHING_PERMISSIONS[currentRole] || [];
  return availableRoles.includes(targetRole);
};

export function getAvailableRoles(userRole) {
  return ROLE_SWITCHING_PERMISSIONS[userRole] || [];
}
