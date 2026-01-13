import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { validateEmail } from "../services/authService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, resendVerificationEmail } = useAuth();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setNeedsVerification(false);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success("Login successful!");
        navigate(from, { replace: true });
      } else {
        // Check if error is due to unverified email
        if (result.error?.includes("verify") || result.error?.includes("verification")) {
          setNeedsVerification(true);
          setUnverifiedEmail(formData.email);
          toast.error("Please verify your email before logging in");
        } else {
          toast.error(result.error || "Login failed");
          setErrors({ submit: result.error });
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await resendVerificationEmail(unverifiedEmail);
      if (result.success) {
        toast.success("Verification email sent!");
      } else {
        toast.error(result.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    }
  };

  return (
    <div className="login-page">
      <Navbar />

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Welcome Back</h2>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          {/* Email Verification Notice */}
          {needsVerification && (
            <div className="verification-notice">
              <p>Your email is not verified yet.</p>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendVerification}
              >
                Resend Verification Email
              </button>
            </div>
          )}

          {/* Email */}
          <div className="input-group">
            <input
              type="text"
              name="email"
              className={`login-input ${errors.email ? "input-error" : ""}`}
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>

          {/* Password */}
          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`login-input ${errors.password ? "input-error" : ""}`}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="show-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="forgot-password">
            <Link to="/forgot-password">Forgot your password?</Link>
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}
