import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute component that wraps routes requiring authentication.
 * Redirects to login page if user is not authenticated.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content to render
 * @param {string} [props.redirectTo="/login"] - Path to redirect unauthenticated users
 */
export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Render the protected content
  return children;
}

/**
 * PublicRoute component that redirects authenticated users away from public pages.
 * Useful for login/register pages that shouldn't be accessible when logged in.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The public content to render
 * @param {string} [props.redirectTo="/"] - Path to redirect authenticated users
 */
export function PublicRoute({ children, redirectTo = "/" }) {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to home if already authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render the public content
  return children;
}
