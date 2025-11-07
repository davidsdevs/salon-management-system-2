import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { clientService } from '../../services/clientService';
import { branchService } from '../../services/branchService';
import { 
  Award, 
  TrendingUp,
  Users,
  MapPin,
  Download,
  Home,
  Calendar,
  BarChart3,
  DollarSign,
  ShoppingCart
} from 'lucide-react';

const LoyaltySummary = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/operational-manager/dashboard', label: 'Dashboard', icon: Home },
    { path: '/operational-manager/appointments', label: 'Appointments', icon: Calendar },
    { path: '/operational-manager/branches', label: 'Branch Monitoring', icon: MapPin },
    { path: '/operational-manager/clients', label: 'Client Reports', icon: Users },
    { path: '/operational-manager/loyalty-summary', label: 'Loyalty Summary', icon: Award },
    { path: '/operational-manager/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { path: '/operational-manager/deposits', label: 'Deposit Reviews', icon: DollarSign },
    { path: '/operational-manager/reports', label: 'Analytics', icon: BarChart3 },
  ];

  const [allClients, setAllClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchLoyaltyData, setBranchLoyaltyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all clients and branches
      const [clientsResult, branchesResult] = await Promise.all([
        clientService.getAllClients(),
        branchService.getBranches()
      ]);

      const clients = clientsResult;
      const branchList = branchesResult.branches || [];

      setAllClients(clients);
      setBranches(branchList);

      // Calculate loyalty data per branch
      const branchData = branchList.map(branch => {
        // Get all clients with points at this branch
        const branchClients = clients.filter(client => 
          client.loyaltyPointsByBranch && client.loyaltyPointsByBranch[branch.id]
        );

        const totalPoints = branchClients.reduce((sum, client) => 
          sum + (client.loyaltyPointsByBranch[branch.id] || 0), 0
        );

        const avgPoints = branchClients.length > 0 
          ? Math.round(totalPoints / branchClients.length) 
          : 0;

        const activeClients = branchClients.filter(c => c.status === 'active').length;

        return {
          id: branch.id,
          name: branch.name,
          totalPoints,
          clientsWithPoints: branchClients.length,
          avgPoints,
          activeClients,
          loyaltyConfig: branch.loyaltyPointsConfig || { enabled: true, amountPerPoint: 100 },
          isEnabled: branch.loyaltyPointsConfig?.enabled !== false
        };
      });

      setBranchLoyaltyData(branchData);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Branch', 'Status', 'Rate', 'Total Points', 'Clients with Points', 'Avg Points', 'Active Clients'];
    const rows = branchLoyaltyData.map(branch => [
      branch.name,
      branch.isEnabled ? 'Enabled' : 'Disabled',
      `₱${branch.loyaltyConfig.amountPerPoint} = 1 pt`,
      branch.totalPoints,
      branch.clientsWithPoints,
      branch.avgPoints,
      branch.activeClients
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loyalty-summary-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate global stats
  const totalPointsAllBranches = branchLoyaltyData.reduce((sum, b) => sum + b.totalPoints, 0);
  const totalClientsWithPoints = new Set(
    allClients.filter(c => c.loyaltyPoints && c.loyaltyPoints > 0).map(c => c.id)
  ).size;
  const enabledBranches = branchLoyaltyData.filter(b => b.isEnabled).length;

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Loyalty Program Summary">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loyalty Program Summary</h1>
            <p className="text-gray-600 mt-1">Overview of loyalty points across all branches</p>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points Issued</p>
                <p className="text-2xl font-bold text-purple-600">{totalPointsAllBranches.toLocaleString()}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients with Points</p>
                <p className="text-2xl font-bold text-blue-600">{totalClientsWithPoints}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Branches</p>
                <p className="text-2xl font-bold text-green-600">{enabledBranches}/{branches.length}</p>
              </div>
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Points/Client</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {totalClientsWithPoints > 0 ? Math.round(totalPointsAllBranches / totalClientsWithPoints) : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading loyalty data...</p>
          </div>
        ) : (
          <>
            {/* Branch Loyalty Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchLoyaltyData.map((branch) => (
                <Card key={branch.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{branch.name}</h3>
                      <div className="flex items-center mt-1">
                        {branch.isEnabled ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Award className="h-3 w-3 mr-1" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Disabled
                          </span>
                        )}
                      </div>
                    </div>
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Loyalty Rate */}
                  <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Loyalty Rate</p>
                    <p className="text-lg font-bold text-purple-700">
                      ₱{branch.loyaltyConfig.amountPerPoint} = 1 point
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Points Issued</span>
                      <span className="text-sm font-semibold text-purple-600">
                        {branch.totalPoints.toLocaleString()} pts
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clients with Points</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {branch.clientsWithPoints}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Points</span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {branch.avgPoints} pts
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Clients</span>
                      <span className="text-sm font-semibold text-green-600">
                        {branch.activeClients}
                      </span>
                    </div>
                  </div>

                  {/* Estimated Value */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Est. Value (if redeemed)</span>
                      <span className="text-sm font-bold text-gray-900">
                        ₱{(branch.totalPoints * branch.loyaltyConfig.amountPerPoint).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary Table */}
            <Card className="mt-6 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Branch Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Points
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branchLoyaltyData
                      .sort((a, b) => b.totalPoints - a.totalPoints)
                      .map((branch) => (
                        <tr key={branch.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{branch.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              branch.isEnabled
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {branch.isEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₱{branch.loyaltyConfig.amountPerPoint} = 1 pt
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                            {branch.totalPoints.toLocaleString()} pts
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {branch.clientsWithPoints}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {branch.avgPoints} pts
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LoyaltySummary;
