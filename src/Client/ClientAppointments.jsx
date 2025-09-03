import React, { useState } from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientAppointments() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: userProfile?.profileImage || "./placeholder.svg"
  };

  // Dummy appointments
  const appointmentsData = [
    {
      id: 1,
      service: "Hair Cut & Style",
      stylist: "Sarah Johnson",
      date: "2025-08-19 14:00",
      branch: "Makati Branch",
      status: "confirmed",
    },
    {
      id: 2,
      service: "Manicure",
      stylist: "Lisa Chen",
      date: "2025-08-15 14:00",
      branch: "Harbor Point Branch",
      status: "pending",
    },
    {
      id: 3,
      service: "Hair Color",
      stylist: "Claire Smith",
      date: "2025-08-20 11:00",
      branch: "Subic Bay Branch",
      status: "confirmed",
    },
  ];

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Filtered appointments based on search and filter
  const filteredAppointments = appointmentsData.filter((appt) => {
    const matchesSearch =
      appt.service.toLowerCase().includes(search.toLowerCase()) ||
      appt.stylist.toLowerCase().includes(search.toLowerCase()) ||
      appt.branch.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "All" ? true : appt.status.toLowerCase() === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  return (
    <SidebarWithHeader userInfo={userInfo} pageTitle="My Appointments">
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 w-full md:w-1/2"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2"
          >
            <option value="All">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Card Title */}
        <h2 className="text-xl font-semibold text-gray-900">
          {filter === "All" ? "Upcoming Appointments" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Appointments`}
        </h2>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appt) => (
            <div key={appt.id} className="flex items-center justify-between bg-white shadow-sm rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{appt.service}</p>
                  <p className="text-sm text-gray-500">with {appt.stylist}</p>
                  <p className="text-xs text-gray-400">{appt.date} @ {appt.branch}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    appt.status === "confirmed" ? "bg-green-100 text-green-700" :
                    appt.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}
                >
                  {appt.status}
                </span>
                <button
                  className="px-3 py-1 text-white text-sm rounded-lg"
                  style={{ backgroundColor: "#160B53" }}
                >
                  Reschedule
                </button>
                <button
                  className="px-3 py-1 text-sm rounded-lg border"
                  style={{ borderColor: "#160B53", color: "#160B53" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ))}
          {filteredAppointments.length === 0 && (
            <p className="text-gray-500">No appointments found.</p>
          )}
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
