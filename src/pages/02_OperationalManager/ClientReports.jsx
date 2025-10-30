import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { clientService } from '../../services/clientService';
import { branchService } from '../../services/branchService';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  UserX,
  Award,
  TrendingUp,
  Download,
  Home,
  Calendar,
  BarChart3,
  MapPin
} from 'lucide-react';

const ClientReports = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { path: '/operational-manager/dashboard', label: 'Dashboard', icon: Home },
    { path: '/operational-manager/appointments', label: 'Appointments', icon: Calendar },
    { path: '/operational-manager/branches', label: 'Branch Monitoring', icon: MapPin },
    { path: '/operational-manager/clients', label: 'Client Reports', icon: Users },
    { path: '/operational-manager/loyalty-summary', label: 'Loyalty Summary', icon: Award },
    { path: '/operational-manager/reports', label: 'Analytics', icon: BarChart3 },
  ];

  const [allClients, setAllClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterClients();
  }, [allClients, searchTerm, branchFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all clients across all branches
      const clientsResult = await clientService.getAllClients();
      setAllClients(clientsResult);
      
      // Load all branches
      const branchesResult = await branchService.getBranches();
      setBranches(branchesResult.branches || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...allClients];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => {
        const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower) ||
          client.phone?.includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchLower);
      });
    }

    // Branch filter (if clients have branch data)
    if (branchFilter !== 'all') {
      filtered = filtered.filter(client => client.branchId === branchFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Status', 'Loyalty Points', 'Joined Date'];
    const rows = filteredClients.map(client => [
      `${client.firstName} ${client.lastName}`,
      client.email || 'N/A',
      client.phone || 'N/A',
      client.status,
      client.loyaltyPoints || 0,
      client.createdAt ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-reports-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Calculate stats
  const stats = {
    total: allClients.length,
    active: allClients.filter(c => c.status === 'active').length,
    inactive: allClients.filter(c => c.status === 'inactive').length,
    totalLoyaltyPoints: allClients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
    avgLoyaltyPoints: allClients.length > 0 
      ? Math.round(allClients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0) / allClients.length)
      : 0
  };

  return (
    <DashboardLayout menuItems={menuItems} pageTitle="Client Reports">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Reports</h1>
            <p className="text-gray-600 mt-1">View client data across all branches</p>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <UserX className="h-8 w-8 text-red-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalLoyaltyPoints.toLocaleString()}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Points</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.avgLoyaltyPoints}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                />
              </div>
            </div>

            {/* Branch Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

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
            <p className="mt-4 text-gray-600">Loading client data...</p>
          </div>
        ) : (
          <>
            {/* Client Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loyalty Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentClients.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No clients found
                        </td>
                      </tr>
                    ) : (
                      currentClients.map((client) => (
                        <tr key={client.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {client.firstName} {client.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.phone}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              client.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600">
                            {client.loyaltyPoints || 0} pts
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.createdAt 
                              ? new Date(client.createdAt.seconds * 1000).toLocaleDateString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                
                {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = index + 1;
                  } else if (currentPage <= 3) {
                    pageNum = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + index;
                  } else {
                    pageNum = currentPage - 2 + index;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className={currentPage === pageNum ? 'bg-[#160B53] text-white' : ''}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientReports;
