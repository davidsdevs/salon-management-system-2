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
import MasterProducts from "./pages/01_SystemAdmin/MasterProducts";
import ProfilePage from "./pages/shared/ProfilePage";

// ROUTE GUARDS
import ProtectedRoute, { AdminRoute, StaffRoute } from "./pages/00_Auth/ProtectedRoute";


//BRANCH MANAGER PAGES
import Appointment from "./pages/04_BranchManager/Appointments";
import Staff from "./pages/04_BranchManager/Staff";
import Schedule from "./pages/04_BranchManager/Schedule";
import StaffDetails from "./pages/04_BranchManager/StaffDetails";
import BranchManagerTransactions from "./pages/04_BranchManager/Transactions";

// APPOINTMENT PAGES
import ClientAppointments from "./pages/02_Client/ClientAppointments";
import ReceptionistAppointments from "./pages/05_Receptionist/ReceptionistAppointments";
import StylistAppointments from "./pages/07_Stylist/StylistAppointments";
import BranchAdminAppointments from "./pages/03_BranchAdmin/BranchAdminAppointments";
import OperationalManagerAppointments from "./pages/02_OperationalManager/OperationalManagerAppointments";
import SystemAdminAppointments from "./pages/01_SystemAdmin/AppointmentManagement";
import ServiceManagement from "./pages/01_SystemAdmin/ServiceManagement";
import Transactions from "./pages/01_SystemAdmin/Transactions";

// POS PAGES
import POSDashboard from "./pages/05_Receptionist/POSDashboard";

// NEW BRANCH MANAGEMENT PAGES
import BranchSettings from "./pages/03_BranchAdmin/BranchSettings";
import StaffManagement from "./pages/03_BranchAdmin/StaffManagement";
import BranchMonitoring from "./pages/02_OperationalManager/BranchMonitoring";
import BranchDetailsManagement from "./pages/01_SystemAdmin/BranchDetailsManagement";
import ServiceConfiguration from "./pages/03_BranchAdmin/ServiceConfiguration";
import HolidayManagement from "./pages/03_BranchAdmin/HolidayManagement";
import BranchProducts from "./pages/03_BranchAdmin/BranchProducts";

