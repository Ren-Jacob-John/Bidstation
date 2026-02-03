// ---------------------------------------------------------------------------
// client/src/pages/ResetPassword.jsx   (Firebase version)
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const [searchParams]            = useSearchParams();
  const [newPassword,  setNewPw]  = useState('');
  const [confirmPw,    setConfPw] = useState('');
  const [loading,      setLoading] = useState(false);
  const [error,        setError]  = useState('');
  const [success,      setSuccess] = useState(false);
  const [oobCode,      setOobCode] = useState(null);
  const [validCode,    setValidCode] = useState(true);

  // -----------------------------------------------------------------------
  // Extract oobCode from URL on mount
  // Firebase password-reset links look like:
  //   https://yourapp.com/reset-password?mode=resetPassword&oobCode=XXXX
  // -----------------------------------------------------------------------
  useEffect(() => {
    const code = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    if (mode === 'resetPassword' && code) {
      setOobCode(code);
    } else {
      setValidCode(false);
    }
  }, [searchParams]);

  // -----------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (newPassword !== confirmPw) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      await resetPassword(oobCode, newPassword);
      setSuccess(true);
    } catch (err) {
      if (err.code === 'auth/invalid-action-code') {
        setError('The reset link is invalid or has already been used.');
      } else if (err.code === 'auth/expired-action-code') {
        setError('The reset link has expired. Please request a new one.');
      } else if (err.code === 'auth/weak-password') {
        setError('The new password is too weak. Please choose a stronger password.');
      } else {
        setError(err.message || 'Failed to reset password.');
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // password-requirement helpers
  // -----------------------------------------------------------------------
  const minLength = newPassword.length >= 6;
  const pwMatch   = newPassword && newPassword === confirmPw;

  // -----------------------------------------------------------------------
  // RENDER ── invalid / missing code
  // -----------------------------------------------------------------------
  if (!validCode) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <div className="reset-password-container card">
            <div className="reset-password-header">
              <div className="icon-wrapper"><span className="icon">⚠️</span></div>
              <h1>Invalid Link</h1>
              <p className="subtitle">
                This password-reset link is invalid or has already been used.
              </p>
            </div>
            <Link to="/forgot-password" className="btn btn-primary btn-block">
              Request a New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // RENDER ── success
  // -----------------------------------------------------------------------
  if (success) {
    return (
      <div className="reset-password-page">
        <div className="container">
          <div className="reset-password-container card">
            <div className="success-state">
              <div className="icon-wrapper"><span className="icon success-icon">✓</span></div>
              <h2>Password Reset Successfully!</h2>
              <div className="info-box">
                <h3>What's next?</h3>
                <ol>
                  <li>Your password has been updated</li>
                  <li>You can now log in with your new password</li>
                  <li>If you didn't request this, contact support</li>
                </ol>
              </div>
              <Link to="/login" className="btn btn-primary btn-block">Go to Login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // RENDER ── main form
  // -----------------------------------------------------------------------
  return (
    <div className="reset-password-page">
      <div className="container">
        <div className="reset-password-container card">
          <div className="reset-password-header">
            <div className="icon-wrapper"><span className="icon">🔑</span></div>
            <h1>Reset Your Password</h1>
            <p className="subtitle">Enter your new password below.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="reset-password-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPw}
                onChange={(e) => setConfPw(e.target.value)}
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
            </div>

            {/* live requirement checks */}
            <div className="password-requirements">
              <div className={`requirement ${minLength ? 'met' : ''}`}>
                <span className="check">{minLength ? '✓' : '○'}</span>
                At least 6 characters
              </div>
              <div className={`requirement ${pwMatch ? 'met' : ''}`}>
                <span className="check">{pwMatch ? '✓' : '○'}</span>
                Passwords match
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;