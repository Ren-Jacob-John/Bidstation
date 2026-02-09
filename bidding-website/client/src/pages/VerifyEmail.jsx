import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resending, setResending] = useState(false);
  
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Check if token is in URL
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      verifyEmailWithToken(tokenFromUrl);
    }
  }, [searchParams]);

  const verifyEmailWithToken = async (token) => {
    setLoading(true);
    setError('');

    try {
      await authService.verifyEmail(token);
      setSuccess('Email verified successfully! Redirecting...');
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    await verifyEmailWithToken(verificationCode);
  };

  const handleResendEmail = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      await authService.resendVerification();
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="container">
        <div className="verify-email-container card">
          <div className="verify-email-header">
            <div className="icon-wrapper">
              {success ? (
                <span className="icon success-icon">✓</span>
              ) : (
                <span className="icon email-icon">📧</span>
              )}
            </div>
            <h1>Verify Your Email</h1>
            {user && !user.email_verified && (
              <p className="subtitle">
                We sent a verification email to <strong>{user.email}</strong>
              </p>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Verifying your email...</p>
            </div>
          ) : !success && (
            <>
              <form onSubmit={handleSubmit} className="verify-form">
                <div className="form-group">
                  <label htmlFor="code">Enter Verification Code</label>
                  <input
                    type="text"
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the code from your email"
                    className="code-input"
                  />
                  <p className="helper-text">
                    Enter the verification code from the email we sent you
                  </p>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading || !verificationCode.trim()}
                >
                  Verify Email
                </button>
              </form>

              <div className="divider">
                <span>OR</span>
              </div>

              <div className="resend-section">
                <p>Didn't receive the email?</p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="btn btn-outline"
                  disabled={resending}
                >
                  {resending ? 'Sending...' : 'Resend Verification Email'}
                </button>
              </div>

              <div className="info-box">
                <h3>📋 Instructions:</h3>
                <ol>
                  <li>Check your email inbox for a verification email</li>
                  <li>Click the verification link in the email</li>
                  <li>Or copy the code and paste it above</li>
                  <li>If you don't see it, check your spam folder</li>
                </ol>
              </div>
            </>
          )}

          {success && (
            <div className="success-state">
              <p>✓ Your email has been verified successfully!</p>
              <p>You now have full access to all features.</p>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn btn-primary"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