// INVENTORY CONTROLLER PAGES
import InventoryControllerDashboard from "./pages/06_InventoryController/Dashboard";
import InventoryProducts from "./pages/06_InventoryController/Products";
import InventoryStocks from "./pages/06_InventoryController/Stocks";
import InventoryStockTransfer from "./pages/06_InventoryController/StockTransfer";
import InventoryUpcGenerator from "./pages/06_InventoryController/UpcGenerator";
import InventoryPurchaseOrders from "./pages/06_InventoryController/PurchaseOrders";
import InventorySuppliers from "./pages/06_InventoryController/Suppliers";
import InventoryStockAlerts from "./pages/06_InventoryController/StockAlerts";
import InventoryReports from "./pages/06_InventoryController/Reports";
import InventoryCostAnalysis from "./pages/06_InventoryController/CostAnalysis";
import InventoryAudit from "./pages/06_InventoryController/InventoryAudit";
import InventoryExpiryTracker from "./pages/06_InventoryController/ExpiryTracker";
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
        path="/master-products"
        element={
          <AdminRoute>
            <MasterProducts />
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

      {/* Appointment Routes - Role Specific */}
      <Route
        path="/my-appointments"
        element={
          <ProtectedRoute>
            <ClientAppointments />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/receptionist-appointments"
        element={
          <StaffRoute>
            <ReceptionistAppointments />
          </StaffRoute>
        }
      />
      
      {/* POS Routes */}
      <Route
        path="/pos-dashboard"
        element={
          <StaffRoute>
            <POSDashboard />
          </StaffRoute>
        }
      />
      
      
      <Route
        path="/my-schedule"
        element={
          <StaffRoute>
            <StylistAppointments />
          </StaffRoute>
        }
      />
      
      <Route
        path="/branch-appointments"
        element={
          <AdminRoute>
            <BranchAdminAppointments />
          </AdminRoute>
        }
      />
      
      <Route
        path="/appointment-reports"
        element={
          <ProtectedRoute>
            <OperationalManagerAppointments />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/appointment-management"
        element={
          <AdminRoute>
            <SystemAdminAppointments />
          </AdminRoute>
        }
      />
      
      <Route
        path="/service-management"
        element={
          <AdminRoute>
            <ServiceManagement />
          </AdminRoute>
        }
      />
      
      <Route
        path="/transactions"
        element={
          <AdminRoute>
            <Transactions />
          </AdminRoute>
        }
      />
      
      {/* Legacy Branch Manager Route */}
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

      {/* NEW BRANCH MANAGEMENT ROUTES */}
      {/* Branch Settings - Branch Admin */}
      <Route
        path="/branch-settings"
        element={
          <StaffRoute>
            <BranchSettings />
          </StaffRoute>
        }
      />

      {/* Staff Management - Branch Admin */}
      <Route
        path="/staff"
        element={
          <StaffRoute>
            <StaffManagement />
          </StaffRoute>
        }
      />

      {/* Branch Products - Branch Admin */}
      <Route
        path="/branch-products"
        element={
          <StaffRoute>
            <BranchProducts />
          </StaffRoute>
        }
      />

      {/* Branch Monitoring - Operational Manager */}
      <Route
        path="/branch-monitoring"
        element={
          <StaffRoute>
            <BranchMonitoring />
          </StaffRoute>
        }
      />

      {/* INVENTORY CONTROLLER ROUTES */}
      {/* Inventory Products */}
      <Route
        path="/inventory/products"
        element={
          <StaffRoute>
            <InventoryProducts />
          </StaffRoute>
        }
      />

      {/* Inventory Stocks */}
      <Route
        path="/inventory/stocks"
        element={
          <StaffRoute>
            <InventoryStocks />
          </StaffRoute>
        }
      />

      {/* Inventory Stock Transfer */}
      <Route
        path="/inventory/stock-transfer"
        element={
          <StaffRoute>
            <InventoryStockTransfer />
          </StaffRoute>
        }
      />

      {/* Inventory UPC Generator */}
      <Route
        path="/inventory/upc-generator"
        element={
          <StaffRoute>
            <InventoryUpcGenerator />
          </StaffRoute>
        }
      />

      {/* Inventory Purchase Orders */}
      <Route
        path="/inventory/purchase-orders"
        element={
          <StaffRoute>
            <InventoryPurchaseOrders />
          </StaffRoute>
        }
      />

      {/* Inventory Suppliers */}
      <Route
        path="/inventory/suppliers"
        element={
          <StaffRoute>
            <InventorySuppliers />
          </StaffRoute>
        }
      />

      {/* Inventory Stock Alerts */}
      <Route
        path="/inventory/stock-alerts"
        element={
          <StaffRoute>
            <InventoryStockAlerts />
          </StaffRoute>
        }
      />

      {/* Inventory Reports */}
      <Route
        path="/inventory/reports"
        element={
          <StaffRoute>
            <InventoryReports />
          </StaffRoute>
        }
      />

      {/* Inventory Cost Analysis */}
      <Route
        path="/inventory/cost-analysis"
        element={
          <StaffRoute>
            <InventoryCostAnalysis />
          </StaffRoute>
        }
      />

      {/* Inventory Audit */}
      <Route
        path="/inventory/inventory-audit"
        element={
          <StaffRoute>
            <InventoryAudit />
          </StaffRoute>
        }
      />

      {/* Inventory Expiry Tracker */}
      <Route
        path="/inventory/expiry-tracker"
        element={
          <StaffRoute>
            <InventoryExpiryTracker />
          </StaffRoute>
        }
      />

      {/* Inventory Dashboard */}
      <Route
        path="/inventory/dashboard"
        element={
          <StaffRoute>
            <InventoryControllerDashboard />
          </StaffRoute>
        }
      />

      {/* Branch Details Management - System Admin */}
      <Route
        path="/branch-details"
        element={
          <AdminRoute>
            <BranchDetailsManagement />
          </AdminRoute>
        }
      />

      {/* Service Configuration - Branch Admin */}
      <Route
        path="/service-config"
        element={
          <StaffRoute>
            <ServiceConfiguration />
          </StaffRoute>
        }
      />

      {/* Holiday Management - Branch Admin */}
      <Route
        path="/holiday-management"
        element={
          <StaffRoute>
            <HolidayManagement />
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
        path="/transactions"
        element={
          <StaffRoute>
            <BranchManagerTransactions />
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
