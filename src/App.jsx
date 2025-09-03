import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./common/components/Header";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import Footer from "./common/components/Footer";

// CLIENT PAGES
import ClientDashboard from "./Client/ClientDashboard";
import ClientAppointment from "./Client/ClientAppointments";
import ClientProfile from "./Client/ClientProfile";
import ClientBookAppointment from "./Client/ClientBookAppointment";

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1">
              <LoginForm />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/register"
        element={
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1">
              <RegisterForm />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1">
              <ForgotPassword />
            </main>
            <Footer />
          </div>
        }
      />
      <Route
        path="/reset-password"
        element={
          <div className="min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1">
              <ResetPassword />
            </main>
            <Footer />
          </div>
        }
      />

      {/* Protected Client Routes */}
      <Route
        path="/client-dashboard"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      {/* Appointments Route (Parent) */}
      <Route
        path="/client-appointments"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientAppointment />
          </ProtectedRoute>
        }
      />

      {/* Book Appointment as Child Route */}
      <Route
        path="/client-appointments/book"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientBookAppointment />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client-profile"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientProfile />
          </ProtectedRoute>
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
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;