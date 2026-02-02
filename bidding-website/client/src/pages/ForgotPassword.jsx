import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="container">
        <div className="forgot-password-container card">
          {!success ? (
            <>
              <div className="forgot-password-header">
                <div className="icon-wrapper">
                  <span className="icon">🔒</span>
                </div>
                <h1>Forgot Password?</h1>
                <p className="subtitle">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="back-to-login">
                <Link to="/login" className="link">
                  ← Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="success-message">
              <div className="icon-wrapper">
                <span className="icon success-icon">📧</span>
              </div>
              <h2>Check Your Email</h2>
              <p>
                If an account exists with <strong>{email}</strong>, we've sent password reset instructions.
              </p>
              <div className="info-box">
                <h3>What's next?</h3>
                <ol>
                  <li>Check your email inbox</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                  <li>Login with your new password</li>
                </ol>
                <p className="note">
                  <strong>Note:</strong> The reset link expires in 1 hour.
                  Didn't receive it? Check your spam folder.
                </p>
              </div>
              <div className="actions">
                <button 
                  onClick={() => setSuccess(false)} 
                  className="btn btn-outline"
                >
                  Send Another Email
                </button>
                <Link to="/login" className="btn btn-primary">
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
