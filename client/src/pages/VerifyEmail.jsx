import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./VerifyEmail.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerificationEmail } = useAuth();

  const [status, setStatus] = useState("verifying"); // verifying, success, error, expired
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        const result = await verifyEmail(token);

        if (result.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
          toast.success("Email verified successfully!");
        } else {
          // Check if token is expired
          if (result.error?.includes("expired")) {
            setStatus("expired");
            setMessage("This verification link has expired.");
          } else {
            setStatus("error");
            setMessage(result.error || "Email verification failed.");
          }
        }
      } catch (error) {
        setStatus("error");
        setMessage("An unexpected error occurred during verification.");
      }
    };

    verify();
  }, [token, verifyEmail]);

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast.success("Verification email sent!");
      } else {
        toast.error(result.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("Failed to send verification email");
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <div className="verify-card">
            <div className="verify-spinner"></div>
            <h2 className="verify-title">Verifying Your Email</h2>
            <p className="verify-message">Please wait while we verify your email address...</p>
          </div>
        );

      case "success":
        return (
          <div className="verify-card success">
            <div className="verify-icon">✓</div>
            <h2 className="verify-title">Email Verified!</h2>
            <p className="verify-message">{message}</p>
            <p className="verify-submessage">
              You can now log in to your account and start using all features.
            </p>
            <button
              className="verify-btn"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </div>
        );

      case "expired":
        return (
          <div className="verify-card expired">
            <div className="verify-icon">⏰</div>
            <h2 className="verify-title">Link Expired</h2>
            <p className="verify-message">{message}</p>
            <p className="verify-submessage">
              Enter your email below to receive a new verification link.
            </p>
            <div className="resend-form">
              <input
                type="email"
                className="verify-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="verify-btn"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
          </div>
        );

      case "error":
      default:
        return (
          <div className="verify-card error">
            <div className="verify-icon">✕</div>
            <h2 className="verify-title">Verification Failed</h2>
            <p className="verify-message">{message}</p>
            <p className="verify-submessage">
              If you're having trouble, try requesting a new verification email.
            </p>
            <div className="resend-form">
              <input
                type="email"
                className="verify-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="verify-btn"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
            <Link to="/login" className="back-link">
              Back to Login
            </Link>
          </div>
        );
    }
  };

  return (
    <div className="verify-page">
      <Navbar />
      <div className="verify-container">
        {renderContent()}
      </div>
      <Footer />
    </div>
  );
}
