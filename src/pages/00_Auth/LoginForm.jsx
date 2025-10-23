import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { getRoleDisplayName, getAvailableRoles } from '../../utils/roles';
import Navigation from '../shared/Navigation';
import Footer from '../shared/Footer';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  const { signIn, clearError, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const result = await signIn(formData.email, formData.password);
      
      // Debug logging
      console.log('Login result:', result);
      console.log('User roles:', result.userData.roles);
      console.log('User roles:', result.userData.roles);
      
      // Check if user has multiple roles
      const userRoles = result.userData.roles || [];
      console.log('UserRoles array:', userRoles);
      
      if (userRoles.length > 1) {
        setUserRoles(userRoles);
        setShowRoleSelection(true);
        return;
      }
      
      // Single role - proceed to dashboard (no role switching needed)
      if (userRoles.length === 1) {
        console.log('Single role user, proceeding to dashboard with role:', userRoles[0]);
        // Store the single role preference
        localStorage.setItem('selectedRole', userRoles[0]);
      }
      
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/email-not-verified') {
        setPendingVerification(true);
        setError(error.message);
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Store the selected role in localStorage
      localStorage.setItem('selectedRole', role);
      
      // Switch to selected role
      await switchRole(role);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { authService } = await import('../../services/authService');
      await authService.resendVerification(formData.email, formData.password);
      setError('Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-[122px]">
      {/* Header */}
      <Navigation />

      {/* Main Content */}
      <div className="flex items-center justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-[#160B53]">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              David's Salon Management System
            </p>
          </div>

          <Card className="p-8 border-0" style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.25)' }}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                    {pendingVerification && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        className="mt-2 text-sm font-medium text-[#160B53] hover:text-[#160B53]/80"
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-[#160B53] hover:text-[#160B53]/80"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full bg-[#160B53] hover:bg-[#160B53]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-[#160B53] hover:text-[#160B53]/80"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </form>
        </Card>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Your Role
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              You have multiple roles. Please select which role you want to use for this session.
            </p>
            
            <div className="space-y-3">
              {userRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#160B53] transition-colors"
                  disabled={isLoading}
                >
                  <div className="font-medium text-gray-900">
                    {getRoleDisplayName(role)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {role === 'systemAdmin' && 'Full system access and management'}
                    {role === 'operationalManager' && 'Multi-branch operations and analytics'}
                    {role === 'branchAdmin' && 'Branch administration and staff management'}
                    {role === 'branchManager' && 'Branch operations and customer service'}
                    {role === 'receptionist' && 'Appointments and customer service'}
                    {role === 'inventoryController' && 'Inventory and supply management'}
                    {role === 'stylist' && 'Service delivery and client care'}
                    {role === 'client' && 'Book appointments and manage profile'}
                  </div>
                </button>
              ))}
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LoginForm;
