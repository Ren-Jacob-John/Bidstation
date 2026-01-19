import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { validatePassword } from "../services/authService";
import "./ResetPassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

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

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        setResetSuccess(true);
        toast.success("Password reset successful!");
      } else {
        // Check if token is expired or invalid
        if (result.error?.includes("expired") || result.error?.includes("invalid")) {
          setTokenError(true);
        }
        toast.error(result.error || "Password reset failed");
        setErrors({ submit: result.error });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Token error screen
  if (tokenError) {
    return (
      <div className="reset-page">
        <Navbar />
        <div className="reset-container">
          <div className="reset-card error">
            <div className="reset-icon">⚠️</div>
            <h2 className="reset-title">Invalid or Expired Link</h2>
            <p className="reset-message">
              This password reset link is invalid or has expired.
            </p>
            <p className="reset-submessage">
              Please request a new password reset link.
            </p>
            <button
              className="reset-btn"
              onClick={() => navigate("/forgot-password")}
            >
              Request New Link
            </button>
            <Link to="/login" className="back-link">
              Back to Login
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Success screen
  if (resetSuccess) {
    return (
      <div className="reset-page">
        <Navbar />
        <div className="reset-container">
          <div className="reset-card success">
            <div className="reset-icon">✓</div>
            <h2 className="reset-title">Password Reset!</h2>
            <p className="reset-message">
              Your password has been successfully reset.
            </p>
            <p className="reset-submessage">
              You can now log in with your new password.
            </p>
            <button
              className="reset-btn"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="reset-page">
      <Navbar />

      <div className="reset-container">
        <form className="reset-card" onSubmit={handleSubmit}>
          <h2 className="reset-title">Reset Password</h2>
          <p className="reset-description">
            Enter your new password below.
          </p>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          {/* New Password */}
          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={`reset-input ${errors.password ? "input-error" : ""}`}
                placeholder="New Password"
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
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li className={formData.password.length >= 8 ? "valid" : ""}>
                  At least 8 characters
                </li>
                <li className={/[A-Z]/.test(formData.password) ? "valid" : ""}>
                  One uppercase letter
                </li>
                <li className={/[a-z]/.test(formData.password) ? "valid" : ""}>
                  One lowercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? "valid" : ""}>
                  One number
                </li>
                <li
                  className={
                    /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
                      ? "valid"
                      : ""
                  }
                >
                  One special character
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                className={`reset-input ${errors.confirmPassword ? "input-error" : ""}`}
                placeholder="Confirm New Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                className="show-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-text">{errors.confirmPassword}</span>
            )}
          </div>

          <button
            className="reset-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>

          <Link to="/login" className="back-link">
            ← Back to Login
          </Link>
        </form>
      </div>
      <Footer />
    </div>
  );
}
