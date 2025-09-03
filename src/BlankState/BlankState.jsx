import React from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";

import { 
  Calendar,
  History
} from "lucide-react";

export default function BlankState() {
  const { userProfile } = useAuth();

  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: userProfile?.profileImage || "./placeholder.svg"
  };



  return (
    <SidebarWithHeader
      userInfo={userInfo}
      pageTitle="Blank State"
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
      </div>
    </SidebarWithHeader>
  );
}
