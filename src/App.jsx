import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JoinAuction from "./pages/JoinAuction";
import CreateAuction from "./pages/CreateAuction";
import Auction from "./pages/Auction";

// Theme-aware Toaster component
const ThemeAwareToaster = () => {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: theme === 'dark' ? "#1f2937" : "#ffffff",
          color: theme === 'dark' ? "#fff" : "#213547",
          borderRadius: "0.5rem",
          border: `1px solid ${theme === 'dark' ? "#374151" : "#e5e7eb"}`,
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    />
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      {/* Toast notifications */}
      <ThemeAwareToaster />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />

        {/* Auth routes - redirect to home if already logged in */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Email verification and password reset - accessible to all */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join"
          element={
            <ProtectedRoute>
              <JoinAuction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateAuction />
            </ProtectedRoute>
          }
        />
        <Route path="/auction" element={<Auction />} />
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
