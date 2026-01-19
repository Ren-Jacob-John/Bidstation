import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { validateEmail, validatePassword } from "../services/authService";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

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

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

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
      const result = await register(
        formData.fullName,
        formData.email,
        formData.password
      );

      if (result.success) {
        setRegistrationSuccess(true);
        setRegisteredEmail(formData.email);
        toast.success("Registration successful! Please check your email.");
      } else {
        toast.error(result.error || "Registration failed");
        setErrors({ submit: result.error });
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setErrors({ submit: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after registration
  if (registrationSuccess) {
    return (
      <div className="register-page">
        <Navbar />
        <div className="register-container">
          <div className="register-form success-card">
            <div className="success-icon">✉️</div>
            <h2 className="register-title">Check Your Email</h2>
            <p className="success-message">
              We've sent a verification link to:
            </p>
            <p className="success-email">{registeredEmail}</p>
            <p className="success-instructions">
              Please click the link in the email to verify your account and
              complete registration.
            </p>
            <div className="success-actions">
              <button
                className="register-btn secondary-btn"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
              <p className="resend-text">
                Didn't receive the email?{" "}
                <button
                  className="resend-link"
                  onClick={async () => {
                    try {
                      const { resendVerificationEmail } = await import(
                        "../services/authService"
                      );
                      await resendVerificationEmail(registeredEmail);
                      toast.success("Verification email resent!");
                    } catch (error) {
                      toast.error("Failed to resend email");
                    }
                  }}
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="register-page">
      <Navbar />

      <div className="register-container">
        <form className="register-form" onSubmit={handleSubmit}>
          <h2 className="register-title">Create Account</h2>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          {/* Full Name */}
          <div className="input-group">
            <input
              type="text"
              name="fullName"
              className={`register-input ${errors.fullName ? "input-error" : ""}`}
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.fullName && (
              <span className="error-text">{errors.fullName}</span>
            )}
          </div>

          {/* Email */}
          <div className="input-group">
            <input
              type="email"
              name="email"
              className={`register-input ${errors.email ? "input-error" : ""}`}
              placeholder="Email Address"
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
                className={`register-input ${errors.password ? "input-error" : ""}`}
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
                className={`register-input ${errors.confirmPassword ? "input-error" : ""}`}
                placeholder="Confirm Password"
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
            className="register-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="login-link">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
      <Footer />
    </div>
  );
}
