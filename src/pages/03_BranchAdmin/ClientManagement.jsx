import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import DashboardLayout from '../shared/DashboardLayout';
import { clientService } from '../../services/clientService';
import { 
  Users, 
  Search, 
  Plus,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Phone,
  Mail,
  Award,
  Calendar,
  Filter
} from 'lucide-react';

const ClientManagement = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await clientService.getClientsByBranch(
        userData?.branchId || 'unknown'
      );
      
      setClients(result);
    } catch (error) {
      console.error('Error loading clients:', error);
      setError('Failed to load clients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clients];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => {
        const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
        return fullName.includes(searchLower) ||
          client.phone?.includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchLower);
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
    setCurrentPage(1);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleDeactivateClient = async (clientId) => {
    if (!window.confirm('Are you sure you want to deactivate this client?')) {
      return;
    }

    try {
      await clientService.deactivateClient(clientId);
      showSuccess('Client deactivated successfully!');
      await loadClients();
    } catch (error) {
      console.error('Error deactivating client:', error);
      setError('Failed to deactivate client: ' + error.message);
    }
  };

  const handleActivateClient = async (clientId) => {
    try {
      await clientService.activateClient(clientId);
      showSuccess('Client activated successfully!');
      await loadClients();
    } catch (error) {
      console.error('Error activating client:', error);
      setError('Failed to activate client: ' + error.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
    totalLoyaltyPoints: clients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0)
  };

  return (
    <DashboardLayout pageTitle="Client Management">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="text-gray-600 mt-1">Manage client profiles and relationships</p>
          </div>
          <Button
            onClick={() => navigate('/branch-admin/clients/new')}
            className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <p className="text-sm text-gray-600">Total Loyalty Points</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalLoyaltyPoints}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#160B53] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading clients...</p>
          </div>
        ) : currentClients.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first client'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => navigate('/branch-admin/clients/new')}
                className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Client
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {currentClients.map((client) => (
                <Card key={client.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.firstName} {client.lastName}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        client.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {client.email}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Joined: {formatDate(client.createdAt)}
                    </div>
                    <div className="flex items-center text-sm font-medium text-purple-600">
                      <Award className="h-4 w-4 mr-2" />
                      {client.loyaltyPoints || 0} Loyalty Points
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/branch-admin/clients/${client.id}`)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/branch-admin/clients/${client.id}/edit`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {client.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeactivateClient(client.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateClient(client.id)}
                        className="text-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    variant={currentPage === index + 1 ? 'default' : 'outline'}
                    size="sm"
                    className={currentPage === index + 1 ? 'bg-[#160B53] text-white' : ''}
                  >
                    {index + 1}
                  </Button>
                ))}
                
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

        {showSuccessMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            {successMessage}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientManagement;
