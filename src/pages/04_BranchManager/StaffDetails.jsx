import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { userService } from "../../services/userService";
import { serviceService } from "../../services/serviceService";
import { branchService } from "../../services/branchService";
import {
  ArrowLeft,
  Calendar,
  User,
  Briefcase,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Users,
  UserCog,
  Home,
  Package,
  BarChart3,
  Receipt,
  Settings
} from "lucide-react";
import { branchManagerMenuItems } from "./menuItems";

const StaffDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [allServices, setAllServices] = useState([]);
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [staffServices, setStaffServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryError, setEntryError] = useState('');
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '' });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [branchName, setBranchName] = useState('');

  // Get unique categories from all services
  const serviceCategories = [...new Set(allServices.map(service => service.category).filter(Boolean))];

  // Load staff details and services on component mount
  useEffect(() => {
    const loadStaffDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get staff ID from URL params or location state
        const staffId = location.state?.staffId || location.pathname.split('/').pop();
        
        if (!staffId) {
          throw new Error('Staff ID not provided');
        }

        // Load staff details using userService
        const staffData = await userService.getUserById(staffId, userData?.roles?.[0], userData?.uid);
        
        if (staffData) {
          setStaff(staffData);
          setSelectedServices(staffData.service_id || []);
          
          // Show warning if user is pending activation
          if (staffData.isPendingActivation) {
            console.log('Staff member is pending activation');
          }
          
          // Load details for assigned services
          if (staffData.service_id && staffData.service_id.length > 0) {
            const assignedServices = [];
            for (const serviceId of staffData.service_id) {
              try {
                const serviceDetails = await serviceService.getServiceById(serviceId);
                if (serviceDetails) {
                  assignedServices.push({ id: serviceId, ...serviceDetails });
                }
              } catch (error) {
                console.error(`Error loading service ${serviceId}:`, error);
              }
            }
            setStaffServices(assignedServices);
          }
        } else {
          throw new Error('Staff member not found');
        }

        // Load all available services for this branch
        const services = await serviceService.getServicesByBranch(userData?.branchId);
        
        setAllServices(services);

        // Load certificates from staff data (stored as array)
        if (staffData.certificates && Array.isArray(staffData.certificates)) {
          setCertificates(staffData.certificates);
        } else {
          setCertificates([]);
        }

        // Load branch name
        if (staffData.branchId) {
          try {
            const branch = await branchService.getBranch(staffData.branchId, userData.roles?.[0], userData.uid);
            setBranchName(branch.name || staffData.branchId);
          } catch (err) {
            console.error('Error loading branch data:', err);
            setBranchName(staffData.branchId);
          }
        }
        

      } catch (err) {
        console.error('Error loading staff details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      loadStaffDetails();
    }
  }, [userData, location]);

  const toggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSaveServices = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update the user's service_id array
      // Use id instead of uid for pending users
      const userId = staff.uid || staff.id;
      await userService.updateUser(userId, { service_id: selectedServices }, userData?.roles?.[0], userData?.uid);

      // Update local staff data
      setStaff(prev => ({
        ...prev,
        service_id: selectedServices
      }));

      // Reload staff services with details
      if (selectedServices.length > 0) {
        const assignedServices = [];
        for (const serviceId of selectedServices) {
          try {
            const serviceDetails = await serviceService.getServiceById(serviceId);
            if (serviceDetails) {
              assignedServices.push({ id: serviceId, ...serviceDetails });
            }
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
          }
        }
        setStaffServices(assignedServices);
      } else {
        setStaffServices([]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving services:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Staff Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-[#160B53]" />
              <p className="text-gray-600">Loading staff details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Staff Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-red-600">{error}</p>
              <Button
                onClick={() => navigate("/staff")}
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Staff
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // No staff data
  if (!staff) {
    return (
      <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Staff Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <User className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">Staff member not found</p>
              <Button
                onClick={() => navigate("/staff")}
                className="flex items-center gap-2 bg-[#160B53] text-white hover:bg-[#12094A]"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Staff
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout menuItems={branchManagerMenuItems} pageTitle="Staff Details">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* === Back Button === */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => navigate("/staff")}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Staff
          </Button>
        </div>

        {/* === Pending Activation Warning === */}
        {staff.isPendingActivation && (
          <Card className="bg-yellow-50 border-yellow-200 border-2">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">Pending Activation</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    This staff member has been pre-registered but hasn't completed their account activation yet.
                  </p>
                  <div className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                    <strong>Next Steps:</strong> The staff member needs to:
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Go to the registration page</li>
                      <li>Use their email: <strong>{staff.email}</strong></li>
                      <li>Enter the temporary password provided by the manager</li>
                      <li>Complete registration to activate their account</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* === Staff Profile Header === */}
        <Card className="bg-gradient-to-r from-[#160B53] to-[#2D1B69] text-white p-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-white/20 flex items-center justify-center ring-4 ring-white/30">
                {staff.imageUrl ? (
                  <img 
                    src={staff.imageUrl} 
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white text-3xl font-bold">
                    {staff.firstName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                staff.isPendingActivation ? 'bg-yellow-500' : staff.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {staff.isPendingActivation ? (
                  <Clock className="h-3 w-3 text-white" />
                ) : staff.isActive ? (
                  <CheckCircle className="h-3 w-3 text-white" />
                ) : (
                  <XCircle className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {staff.firstName} {staff.middleName} {staff.lastName}
              </h1>
              <p className="text-white/80 text-lg mb-3">Professional Stylist</p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Branch: {branchName || 'Not assigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined: {staff.createdAt ? new Date(staff.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button
                className="bg-white/20 text-white hover:bg-white/30 border border-white/30 backdrop-blur-sm"
                onClick={() => setIsModalOpen(true)}
              >
                Manage Services
              </Button>
              <Button
                className="bg-white text-[#160B53] hover:bg-white/90"
                onClick={() => {
                  setEditData({
                    firstName: staff.firstName || '',
                    middleName: staff.middleName || '',
                    lastName: staff.lastName || '',
                    email: staff.email || '',
                    phone: staff.phone || '',
                    address: staff.address || ''
                  });
                  setIsEditOpen(true);
                }}
              >
                Edit Profile
              </Button>
              {!staff.isPendingActivation && (
                <Button
                  className={staff.isActive ? "bg-red-500 text-white hover:bg-red-600" : "bg-green-500 text-white hover:bg-green-600"}
                  onClick={async () => {
                    try {
                      setIsUpdating(true);
                      const userId = staff.uid || staff.id;
                      const newStatus = !staff.isActive;
                      await userService.updateUser(userId, { isActive: newStatus }, userData?.roles?.[0]);
                      setStaff({ ...staff, isActive: newStatus });
                    } catch (e) {
                      setError(e.message || 'Failed to update status');
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : staff.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* === Contact Information === */}
        <Card className="bg-white p-6 shadow-lg border-0">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-[#160B53]" />
            Contact Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-full">
                <Phone className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{staff.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{staff.email}</p>
              </div>
            </div>

            {staff.address && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-full">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900">{staff.address}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* === Services Section === */}
        <Card className="bg-white p-6 shadow-lg border-0">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#160B53]" />
              Services Offered
            </h3>
          </div>

          {staffServices && staffServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffServices.map(service => (
                <div 
                  key={service.id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-semibold text-[#160B53]">
                          ₱{service.prices && service.prices.length > 0 ? service.prices[0] : 'N/A'}
                        </span>
                        {service.duration && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {service.duration} mins
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {service.category}
                        </span>
                        {service.isChemical && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            Chemical
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Services Assigned</h4>
              <p className="text-gray-600 mb-4">This stylist hasn't been assigned any services yet.</p>
            </div>
          )}
        </Card>

        {/* === Certificates === */}
        <Card className="bg-white p-6 shadow-lg border-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#160B53]" />
              Certificates
            </h3>
            <Button className="bg-[#160B53] text-white hover:bg-[#12094A]" onClick={() => setIsCertOpen(true)}>Add Certificate</Button>
          </div>
          {certificates.length === 0 ? (
            <p className="text-gray-600">No certificates yet.</p>
          ) : (
            <div className="space-y-3">
              {certificates.map((ct, idx) => (
                <div key={idx} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700">{ct.name || '—'} {ct.issuer ? `• ${ct.issuer}` : ''} {ct.date ? `• ${ct.date}` : ''}</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        // Delete certificate from array by index
                        const updatedCerts = certificates.filter((_, index) => index !== idx);
                        
                        const userId = staff.uid || staff.id;
                        await userService.updateUser(userId, { certificates: updatedCerts }, userData?.roles?.[0]);
                        setCertificates(updatedCerts);
                      } catch (e) {
                        setEntryError(e.message || 'Failed to delete');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Modals */}
        {isCertOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div className="text-lg font-semibold">
                  Add Certificate
                </div>
                <Button variant="ghost" size="sm" className="p-1" onClick={() => { setIsCertOpen(false); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {entryError && <div className="px-6 pt-4 text-sm text-red-600">{entryError}</div>}

              <div className="p-6 space-y-4">
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Name</label>
                      <input className="w-full px-3 py-2 border rounded" value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issuer</label>
                      <input className="w-full px-3 py-2 border rounded" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input className="w-full px-3 py-2 border rounded" type="date" value={newCert.date} onChange={e => setNewCert({ ...newCert, date: e.target.value })} />
                    </div>
                  </>
                
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsCertOpen(false); }}>Cancel</Button>
                <Button
                  className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  disabled={entryLoading}
                  onClick={async () => {
                    try {
                      setEntryError('');
                      setEntryLoading(true);
                      
                      if (!newCert.name) {
                        setEntryError('Certificate name is required');
                        setEntryLoading(false);
                        return;
                      }
                      
                      const userId = staff.uid || staff.id;
                      
                      // Add new certificate to array (will be index 0, 1, 2, etc.)
                      const updatedCerts = [...certificates, newCert];
                      
                      // Save to Firestore users collection as simple array
                      await userService.updateUser(userId, { certificates: updatedCerts }, userData?.roles?.[0]);
                      
                      // Update local state
                      setCertificates(updatedCerts);
                      setNewCert({ name: '', issuer: '', date: '' });
                      setIsCertOpen(false);
                    } catch (e) {
                      setEntryError(e.message || 'Failed to save');
                    } finally {
                      setEntryLoading(false);
                    }
                  }}
                >
                  {entryLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === Edit Profile Modal === */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-[#160B53] text-white">
                <div className="text-lg font-semibold">Edit Staff Profile</div>
                <Button variant="ghost" size="sm" className="p-1 text-white hover:bg-white/20" onClick={() => setIsEditOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {error && <div className="px-6 pt-4 text-sm text-red-600">{error}</div>}

              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      value={editData.firstName || ''}
                      onChange={e => setEditData({ ...editData, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      value={editData.middleName || ''}
                      onChange={e => setEditData({ ...editData, middleName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      value={editData.lastName || ''}
                      onChange={e => setEditData({ ...editData, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      className="w-full px-3 py-2 border rounded bg-gray-50"
                      value={editData.email || ''}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      value={editData.phone || ''}
                      onChange={e => setEditData({ ...editData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      className="w-full px-3 py-2 border rounded"
                      value={editData.address || ''}
                      onChange={e => setEditData({ ...editData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button
                  className="bg-[#160B53] text-white hover:bg-[#12094A]"
                  disabled={isUpdating}
                  onClick={async () => {
                    try {
                      if (!editData.firstName || !editData.lastName) {
                        setError('First name and last name are required');
                        return;
                      }
                      setIsUpdating(true);
                      setError('');
                      const userId = staff.uid || staff.id;
                      
                      await userService.updateUser(userId, {
                        firstName: editData.firstName,
                        middleName: editData.middleName,
                        lastName: editData.lastName,
                        phone: editData.phone,
                        address: editData.address,
                        name: `${editData.firstName} ${editData.middleName ? editData.middleName + ' ' : ''}${editData.lastName}`.trim()
                      }, userData?.roles?.[0]);
                      
                      // Update local staff state
                      setStaff({
                        ...staff,
                        firstName: editData.firstName,
                        middleName: editData.middleName,
                        lastName: editData.lastName,
                        phone: editData.phone,
                        address: editData.address
                      });
                      
                      setIsEditOpen(false);
                    } catch (e) {
                      setError(e.message || 'Failed to update profile');
                    } finally {
                      setIsUpdating(false);
                    }
                  }}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* === Enhanced Services Modal === */}
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 p-4 ${
            isModalOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Manage Services</h2>
                    <p className="text-white/80 text-sm mt-1">
                      Assign services to {staff.firstName} {staff.lastName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#160B53]"
                  >
                    <option value="">All Categories</option>
                    {serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allServices
                  .filter(service => {
                    const matchesSearch = searchTerm === '' || 
                      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = categoryFilter === '' || service.category === categoryFilter;
                    return matchesSearch && matchesCategory;
                  })
                  .map((service) => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`group relative p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        isSelected
                          ? 'border-[#160B53] bg-gradient-to-br from-[#160B53]/5 to-[#2D1B69]/5 shadow-lg'
                          : 'border-gray-200 hover:border-[#160B53]/50 hover:bg-gray-50'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className="absolute top-3 right-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#160B53] bg-[#160B53] scale-110' 
                              : 'border-gray-300 group-hover:border-[#160B53]/50'
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>

                      {/* Service Image */}
                      <div className="h-20 w-full mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                        {service.imageURL ? (
                          <img 
                            src={service.imageURL} 
                            alt={service.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500">
                            <Briefcase className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* Service Details */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-[#160B53] transition-colors">
                          {service.name}
                        </h3>
                        
                        {service.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-[#160B53]">
                              ₱{service.prices && service.prices.length > 0 ? service.prices[0] : 'N/A'}
                            </span>
                            {service.duration && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {service.duration} mins
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {service.category}
                          </span>
                          {service.isChemical && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              Chemical
                            </span>
                          )}
                          {service.isActive ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {allServices.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
                  <p className="text-gray-600">No services are available for this branch.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </Button>
                <Button
                  className="bg-[#160B53] text-white hover:bg-[#12094A] transition-colors"
                  onClick={handleSaveServices}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default StaffDetails;