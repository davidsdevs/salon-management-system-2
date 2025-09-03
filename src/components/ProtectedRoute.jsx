import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Scissors } from "lucide-react";

export default function ProtectedRoute({ children, requiredRole = null, fallback = "/login" }) {
  const { user, loading, userRole, isAuthenticated } = useAuth();

  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center transition-opacity duration-300">
        <Scissors className="w-12 h-12 text-[#160B53] animate-spin mb-6" />
        <div className="w-48 h-2 bg-gray-300 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-[#160B53] w-1/3 animate-pulse"></div>
        </div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={fallback} replace />;

  if (requiredRole && userRole !== requiredRole) {
    const dashboardPath = `/${userRole}-dashboard`;
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
}