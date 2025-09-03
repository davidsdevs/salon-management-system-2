import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, authLoading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // 🔹 Load from localStorage or sessionStorage first
  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (storedUser) {
      setUserProfile(storedUser);
      setUserRole(storedUser.role || "client");
    }
  }, []);

  // 🔹 Sync with Firebase Auth (refresh profile when logged in)
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const fetchUserProfile = async () => {
        try {
          setProfileLoading(true);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = { uid: user.uid, email: user.email, ...userDoc.data() };
            setUserProfile(data);
            setUserRole(data.role || "client");

            // overwrite storage (respect Remember Me)
            if (localStorage.getItem("user")) {
              localStorage.setItem("user", JSON.stringify(data));
            } else {
              sessionStorage.setItem("user", JSON.stringify(data));
            }
          } else {
            setUserRole("client"); // fallback
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserRole("client");
        } finally {
          setProfileLoading(false);
        }
      };
      fetchUserProfile();
    } else {
      setUserRole(null);
      setUserProfile(null);
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
    }
  }, [user, authLoading]);

  const refreshUserRole = async () => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = { uid: user.uid, email: user.email, ...userDoc.data() };
          setUserProfile(data);
          setUserRole(data.role || "client");

          // update whichever storage is in use
          if (localStorage.getItem("user")) {
            localStorage.setItem("user", JSON.stringify(data));
          } else {
            sessionStorage.setItem("user", JSON.stringify(data));
          }

          return data.role || "client";
        }
      } catch (error) {
        console.error("Error refreshing user role:", error);
      }
    }
    return null;
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      setUserProfile(null);
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const value = {
    user,
    userRole,
    userProfile,
    loading: authLoading,
    isAuthenticated: !!(user || userProfile), // ✅ check also from storage
    isClient: userRole === "client",
    isStylist: userRole === "stylist",
    isReceptionist: userRole === "receptionist",
    isBranchManager: userRole === "branch-manager",
    isInventoryController: userRole === "inventory-controller",
    isOperationalManager: userRole === "operational-manager",
    isBranchAdmin: userRole === "branch-admin",
    isSuperAdmin: userRole === "super-admin",
    refreshUserRole,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}