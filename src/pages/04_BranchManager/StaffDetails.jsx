import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../shared/DashboardLayout";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState([
    "Haircut",
    "Shampoo",
    "Beard Trim",
    "Hair Coloring",
    "Facial",
    "Manicure",
    "Pedicure",
    "Massage",
    "Hair Treatment",
  ]);

  const allServices = [
    "Haircut",
    "Shampoo",
    "Beard Trim",
    "Hair Coloring",
    "Facial",
    "Manicure",
    "Pedicure",
    "Massage",
    "Hair Treatment",
  ];

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Get staff info from state or fallback to hardcoded values
  const staff = location.state?.staff || {
    name: "Marvin Santos",
    role: "Stylist",
    branch: "Subic Branch",
    contact: "0917-123-4567",
    email: "marvin.santos@salonhub.com",
    joinedAt: "January 10, 2025",
    probationEnd: "December 31, 2025",
    status: "Active",
    rating: 4.7,
    shiftsCompleted: 128,
  };

  return (
    <DashboardLayout pageTitle="Staff Details">
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
              <h2 className="text-2xl font-semibold text-gray-900">{staff.name}</h2>
              <p className="text-gray-500">{staff.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="h-4 w-4 text-gray-500" />
              <span>Branch: {staff.branch}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>Contact: {staff.contact}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span>Joined: {staff.joinedAt}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-500" />
              <span>Probation Ends: {staff.probationEnd}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>Email: {staff.email}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-700">
              {staff.status === "Active" ? (
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
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Edit Services"
        >
          <div className="grid grid-cols-1 gap-2">
            {allServices.map((service) => (
              <label key={service} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => toggleService(service)}
                  className="accent-indigo-600"
                />
                {service}
              </label>
            ))}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default StaffDetails;