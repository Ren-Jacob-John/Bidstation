import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, newPassword);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="container">
        <div className="reset-password-container card">
          {!success ? (
            <>
              <div className="reset-password-header">
                <div className="icon-wrapper">
                  <span className="icon">🔐</span>
                </div>
                <h1>Reset Password</h1>
                <p className="subtitle">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="reset-password-form">
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                  <p className="helper-text">
                    Must be at least 6 characters
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-block"
                  disabled={loading || !token}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div className="password-requirements">
                <h3>Password Requirements:</h3>
                <ul>
                  <li className={newPassword.length >= 6 ? 'valid' : ''}>
                    At least 6 characters
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'valid' : ''}>
                    Passwords match
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="success-message">
              <div className="icon-wrapper">
                <span className="icon success-icon">✓</span>
              </div>
              <h2>Password Reset Successful!</h2>
              <p>
                Your password has been changed successfully.
              </p>
              <div className="success-box">
                <p>✓ Password updated</p>
                <p>✓ Confirmation email sent</p>
                <p>✓ Redirecting to login...</p>
              </div>
              <button 
                onClick={() => navigate('/login')} 
                className="btn btn-primary"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
