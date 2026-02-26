// ---------------------------------------------------------------------------
// client/src/components/Navbar.jsx
// ---------------------------------------------------------------------------
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationPanel from './NotificationPanel';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link
          to="/"
          className="navbar-logo"
          title="Go to BidStation home"
        >
          <span className="logo-icon">🏏</span>
          <span className="logo-text">BidStation</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              {/* Authenticated Menu */}
              <Link
                to="/dashboard"
                className="nav-link"
                title="View your personalized dashboard"
              >
                Dashboard
              </Link>

              {/* Auctioneer-only links */}
              {user?.role === 'auctioneer' && (
                <>
                  <Link
                    to="/auction/create"
                    className="nav-link"
                    title="Create a new auction"
                  >
                    Create Auction
                  </Link>
                  <Link
                    to="/my-auctions"
                    className="nav-link"
                    title="View and manage auctions you created"
                  >
                    My Auctions
                  </Link>
                </>
              )}

              {/* Bidder-only links */}
              {user?.role === 'bidder' && (
                <Link
                  to="/my-bids"
                  className="nav-link"
                  title="View and track your bids"
                >
                  My Bids
                </Link>
              )}

              {/* Common links */}
              <Link
                to="/auctions"
                className="nav-link"
                title="Browse all available auctions"
              >
                Browse Auctions
              </Link>
              <Link
                to="/join"
                className="nav-link"
                title="Join an auction using a code"
              >
                Join with code
              </Link>

              {/* Admin link */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="nav-link nav-link-admin"
                  title="Open the admin panel"
                >
                  Admin
                </Link>
              )}

              {/* Notifications */}
              <NotificationPanel />

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>

              {/* User Menu */}
              <div className="navbar-user">
                <Link
                  to="/profile"
                  className="nav-link user-info"
                  title="View and edit your profile"
                >
                  <span className="user-icon">👤</span>
                  <span className="username">{user?.username || 'User'}</span>
                  {!user?.emailVerified && (
                    <span className="unverified-badge" title="Email not verified">
                      ⚠️
                    </span>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-logout"
                  title="Log out from your account"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Public Menu */}
              <Link
                to="/"
                className="nav-link"
                title="Go to BidStation home"
              >
                Home
              </Link>
              <Link
                to="/auctions"
                className="nav-link"
                title="Browse all available auctions"
              >
                Auctions
              </Link>

              {/* Notifications */}
              <NotificationPanel />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme} 
                className="theme-toggle-btn"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle theme"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
              
              <Link
                to="/login"
                className="btn btn-outline"
                title="Sign in to your BidStation account"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-primary"
                title="Create a new BidStation account"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
