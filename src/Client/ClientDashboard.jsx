import React from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";


import { 
  Calendar,
  History
} from "lucide-react";

export default function ClientDashboard() {
  const { userProfile } = useAuth();
const navigate = useNavigate();
  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: userProfile?.profileImage || "./placeholder.svg"
  };



  return (
    <SidebarWithHeader
      userInfo={userInfo}
      pageTitle="Client Dashboard"
    >
      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome back, {userInfo.name}!
              </h2>
              <p className="text-gray-600">
                Here's what's happening with your salon appointments today.
              </p>
            </div>
            <div className="text-4xl text-[#160B53]">
              <i className="ri-user-heart-line"></i>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
              <div className="text-2xl text-blue-600">
                <Calendar className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Visits</p>
                <p className="text-2xl font-semibold text-gray-900">15</p>
              </div>
              <div className="text-2xl text-green-600">
                <History className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
                <p className="text-2xl font-semibold text-gray-900">450</p>
              </div>
              <div className="text-2xl text-purple-600">
                <i className="ri-gift-line"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-green-600">
                <i className="ri-check-line text-xl"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Appointment completed</p>
                <p className="text-xs text-gray-500">Haircut & Styling - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-blue-600">
                <i className="ri-calendar-line text-xl"></i>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Appointment scheduled</p>
                <p className="text-xs text-gray-500">Manicure & Pedicure - Tomorrow at 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
       <button
  className="fixed bottom-6 right-6 text-white px-6 py-3 shadow-lg rounded-[25px] transform transition-transform duration-200 hover:-translate-y-2"
  style={{ backgroundColor: "#160B53" }}
  onClick={() => navigate("/client-appointments/book")}
>
  Book New Appointment 
</button>

    </SidebarWithHeader>
  );
}
