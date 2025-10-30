import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { staffApiService } from "../../services/staffApiService";
import {
  ArrowLeft,
  Calendar,
  Star,
  User,
  Briefcase,
  MapPin,
  Clock,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Home,
  Users,
  Package,
  Receipt,
  BarChart3,
  UserCog,
  Award,
} from "lucide-react";

// === Modal Component ===
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button
            className="text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            X
          </Button>
        </div>
        <div>{children}</div>
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={onClose}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

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

  const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/staff", label: "Staff", icon: Users },
    { path: "/schedule", label: "Schedule", icon: Calendar },
    { path: "/inventory", label: "Inventory", icon: Package },
    { path: "/transactions", label: "Transactions", icon: Receipt },
    { path: "/loyalty-settings", label: "Loyalty Settings", icon: Award },
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/profile", label: "Profile", icon: UserCog },
  ];

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

        // Load staff details
        const staffResponse = await staffApiService.getStaffDetails(
          staffId,
          userData?.role,
          userData?.id
        );

        if (staffResponse.success) {
          setStaff(staffResponse.staff);
          setSelectedServices(staffResponse.staff.services || []);
        } else {
          throw new Error('Failed to load staff details');
        }

        // Load all available services
        const servicesResponse = await staffApiService.getAllServices(userData?.role);
        
        if (servicesResponse.success) {
          setAllServices(servicesResponse.services);
        } else {
          throw new Error('Failed to load services');
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

      const response = await staffApiService.updateStaffServices(
        staff.id,
        selectedServices,
        userData?.role,
        userData?.id
      );

      if (response.success) {
        // Update local staff data
        setStaff(prev => ({
          ...prev,
          services: selectedServices
        }));
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to update services');
      }
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
      <DashboardLayout menuItems={menuItems} pageTitle="Staff Details">
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
      <DashboardLayout menuItems={menuItems} pageTitle="Staff Details">
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
      <DashboardLayout menuItems={menuItems} pageTitle="Staff Details">
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
    <DashboardLayout menuItems={menuItems} pageTitle="Staff Details">
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

        {/* === Staff Information === */}
        <Card className="bg-white p-6 shadow border space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h2>
              <p className="text-gray-500 capitalize">{staff.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>Branch: {staff.branchId || 'Not assigned'}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>Contact: {staff.phone || 'Not provided'}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Joined: {staff.createdAt ? new Date(staff.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>Email: {staff.email}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              {staff.isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-700">Active</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700">Inactive</span>
                </>
              )}
            </div>
          </div>

          {/* === Edit Services Button === */}
          <div className="mt-4">
            <Button
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setIsModalOpen(true)}
            >
              Edit Services
            </Button>
          </div>
        </Card>

        {/* === Performance Overview === */}
        <Card className="bg-white p-6 shadow border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Performance Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="text-xl font-semibold">{staff.rating}/5</p>
              </div>
            </div>

            {/* Shifts Completed */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Shifts Completed</p>
                <p className="text-xl font-semibold">{staff.shiftsCompleted}</p>
              </div>
            </div>
            {/* Probation Period */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Probation Ends</p>
                <p className="text-xl font-semibold">{staff.probationEnd}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* === Services Modal === */}
<div
  className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 ${
    isModalOpen ? 'block' : 'hidden'
  }`}
>
  <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="bg-[#160B53] px-4 py-3 text-white flex justify-between items-center">
       <div className="flex flex-col">
        <h2 className="text-lg sm:text-1xl font-bold">Edit Services</h2>
        <span className="text-sm text-white/80">Select the services this staff can provide</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(false)}
        className="text-white hover:bg-white/20 p-2"
      >
        X
      </Button>
    </div>

    {/* Error Display */}
    {error && (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )}

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {allServices.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md flex items-center justify-between ${
                isSelected
                  ? 'border-[#160B53] bg-[#160B53]/10 shadow-md'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex-1">
                <span className="text-gray-900 font-medium block">{service.name}</span>
                {service.description && (
                  <span className="text-sm text-gray-500 block mt-1">{service.description}</span>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-[#160B53] font-semibold">₱{service.price}</span>
                  {service.duration && (
                    <span className="text-xs text-gray-500">({service.duration} mins)</span>
                  )}
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ml-2 ${
                  isSelected ? 'border-[#160B53] bg-[#160B53]' : 'border-gray-300'
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Footer */}
    <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t flex justify-end gap-2">
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(false)}
        disabled={saving}
      >
        Cancel
      </Button>
      <Button
        className="bg-[#160B53] text-white hover:bg-[#160B53]/90"
        onClick={handleSaveServices}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </div>
  </div>
</div>

      </div>
    </DashboardLayout>
  );
};

export default StaffDetails;