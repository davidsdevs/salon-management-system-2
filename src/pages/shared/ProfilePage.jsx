import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from './DashboardLayout';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X,
  Camera,
  Lock,
  Home,
  Users,
  Building2,
  Settings,
  BarChart3,
  UserCog,
  Package,
  ShoppingCart,
  Scissors,
  Bell,
  Key,
  Check,
  AlertCircle
} from 'lucide-react';
import { getRoleDisplayName, ROLES } from '../../utils/roles';
import rolePinService from '../../services/rolePinService';

const ProfilePage = () => {
  const { userData, updateProfile, updatePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    branchId: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [rolePins, setRolePins] = useState({});
  const [pinMessage, setPinMessage] = useState({ type: '', text: '', role: '' });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        branchId: userData.branchId || ''
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateProfile(formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updatePassword(passwordData.newPassword);
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      address: userData.address || '',
      branchId: userData.branchId || ''
    });
    setError('');
    setSuccess('');
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  const handlePinChange = (role, value) => {
    // Only allow 4-digit numbers
    if (value && (!/^\d+$/.test(value) || value.length > 4)) return;
    
    setRolePins(prev => ({
      ...prev,
      [role]: value
    }));
  };

  const handleSetPin = async (role) => {
    const pin = rolePins[role];
    
    if (!pin || pin.length !== 4) {
      setPinMessage({ 
        type: 'error', 
        text: 'PIN must be exactly 4 digits', 
        role 
      });
      setTimeout(() => setPinMessage({ type: '', text: '', role: '' }), 3000);
      return;
    }

    try {
      setLoading(true);
      await rolePinService.setRolePin(userData.uid, role, pin);
      
      setPinMessage({ 
        type: 'success', 
        text: `PIN set successfully for ${getRoleDisplayName(role)}`, 
        role 
      });
      
      // Clear the PIN field
      setRolePins(prev => ({ ...prev, [role]: '' }));
      
      setTimeout(() => setPinMessage({ type: '', text: '', role: '' }), 3000);
    } catch (error) {
      console.error('Error setting PIN:', error);
      setPinMessage({ 
        type: 'error', 
        text: error.message, 
        role 
      });
      setTimeout(() => setPinMessage({ type: '', text: '', role: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async (role) => {
    if (!confirm(`Remove PIN for ${getRoleDisplayName(role)}?`)) return;

    try {
      setLoading(true);
      await rolePinService.removeRolePin(userData.uid, role);
      
      setPinMessage({ 
        type: 'success', 
        text: `PIN removed for ${getRoleDisplayName(role)}`, 
        role 
      });
      
      setTimeout(() => setPinMessage({ type: '', text: '', role: '' }), 3000);
    } catch (error) {
      console.error('Error removing PIN:', error);
      setPinMessage({ 
        type: 'error', 
        text: error.message, 
        role 
      });
      setTimeout(() => setPinMessage({ type: '', text: '', role: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getMenuItems = () => {
    switch (userData?.role) {
      case ROLES.SYSTEM_ADMIN:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/user-management', label: 'User Management', icon: Users },
          { path: '/franchise-management', label: 'Franchise Management', icon: Building2 },
          { path: '/system-settings', label: 'System Settings', icon: Settings },
          { path: '/analytics', label: 'Analytics', icon: BarChart3 },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.OPERATIONAL_MANAGER:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/branch-overview', label: 'Branch Overview', icon: Building2 },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.BRANCH_ADMIN:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/appointments', label: 'Appointments', icon: Calendar },
          { path: '/staff', label: 'Staff Management', icon: Users },
          { path: '/inventory', label: 'Inventory', icon: Package },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.BRANCH_MANAGER:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/appointments', label: 'Appointments', icon: Calendar },
          { path: '/staff', label: 'Staff', icon: Users },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.RECEPTIONIST:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/appointments', label: 'Appointments', icon: Calendar },
          { path: '/clients', label: 'Clients', icon: Users },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.INVENTORY_CONTROLLER:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/inventory', label: 'Inventory', icon: Package },
          { path: '/orders', label: 'Orders', icon: ShoppingCart },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.STYLIST:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/appointments', label: 'My Appointments', icon: Calendar },
          { path: '/services', label: 'Services', icon: Scissors },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      case ROLES.CLIENT:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/appointments', label: 'My Appointments', icon: Calendar },
          { path: '/services', label: 'Services', icon: Scissors },
          { path: '/branches', label: 'Branches', icon: MapPin },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
      default:
        return [
          { path: '/dashboard', label: 'Dashboard', icon: Home },
          { path: '/profile', label: 'Profile', icon: UserCog },
        ];
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout menuItems={getMenuItems()} pageTitle="My Profile">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">
                Manage your account information and settings
              </p>
            </div>
            
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Profile Information */}
          <Card className="p-6">
            <div className="flex items-start space-x-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center relative">
                  <User className="h-12 w-12 text-gray-600" />
                  <button className="absolute bottom-0 right-0 bg-pink-600 text-white rounded-full p-2 hover:bg-pink-700">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{userData.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <p className="text-sm text-gray-900">{userData.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{userData.phone || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <p className="text-sm text-gray-900">{getRoleDisplayName(userData.role)}</p>
                    <p className="text-xs text-gray-500">Role cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch
                    </label>
                    {isEditing ? (
                      <Input
                        name="branchId"
                        value={formData.branchId}
                        onChange={handleInputChange}
                        placeholder="Enter branch ID"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">{userData.branchId || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Member Since
                    </label>
                    <p className="text-sm text-gray-900">{formatDate(userData.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="text-sm text-gray-900">{userData.address || 'N/A'}</p>
                  )}
                </div>

                {/* Edit Actions */}
                {isEditing && (
                  <div className="mt-6 flex space-x-4">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Security Settings */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Security</h3>
                <p className="text-sm text-gray-600">Manage your password and security settings</p>
              </div>
              
              {!isChangingPassword && (
                <Button
                  onClick={() => setIsChangingPassword(true)}
                  variant="outline"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <Input
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleCancelPasswordChange}
                    variant="outline"
                    disabled={loading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-sm text-gray-600">
                <p>Password last changed: {formatDate(userData.passwordChangedAt) || 'Unknown'}</p>
              </div>
            )}
          </Card>

          {/* Role PIN Management */}
          {userData?.roles && userData.roles.length > 1 && (
            <Card className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Key className="h-5 w-5 text-[#160B53]" />
                  <h3 className="text-lg font-medium text-gray-900">Role PINs</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Set a 4-digit PIN for each role for secure role switching
                </p>
              </div>

              <div className="space-y-6">
                {userData.roles.map(role => (
                  <div key={role} className="border-b border-gray-200 pb-6 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {getRoleDisplayName(role)}
                        </h4>
                        <p className="text-xs text-gray-600">
                          Required when switching to this role
                        </p>
                      </div>
                    </div>

                    {/* PIN Message */}
                    {pinMessage.role === role && pinMessage.text && (
                      <div className={`mb-3 p-3 rounded-lg flex items-center space-x-2 ${
                        pinMessage.type === 'success' 
                          ? 'bg-green-50 text-green-800' 
                          : 'bg-red-50 text-red-800'
                      }`}>
                        {pinMessage.type === 'success' ? (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="text-sm">{pinMessage.text}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={rolePins[role] || ''}
                        onChange={(e) => handlePinChange(role, e.target.value)}
                        placeholder="Enter 4-digit PIN"
                        className="flex-1"
                        disabled={loading}
                      />
                      <Button
                        onClick={() => handleSetPin(role)}
                        disabled={!rolePins[role] || rolePins[role].length !== 4 || loading}
                        className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Set PIN
                      </Button>
                      <Button
                        onClick={() => handleRemovePin(role)}
                        disabled={loading}
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">About Role PINs:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>PINs provide extra security when switching between roles</li>
                      <li>You'll be asked for the PIN when switching to that role</li>
                      <li>If no PIN is set, you can switch freely (backward compatible)</li>
                      <li>PINs are encrypted and stored securely</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
