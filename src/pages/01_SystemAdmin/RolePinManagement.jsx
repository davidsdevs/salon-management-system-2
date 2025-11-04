import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../shared/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import rolePinService from '../../services/rolePinService';
import { getRoleDisplayName } from '../../utils/roles';
import { Lock, Check, X, AlertCircle, ArrowLeft } from 'lucide-react';

const RolePinManagement = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pins, setPins] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage({ type: 'error', text: 'User not found' });
        return;
      }

      const userData = userDoc.data();
      setUser({ id: userDoc.id, ...userData });

      // Initialize PIN fields for each role
      const initialPins = {};
      userData.roles?.forEach(role => {
        initialPins[role] = '';
      });
      setPins(initialPins);
    } catch (error) {
      console.error('Error fetching user:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (role, value) => {
    // Only allow 4-digit numbers
    if (value && (!/^\d+$/.test(value) || value.length > 4)) return;
    
    setPins(prev => ({
      ...prev,
      [role]: value
    }));
  };

  const handleSetPin = async (role) => {
    const pin = pins[role];
    
    if (!pin || pin.length !== 4) {
      setMessage({ type: 'error', text: 'PIN must be exactly 4 digits' });
      return;
    }

    try {
      setSaving(true);
      await rolePinService.setRolePin(userId, role, pin);
      
      setMessage({ 
        type: 'success', 
        text: `PIN set successfully for ${getRoleDisplayName(role)}` 
      });
      
      // Clear the PIN field
      setPins(prev => ({ ...prev, [role]: '' }));
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error setting PIN:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePin = async (role) => {
    if (!confirm(`Remove PIN for ${getRoleDisplayName(role)}?`)) return;

    try {
      setSaving(true);
      await rolePinService.removeRolePin(userId, role);
      
      setMessage({ 
        type: 'success', 
        text: `PIN removed for ${getRoleDisplayName(role)}` 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error removing PIN:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={userData?.role} pageTitle="Role PIN Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout role={userData?.role} pageTitle="Role PIN Management">
        <Card className="p-6">
          <p className="text-red-600">User not found</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={userData?.role} pageTitle="Role PIN Management">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/user-management')}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        {/* User Info Card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-[#160B53] flex items-center justify-center text-white text-2xl font-bold">
              {user.firstName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Role PINs */}
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Lock className="h-6 w-6 text-[#160B53]" />
            <h3 className="text-xl font-bold text-gray-900">Role PINs</h3>
          </div>

          <div className="space-y-6">
            {user.roles?.map(role => (
              <div key={role} className="border-b border-gray-200 pb-6 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {getRoleDisplayName(role)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Set a 4-digit PIN for this role
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pins[role] || ''}
                    onChange={(e) => handlePinChange(role, e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent outline-none"
                    disabled={saving}
                  />
                  <Button
                    onClick={() => handleSetPin(role)}
                    disabled={!pins[role] || pins[role].length !== 4 || saving}
                    className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Set PIN
                  </Button>
                  <Button
                    onClick={() => handleRemovePin(role)}
                    disabled={saving}
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
                  <li>Each role can have its own PIN for security</li>
                  <li>Users must enter the PIN when switching to that role</li>
                  <li>If no PIN is set, the role can be accessed without PIN</li>
                  <li>PINs are encrypted and stored securely</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RolePinManagement;
