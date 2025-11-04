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
  Eye,
  Phone,
  Mail,
  Award,
  Calendar,
  Info
} from 'lucide-react';

const AssignedClients = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await clientService.getClientsByBranch(
        userData?.branchId || 'unknown'
      );
      
      // Filter only clients who have preferred stylist as current user
      const assignedClients = result.filter(client => 
        client.preferredStylist === `${userData?.firstName} ${userData?.lastName}` ||
        client.preferredStylist === userData?.id
      );
      
      setClients(assignedClients);
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

    setFilteredClients(filtered);
    setCurrentPage(1);
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

  return (
    <DashboardLayout pageTitle="My Clients">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assigned Clients</h1>
            <p className="text-gray-600 mt-1">View clients who prefer your services (Read-only)</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Info className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-900">Read-only Access</span>
          </div>
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
            <p className="mt-4 text-gray-600">Loading your clients...</p>
          </div>
        ) : currentClients.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No assigned clients yet</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'Clients who prefer your services will appear here'}
            </p>
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
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 bg-green-100 text-green-800">
                        Preferred Client
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
                      Client since: {formatDate(client.createdAt)}
                    </div>
                    <div className="flex items-center text-sm font-medium text-purple-600">
                      <Award className="h-4 w-4 mr-2" />
                      {client.loyaltyPoints || 0} Loyalty Points
                    </div>
                    {client.notes && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                        <strong>Note:</strong> {client.notes}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/stylist/clients/${client.id}`)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
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
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
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

export default AssignedClients;
