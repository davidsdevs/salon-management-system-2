import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { branchService } from '../../services/branchService';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import DashboardLayout from '../shared/DashboardLayout';
import { 
  Award, 
  Save, 
  Edit, 
  Settings,
  Home,
  Calendar,
  Users,
  DollarSign,
  FileText,
  BarChart3
} from 'lucide-react';

const BranchLoyaltySettings = () => {
  const { userData } = useAuth();
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [loyaltyConfig, setLoyaltyConfig] = useState({
    enabled: true,
    amountPerPoint: 100
  });

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/branch-appointments', label: 'Appointments', icon: Calendar },
    { path: '/staff', label: 'Staff Management', icon: Users },
    { path: '/pos-billing', label: 'POS Billing', icon: DollarSign },
    { path: '/transactions', label: 'Transactions', icon: FileText },
    { path: '/loyalty-settings', label: 'Loyalty Settings', icon: Award },
    { path: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  useEffect(() => {
    loadBranchData();
  }, []);

  const loadBranchData = async () => {
    try {
      setLoading(true);
      if (userData?.branchId) {
        const branch = await branchService.getBranch(userData.branchId, userData.roles?.[0], userData.uid);
        setBranchData(branch);
        setLoyaltyConfig(branch.loyaltyPointsConfig || {
          enabled: true,
          amountPerPoint: 100
        });
      }
    } catch (error) {
      console.error('Error loading branch data:', error);
      setError('Failed to load branch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      await branchService.updateBranch(
        userData.branchId, 
        { loyaltyPointsConfig: loyaltyConfig },
        userData.roles?.[0],
        userData.uid
      );
      
      setSuccess('Loyalty points settings updated successfully!');
      setIsEditing(false);
      await loadBranchData();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating loyalty settings:', error);
      setError('Failed to update loyalty settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout menuItems={menuItems} pageTitle="Loyalty Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#160B53]"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Loyalty Settings">
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Points Configuration</h1>
            <p className="text-gray-600">Configure how loyalty points are earned at your branch</p>
          </div>
          <div className="flex space-x-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            ) : (
              <>
                <Button 
                  onClick={() => {
                    setIsEditing(false);
                    loadBranchData();
                  }}
                  variant="outline"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center bg-[#160B53] hover:bg-[#2D1B69]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loyalty Points Configuration */}
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <Award className="h-6 w-6 mr-3 text-[#160B53]" />
            <h2 className="text-xl font-semibold text-gray-900">Loyalty Program Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center space-x-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <input
                type="checkbox"
                checked={loyaltyConfig.enabled}
                onChange={(e) => setLoyaltyConfig(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                disabled={!isEditing}
                className="h-5 w-5 text-[#160B53] focus:ring-[#160B53] rounded"
              />
              <div className="flex-1">
                <label className="text-base font-medium text-gray-900">
                  Enable Loyalty Points Program
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically award loyalty points to clients when they complete purchases at this branch
                </p>
              </div>
            </div>

            {/* Points Conversion Rate */}
            {loyaltyConfig.enabled && (
              <div className="p-6 border-2 border-gray-200 rounded-lg bg-white">
                <label className="block text-base font-semibold text-gray-900 mb-4">
                  Points Conversion Rate
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Set how much money customers need to spend to earn 1 loyalty point
                </p>
                
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-lg font-semibold text-gray-700">₱</span>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={loyaltyConfig.amountPerPoint}
                    onChange={(e) => setLoyaltyConfig(prev => ({
                      ...prev,
                      amountPerPoint: parseInt(e.target.value) || 100
                    }))}
                    disabled={!isEditing}
                    className={`w-40 text-lg font-semibold ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                  <span className="text-base text-gray-700">= 1 Loyalty Point</span>
                </div>

                {/* Examples */}
                <div className="mt-6 space-y-3">
                  <p className="text-sm font-medium text-gray-700">Examples with current rate:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600">Purchase Amount</p>
                      <p className="text-lg font-bold text-blue-900">₱{loyaltyConfig.amountPerPoint * 5}</p>
                      <p className="text-xs text-gray-600 mt-1">Earns: <span className="font-semibold text-blue-700">5 points</span></p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-gray-600">Purchase Amount</p>
                      <p className="text-lg font-bold text-green-900">₱{loyaltyConfig.amountPerPoint * 10}</p>
                      <p className="text-xs text-gray-600 mt-1">Earns: <span className="font-semibold text-green-700">10 points</span></p>
                    </div>
                  </div>
                </div>

                {/* Current Setting Info */}
                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <Award className="h-5 w-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-purple-900 mb-1">Current Configuration</p>
                      <p className="text-sm text-purple-800">
                        Every <strong>₱{loyaltyConfig.amountPerPoint}</strong> spent earns <strong>1 loyalty point</strong>
                      </p>
                      <p className="text-xs text-purple-700 mt-2">
                        This applies to all product and service transactions at this branch
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Loyalty points are automatically calculated and awarded when transactions are marked as "Paid" in the POS system. Points are rounded down (e.g., ₱{loyaltyConfig.amountPerPoint - 1} = 0 points, ₱{loyaltyConfig.amountPerPoint} = 1 point).
              </p>
            </div>
          </div>
        </Card>

        {/* Branch Info */}
        {branchData && (
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Branch:</span>
              <span className="font-semibold text-gray-900">{branchData.name}</span>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BranchLoyaltySettings;
