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
  MapPin
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const DashboardLayout = ({ children, menuItems = [], pageTitle = 'Dashboard' }) => {
  const { userData, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branchName, setBranchName] = useState('');

  // Fetch branch name when userData changes
  useEffect(() => {
    const fetchBranchName = async () => {
      if (userData?.branchId) {
        try {
          const branchRef = doc(db, 'branches', userData.branchId);
          const branchDoc = await getDoc(branchRef);
          if (branchDoc.exists()) {
            setBranchName(branchDoc.data().name);
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

  const isActive = (path) => {
    return location.pathname === path;
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
        <div className="flex items-center justify-center px-6 py-4 border-b border-gray-200 relative">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="David's Salon" className="h-[54px]" />
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 absolute right-4"
          >
            <X className="h-6 w-6" />
          </button>
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
              <p className="text-xs text-gray-500">{getRoleDisplayName(userData?.roles?.[0] || userData?.role)}</p>
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
              
              {/* Branch Information */}
              {branchName && (
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{branchName}</p>
                  </div>
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
    </div>
  );
};

export default DashboardLayout;
