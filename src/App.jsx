import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navigation from "./pages/shared/Navigation";
import Footer from "./pages/shared/Footer";
import ScrollToTop from "./pages/shared/ScrollToTop";

// LANDING PAGES
import HomePage from "./pages/shared/HomePage";
import AboutPage from "./pages/shared/AboutPage";
import ProductsPage from "./pages/shared/ProductsPage";
import BranchPage from "./pages/shared/BranchPage";
import BranchServicesPage from "./pages/shared/BranchServicesPage";
import BranchStylistsPage from "./pages/shared/BranchStylistsPage";
import BranchGalleryPage from "./pages/shared/BranchGalleryPage";
import BranchProductsPage from "./pages/shared/BranchProductsPage";
import ServiceDetailPage from "./pages/shared/ServiceDetailPage";
import StylistProfilePage from "./pages/shared/StylistProfilePage";

// AUTH PAGES
import LoginForm from "./pages/00_Auth/LoginForm";
import RegisterForm from "./pages/00_Auth/RegisterForm";
import ForgotPassword from "./pages/00_Auth/ForgotPassword";

// DASHBOARD PAGES
import DashboardRouter from "./pages/shared/DashboardRouter";
import UserManagement from "./pages/01_SystemAdmin/UserManagement";
import BranchManagement from "./pages/01_SystemAdmin/BranchManagement";
import ProfilePage from "./pages/shared/ProfilePage";

// ROUTE GUARDS
import ProtectedRoute, { AdminRoute, StaffRoute } from "./pages/00_Auth/ProtectedRoute";


//BRANCH MANAGER PAGES
import Appointment from "./pages/04_BranchManager/Appointments";
import Staff from "./pages/04_BranchManager/Staff";
import Schedule from "./pages/04_BranchManager/Schedule";
import StaffDetails from "./pages/04_BranchManager/StaffDetails";
function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page Routes */}
      <Route
        path="/"
        element={
          <div className="min-h-screen bg-white">
            <Navigation />
            <main>
              <HomePage />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/about"
        element={
          <div className="min-h-screen bg-white">
            <Navigation />
            <main>
              <AboutPage />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/products"
        element={
          <div className="min-h-screen bg-white">
            <Navigation />
            <main>
              <ProductsPage />
            </main>
            <Footer />
          </div>
        }
      />

      {/* Branch Routes */}
      <Route path="/branch/:slug" element={<BranchPage />} />
      <Route path="/branch/:slug/services" element={<BranchServicesPage />} />
      <Route path="/branch/:slug/services/:serviceId" element={<ServiceDetailPage />} />
      <Route path="/branch/:slug/stylists" element={<BranchStylistsPage />} />
      <Route path="/branch/:slug/stylists/:stylistId" element={<StylistProfilePage />} />
      <Route path="/branch/:slug/gallery" element={<BranchGalleryPage />} />
      <Route path="/branch/:slug/products" element={<BranchProductsPage />} />

      {/* Authentication Routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Dashboard Routes - All Same Level */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-management"
        element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/branch-management"
        element={
          <AdminRoute>
            <BranchManagement />
          </AdminRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      {/* Appointment Routes */}
      <Route
        path="/appointments"
        element={
          <StaffRoute>
            <Appointment />
          </StaffRoute>
        }
      />
      {/* Staff Routes */}
      <Route
        path="/staff"
        element={
          <StaffRoute>
            <Staff />
          </StaffRoute>
        }
      />

      {/* Inventory Routes */}
      <Route
        path="/inventory"
        element={
          <StaffRoute>
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h1>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">Inventory management page - Coming soon!</p>
                </div>
              </div>
            </div>
          </StaffRoute>
        }
      />

      {/* Reports Routes */}
      <Route
        path="/reports"
        element={
          <StaffRoute>
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600">Reports page - Coming soon!</p>
                </div>
              </div>
            </div>
          </StaffRoute>
        }
      />

      {/* Unauthorized Page */}
      <Route
        path="/schedule"
        element={
          <StaffRoute> 
            <Schedule />
          </StaffRoute>
        }
      />
     <Route
  path="/staff/details"
  element={
    <StaffRoute>
      <StaffDetails />
    </StaffRoute>
  }
/>
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
              <p className="text-gray-600 mb-8">You don't have permission to access this page.</p>
              <button
                onClick={() => window.history.back()}
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
              >
                Go Back
              </button>
            </div>
          </div>
        }
      />

    
      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
    <Router>
      <ScrollToTop />
      <AppRoutes />
    </Router>
    </AuthProvider>
  );
}

export default App;
