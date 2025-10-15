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
    'managePromotions'
  ],
  [ROLES.BRANCH_ADMIN]: [
    'manageStaff',
    'viewReports',
    'manageAppointments',
    'manageInventory',
    'manageClients',
    'branchSettings'
  ],
  [ROLES.BRANCH_MANAGER]: [
    'viewReports',
    'manageAppointments',
    'manageStaff',
    'viewInventory',
    'manageClients'
  ],
  [ROLES.RECEPTIONIST]: [
    'manageAppointments',
    'createBilling',
    'manageClients',
    'viewSchedule'
  ],
  [ROLES.INVENTORY_CONTROLLER]: [
    'manageInventory',
    'viewReports',
    'manageSuppliers',
    'viewAppointments'
  ],
  [ROLES.STYLIST]: [
    'viewAppointments',
    'updateServiceStatus',
    'viewSchedule',
    'manageProfile'
  ],
  [ROLES.CLIENT]: [
    'bookAppointments',
    'viewHistory',
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

// Role switching permissions - which roles can act as other roles
export const ROLE_SWITCHING_PERMISSIONS = {
  [ROLES.SYSTEM_ADMIN]: Object.values(ROLES), // Can act as any role
  [ROLES.OPERATIONAL_MANAGER]: [
    ROLES.BRANCH_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.BRANCH_ADMIN]: [
    ROLES.BRANCH_MANAGER,
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.BRANCH_MANAGER]: [
    ROLES.RECEPTIONIST,
    ROLES.INVENTORY_CONTROLLER,
    ROLES.STYLIST
  ],
  [ROLES.RECEPTIONIST]: [ROLES.STYLIST], // Can act as stylist for booking purposes
  [ROLES.INVENTORY_CONTROLLER]: [ROLES.STYLIST], // Can act as stylist for inventory
  [ROLES.STYLIST]: [], // Cannot switch to other roles
  [ROLES.CLIENT]: [] // Cannot switch to other roles
};

// Check if a user can switch to a specific role
export const canSwitchToRole = (currentRole, targetRole) => {
  const allowedRoles = ROLE_SWITCHING_PERMISSIONS[currentRole] || [];
  return allowedRoles.includes(targetRole);
};

// Get available roles a user can switch to
export const getAvailableRoles = (userRole) => {
  return ROLE_SWITCHING_PERMISSIONS[userRole] || [];
};
