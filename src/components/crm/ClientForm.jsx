import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../pages/ui/card';
import { Button } from '../../pages/ui/button';
import { clientService } from '../../services/clientService';
import { X, Save, User, Phone, Mail, Calendar, Gift, FileText } from 'lucide-react';

const ClientForm = ({ mode = 'create' }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    gender: '',
    birthdate: '',
    preferredStylist: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && clientId) {
      loadClient();
    }
  }, [mode, clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      const client = await clientService.getClientById(clientId);
      
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        phone: client.phone || '',
        email: client.email || '',
        gender: client.gender || '',
        birthdate: client.birthdate ? formatDateForInput(client.birthdate) : '',
        preferredStylist: client.preferredStylist || '',
        notes: client.notes || ''
      });
    } catch (error) {
      console.error('Error loading client:', error);
      setError('Failed to load client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const clientData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        birthdate: formData.birthdate ? new Date(formData.birthdate) : null,
        // NOTE: No branchId - clients can book at any branch
        preferredStylist: formData.preferredStylist.trim(),
        notes: formData.notes.trim()
      };

      if (mode === 'create') {
        await clientService.createClient(clientData);
        navigate('/receptionist/clients', { 
          state: { message: 'Client created successfully!' }
        });
      } else {
        await clientService.updateClient(clientId, clientData);
        navigate(`/receptionist/clients/${clientId}`, { 
          state: { message: 'Client updated successfully!' }
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      setError('Failed to save client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit') {
      navigate(`/receptionist/clients/${clientId}`);
    } else {
      navigate('/receptionist/clients');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                    placeholder="Dela Cruz"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Gift className="h-4 w-4 mr-1" />
                  Birthday
                </label>
                <input
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                    value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  placeholder="09123456789"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  placeholder="juan@example.com"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Preferences
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Stylist
              </label>
              <input
                type="text"
                value={formData.preferredStylist}
                onChange={(e) => setFormData({ ...formData, preferredStylist: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                placeholder="Enter stylist name"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
              placeholder="Any special notes about this client..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#160B53] hover:bg-[#2D1B69] text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === 'create' ? 'Create Client' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ClientForm;
