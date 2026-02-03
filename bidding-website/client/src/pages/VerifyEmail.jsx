// ---------------------------------------------------------------------------
// client/src/pages/VerifyEmail.jsx   (Firebase version)
// ---------------------------------------------------------------------------
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyEmail, resendVerification } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams]          = useSearchParams();
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState('');
  const [success,   setSuccess] = useState('');
  const [resending, setResending] = useState(false);

  const navigate     = useNavigate();
  const { user, refreshUser } = useAuth();

  // -----------------------------------------------------------------------
  // If Firebase redirected us back with ?mode=verifyEmail&oobCode=…
  // auto-apply the code on mount.
  // -----------------------------------------------------------------------
  useEffect(() => {
    const mode    = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      applyCode(oobCode);
    }
  }, [searchParams]);          // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------------------------------------
  const applyCode = async (code) => {
    setLoading(true);
    setError('');

    try {
      await verifyEmail(code);                   // applies code + syncs Firestore
      await refreshUser();                       // refresh context so UI updates
      setSuccess('Email verified successfully! Redirecting…');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(
        err.code === 'auth/invalid-action-code'
          ? 'The verification link is invalid or has already been used.'
          : err.code === 'auth/expired-action-code'
            ? 'The verification link has expired. Please request a new one.'
            : err.message || 'Failed to verify email.'
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Manual code entry is NOT possible with Firebase's default flow –
  // verification must go through the link.  We hide the manual input
  // and guide the user to check their inbox / resend.
  // -----------------------------------------------------------------------

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await resendVerification();
      setSuccess('Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------
  return (
    <div className="verify-email-page">
      <div className="container">
        <div className="verify-email-container card">
          {/* ---- HEADER ---- */}
          <div className="verify-email-header">
            <div className="icon-wrapper">
              <span className="icon">{success ? '✓' : '📧'}</span>
            </div>
            <h1>Verify Your Email</h1>
            {user && !user.emailVerified && (
              <p className="subtitle">
                We sent a verification email to <strong>{user.email}</strong>
              </p>
            )}
          </div>

          {/* ---- ALERTS ---- */}
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* ---- LOADING SPINNER ---- */}
          {loading && (
            <div className="loading-state">
              <div className="spinner" />
              <p>Verifying your email…</p>
            </div>
          )}

          {/* ---- SUCCESS STATE ---- */}
          {!loading && success && (
            <div className="success-state">
              <p>✓ Your email has been verified successfully!</p>
              <p>You now have full access to all features.</p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Go to Dashboard
              </button>
            </div>
          )}

          {/* ---- WAITING STATE (no oobCode yet / resend) ---- */}
          {!loading && !success && (
            <>
              <div className="info-box">
                <h3>📋 What to do:</h3>
                <ol>
                  <li>Check your email inbox for a message from BidStation</li>
                  <li>Click the <strong>"Verify Email Address"</strong> button inside that email</li>
                  <li>You will be brought back here automatically</li>
                  <li>If you don't see the email, check your spam folder</li>
                </ol>
              </div>

              <div className="resend-section">
                <p>Didn't receive the email?</p>
                <button
                  type="button"
                  onClick={handleResend}
                  className="btn btn-outline"
                  disabled={resending}
                >
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;