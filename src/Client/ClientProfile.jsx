import React, { useState } from "react";
import SidebarWithHeader from "./common/components/SidebarWithHeader.jsx";
import { useAuth } from "../contexts/AuthContext";

export default function ClientProfile() {
  const { userProfile, updateUserProfile } = useAuth();

  const [firstName, setFirstName] = useState(userProfile?.firstName || "");
  const [lastName, setLastName] = useState(userProfile?.lastName || "");
  const [email, setEmail] = useState(userProfile?.email || "");
  const [phone, setPhone] = useState(userProfile?.phone || "");
  const [profileImage, setProfileImage] = useState(userProfile?.profileImage || "./placeholder.svg");

  const handleSave = () => {
    // Example: update profile function from your context
    updateUserProfile({
      firstName,
      lastName,
      email,
      phone,
      profileImage
    });
    alert("Profile updated!");
  };

  const userInfo = {
    name: userProfile?.firstName || "Client",
    subtitle: userProfile?.email || "Salon Client",
    badge: "Client",
    profileImage: profileImage
  };

  return (
    <SidebarWithHeader userInfo={userInfo} pageTitle="My Profile">
      <div className="space-y-6 max-w-md mx-auto">
        {/* Profile Picture */}
        <div className="flex justify-center">
          <img
            src={profileImage}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
          />
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-lg p-2"
            />
          </div>
        </div>
      </div>

      {/* Floating Edit Profile Button */}
      <button
        className="fixed bottom-6 right-6 text-white px-6 py-3 shadow-lg rounded-[25px] transform transition-transform duration-200 hover:-translate-y-2"
        style={{ backgroundColor: "#160B53" }}
        onClick={handleSave}
      >
        Save Profile
      </button>
    </SidebarWithHeader>
  );
}
