// ---------------------------------------------------------------------------
// client/src/App.jsx   (Firebase version)
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './App.css';

// ── pages ──────────────────────────────────────────────────────────────────
import Home             from './pages/Home';
import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import CreateAuction    from './pages/CreateAuction';
import LiveAuction      from './pages/LiveAuction';
import AuctionDetails   from './pages/AuctionDetails';
import AuctionList      from './pages/AuctionList';
import MyBids           from './pages/MyBids';
import MyAuctions       from './pages/MyAuctions';
import Profile          from './pages/Profile';
import VerifyEmail      from './pages/VerifyEmail';
import ForgotPassword   from './pages/ForgotPassword';
import ResetPassword    from './pages/ResetPassword';
import Admin            from './pages/Admin';
import JoinWithCode     from './pages/JoinWithCode';

// ── shared ─────────────────────────────────────────────────────────────────
import Navbar           from './components/Navbar';
import Footer           from './components/Footer';
import MouseEntryEffect from './components/MouseEntryEffect';

// ---------------------------------------------------------------------------
// Firebase email-action router
// ---------------------------------------------------------------------------
// Firebase's verification & password-reset emails point the user to a single
// URL by default (often <yourapp>.firebaseapp.com/__/auth/action?…).
// We configure that URL to be  /auth/action  on OUR domain.
// This tiny component reads the query-string and redirects to the real page.
// ---------------------------------------------------------------------------
const FirebaseActionRouter = () => {
  const [params] = useSearchParams();
  const mode     = params.get('mode');

  if (mode === 'verifyEmail') {
    // Forward ALL query params so oobCode arrives intact
    return <Navigate to={`/verify-email?${params.toString()}`} replace />;
  }
  if (mode === 'resetPassword') {
    return <Navigate to={`/reset-password?${params.toString()}`} replace />;
  }
  // Unknown mode – go home
  return <Navigate to="/" replace />;
};

// ---------------------------------------------------------------------------
// Route guards
// ---------------------------------------------------------------------------
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading)  {
    return (
      <div className="loading-page">
        <div className="app-loading-screen-inline">
          <div className="app-loading-card">
            <div className="app-loading-icon">
              <div className="hammer-orbit">
                <div className="hammer-head" />
                <div className="hammer-handle" />
              </div>
            </div>
            <div className="app-loading-text">
              <h1>Loading BidStation…</h1>
              <p>Checking your session and auctions.</p>
            </div>
            <div className="app-loading-progress">
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
              <div className="progress-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user)    return <Navigate to="/login" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-page">
        <div className="app-loading-screen-inline">
          <div className="app-loading-card">
            <div className="app-loading-icon">
              <div className="hammer-orbit">
                <div className="hammer-head" />
                <div className="hammer-handle" />
              </div>
            </div>
            <div className="app-loading-text">
              <h1>Loading BidStation…</h1>
              <p>Preparing a smooth sign-in experience.</p>
            </div>
            <div className="app-loading-progress">
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
              <div className="progress-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (user)    return <Navigate to="/dashboard" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) {
    return (
      <div className="loading-page">
        <div className="app-loading-screen-inline">
          <div className="app-loading-card">
            <div className="app-loading-icon">
              <div className="hammer-orbit">
                <div className="hammer-head" />
                <div className="hammer-handle" />
              </div>
            </div>
            <div className="app-loading-text">
              <h1>Loading BidStation…</h1>
              <p>Verifying your admin access.</p>
            </div>
            <div className="app-loading-progress">
              <div className="progress-track">
                <div className="progress-fill" />
              </div>
              <div className="progress-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!user)   return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// ---------------------------------------------------------------------------
const App = () => {
  const [showIntroLoader, setShowIntroLoader] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setShowIntroLoader(false), 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="App">
      {/* Global intro loading screen */}
      <div
        className={`intro-loader ${showIntroLoader ? 'intro-loader--visible' : 'intro-loader--hidden'}`}
        aria-hidden={!showIntroLoader}
      >
        <div className="intro-loader-inner app-loading-card">
          <div className="intro-bg-nodes">
            <span className="intro-node intro-node-1" />
            <span className="intro-node intro-node-2" />
            <span className="intro-node intro-node-3" />
          </div>
          <div className="app-loading-icon">
            <div className="hammer-orbit">
              <div className="hammer-head" />
              <div className="hammer-handle" />
            </div>
          </div>
          <div className="app-loading-text">
            <h1>Loading BidStation…</h1>
            <p>Connecting to your auctions and bids.</p>
          </div>
          <div className="app-loading-progress">
            <div className="progress-track">
              <div className="progress-fill" />
            </div>
            <div className="progress-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>

      <div className="site-background" aria-hidden="true">
        <span className="bg-orb" />
        <span className="bg-orb" />
        <span className="bg-orb" />
      </div>

      {/* Cursor entrance animation */}
      <MouseEntryEffect />

      <Navbar />
      <main className="main-content">
        <Routes>
          {/* public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Firebase email action */}
          <Route path="/auth/action" element={<FirebaseActionRouter />} />

          {/* email verify / reset */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* public: browse & view auctions without signing up */}
          <Route path="/auctions" element={<AuctionList />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/join" element={<ProtectedRoute><JoinWithCode /></ProtectedRoute>} />

          {/* protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/auction/create" element={<ProtectedRoute><CreateAuction /></ProtectedRoute>} />
          <Route path="/auction/live/:id" element={<ProtectedRoute><LiveAuction /></ProtectedRoute>} />
          <Route path="/my-bids" element={<ProtectedRoute><MyBids /></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MyAuctions /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* admin */}
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;

