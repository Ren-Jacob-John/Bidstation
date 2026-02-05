// ---------------------------------------------------------------------------
// client/src/components/Navbar.jsx
// ---------------------------------------------------------------------------
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
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
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🏏</span>
          <span className="logo-text">BidStation</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-menu">
          {isAuthenticated ? (
            <>
              {/* Authenticated Menu */}
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>

              {/* Auctioneer-only links */}
              {user?.role === 'auctioneer' && (
                <>
                  <Link to="/auction/create" className="nav-link">
                    Create Auction
                  </Link>
                  <Link to="/my-auctions" className="nav-link">
                    My Auctions
                  </Link>
                </>
              )}

              {/* Bidder-only links */}
              {user?.role === 'bidder' && (
                <Link to="/my-bids" className="nav-link">
                  My Bids
                </Link>
              )}

              {/* Common links */}
              <Link to="/auctions" className="nav-link">
                Browse Auctions
              </Link>

              {/* User Menu */}
              <div className="navbar-user">
                <Link to="/profile" className="nav-link user-info">
                  <span className="user-icon">👤</span>
                  <span className="username">{user?.username || 'User'}</span>
                  {!user?.emailVerified && (
                    <span className="unverified-badge" title="Email not verified">
                      ⚠️
                    </span>
                  )}
                </Link>
                <button onClick={handleLogout} className="btn btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Public Menu */}
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/auctions" className="nav-link">
                Auctions
              </Link>
              <Link to="/login" className="btn btn-outline">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
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