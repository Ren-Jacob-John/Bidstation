// ---------------------------------------------------------------------------
// client/src/pages/ForgotPassword.jsx   (Firebase version)
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Link }     from 'react-router-dom';
import { forgotPassword } from '../services/authService';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(email);   // Firebase sends the email for us
      setSuccess(true);
    } catch (err) {
      // Firebase throws auth/user-not-found – we mask it for security
      if (err.code === 'auth/user-not-found') {
        setSuccess(true);            // pretend success → prevents enumeration
      } else {
        setError(err.message || 'Failed to send reset email.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
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

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit} className="forgot-password-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <div className="back-to-login">
                <Link to="/login" className="link">← Back to Login</Link>
              </div>
            </>
          ) : (
            /* ---- success screen ---- */
            <div className="success-message">
              <div className="icon-wrapper">
                <span className="icon success-icon">📧</span>
              </div>
              <h2>Check Your Email</h2>
              <p>
                If an account exists with <strong>{email}</strong>, we've sent
                password-reset instructions.
              </p>

              <div className="info-box">
                <h3>What's next?</h3>
                <ol>
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the <strong>"Reset Password"</strong> link in the email</li>
                  <li>Enter your new password on the page that opens</li>
                  <li>Log in with your new password</li>
                </ol>
                <p className="note">
                  <strong>Note:</strong> The reset link expires in <strong>1 hour</strong>.
                </p>
              </div>

              <div className="actions">
                <button onClick={() => { setSuccess(false); setEmail(''); }} className="btn btn-outline">
                  Send Another Email
                </button>
                <Link to="/login" className="btn btn-primary">Back to Login</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
