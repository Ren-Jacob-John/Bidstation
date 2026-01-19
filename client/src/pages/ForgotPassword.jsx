import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { validateEmail } from "../services/authService";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        setEmailSent(true);
        toast.success("Password reset email sent!");
      } else {
        toast.error(result.error || "Failed to send reset email");
        setError(result.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after email sent
  if (emailSent) {
    return (
      <div className="forgot-page">
        <Navbar />
        <div className="forgot-container">
          <div className="forgot-card success">
            <div className="forgot-icon">✉️</div>
            <h2 className="forgot-title">Check Your Email</h2>
            <p className="forgot-message">
              We've sent a password reset link to:
            </p>
            <p className="forgot-email">{email}</p>
            <p className="forgot-instructions">
              Click the link in the email to reset your password. The link will
              expire in 1 hour.
            </p>
            <div className="forgot-actions">
              <button
                className="forgot-btn secondary"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
              >
                Try Different Email
              </button>
              <Link to="/login" className="back-link">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="forgot-page">
      <Navbar />

      <div className="forgot-container">
        <form className="forgot-card" onSubmit={handleSubmit}>
          <h2 className="forgot-title">Forgot Password?</h2>
          <p className="forgot-description">
            No worries! Enter your email address and we'll send you a link to
            reset your password.
          </p>

          {error && <div className="error-banner">{error}</div>}

          <div className="input-group">
            <input
              type="email"
              className={`forgot-input ${error ? "input-error" : ""}`}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              disabled={isLoading}
            />
          </div>

          <button
            className="forgot-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
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
