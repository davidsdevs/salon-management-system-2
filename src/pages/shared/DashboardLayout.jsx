import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleDisplayName } from '../../utils/roles';
import { Button } from '../ui/button';
import { 
  LogOut, 
  Menu, 
  X,
  Home,
  MapPin,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import RolePinModal from '../../components/auth/RolePinModal';
import rolePinService from '../../services/rolePinService';

const DashboardLayout = ({ children, menuItems = [], pageTitle = 'Dashboard' }) => {
  const { userData, signOut, switchRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Fetch branch name when userData changes (cache it to avoid flashing)
  useEffect(() => {
    const fetchBranchName = async () => {
      if (userData?.branchId) {
        // Check cache first
        const cached = localStorage.getItem(`branch_${userData.branchId}`);
        if (cached) {
          setBranchName(cached);
          return;
        }

        try {
          const branchRef = doc(db, 'branches', userData.branchId);
          const branchDoc = await getDoc(branchRef);
          if (branchDoc.exists()) {
            const name = branchDoc.data().name;
            setBranchName(name);
            // Cache for future use
            localStorage.setItem(`branch_${userData.branchId}`, name);
          }
        } catch (error) {
          console.error('Error fetching branch name:', error);
        }
      }
    };

    fetchBranchName();
  }, [userData?.branchId]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleRoleSwitch = async (newRole) => {
    // Don't switch if already on this role
    if (userData.roles[0] === newRole) return;

    // Store the role we want to switch to
    setPendingRole(newRole);
    setShowRoleSwitcher(false);
    setShowPinModal(true);
  };

  const getRoleDashboard = (role) => {
    // Map roles to their dashboard routes
    const dashboardRoutes = {
      'systemAdmin': '/dashboard',
      'operationalManager': '/dashboard',
      'branchAdmin': '/dashboard',
      'branchManager': '/dashboard',
      'receptionist': '/dashboard',
      'inventoryController': '/dashboard',
      'stylist': '/dashboard',
      'client': '/dashboard'
    };
    return dashboardRoutes[role] || '/dashboard';
  };

  const handlePinVerify = async (pin) => {
    try {
      setVerifyingPin(true);
      
      // Verify PIN for the role
      const isValid = await rolePinService.verifyRolePin(userData.uid, pendingRole, pin);
      
      if (!isValid) {
        throw new Error('Invalid PIN');
      }

      // PIN is valid, proceed with role switch
      await switchRole(pendingRole);
      setShowPinModal(false);
      setPendingRole(null);
      
      // Navigate to the new role's dashboard and reload
      const dashboardRoute = getRoleDashboard(pendingRole);
      window.location.href = dashboardRoute;
    } catch (error) {
      setVerifyingPin(false);
      throw error; // Let the modal handle the error display
    }
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    setPendingRole(null);
    setVerifyingPin(false);
  };

  // Close role switcher on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRoleSwitcher && !event.target.closest('.role-switcher-container')) {
        setShowRoleSwitcher(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRoleSwitcher]);

  const isActive = (path) => {
    // Exact match for root paths
    if (location.pathname === path) {
      return true;
    }
    
    // For sub-routes, check if current path starts with the menu path
    // This handles cases like /staff/details highlighting /staff
    if (path !== '/' && location.pathname.startsWith(path + '/')) {
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center relative mb-3">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="David's Salon" className="h-[54px]" />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700 absolute right-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Branch Information */}
          {branchName && (
              <div className="flex items-center justify-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-900">{branchName}</p>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-[#160B53] flex items-center justify-center text-white font-semibold">
              {userData?.firstName?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {userData?.firstName} {userData?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems && menuItems.length > 0 ? menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-regular rounded-lg transition-colors ${
                  active
                    ? 'bg-[#160B53] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          }) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              No menu items available
            </div>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header Container */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
              <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-2xl font-semibold text-[#160B53]">{pageTitle}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric' 
                    })}
                    {' • '}
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
              
              {/* Role Switcher */}
              {userData?.roles && userData.roles.length > 1 && (
                <div className="relative role-switcher-container">
                  <button
                    onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white px-4 py-2 rounded-lg hover:from-[#2D1B69] hover:to-[#160B53] transition-all duration-200 shadow-md"
                    disabled={switchingRole}
                  >
                    <RefreshCw className={`h-4 w-4 ${switchingRole ? 'animate-spin' : ''}`} />
                    <span className="font-medium text-sm">
                      {getRoleDisplayName(userData.roles[0])}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showRoleSwitcher ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {showRoleSwitcher && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Switch Role
                        </p>
                      </div>
                      {userData.roles.map((role, index) => (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          disabled={switchingRole || index === 0}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                            index === 0 ? 'bg-[#160B53] bg-opacity-5 cursor-default' : ''
                          } ${switchingRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div>
                            <p className={`font-medium text-sm ${index === 0 ? 'text-[#160B53]' : 'text-gray-700'}`}>
                              {getRoleDisplayName(role)}
                            </p>
                            {index === 0 && (
                              <p className="text-xs text-[#160B53] mt-0.5">Current Role</p>
                            )}
                          </div>
                          {index === 0 && (
                            <div className="h-2 w-2 rounded-full bg-[#160B53]"></div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {/* Role PIN Modal */}
      <RolePinModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onVerify={handlePinVerify}
        roleName={pendingRole ? getRoleDisplayName(pendingRole) : ''}
        isVerifying={verifyingPin}
      />
    </div>
  );
};

export default DashboardLayout;
