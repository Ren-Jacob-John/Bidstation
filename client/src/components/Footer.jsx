// ---------------------------------------------------------------------------
// client/src/components/Footer.jsx
// ---------------------------------------------------------------------------
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-icon">🏏</span>
              <span className="footer-logo-text">BidStation</span>
            </Link>
            <p className="footer-tagline">
              The ultimate platform for sports player auctions and item bidding.
            </p>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Explore</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/auctions">Auctions</Link></li>
              <li><Link to="/join">Join with code</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4 className="footer-heading">Account</h4>
            <ul>
              <li><Link to="/dashboard">Dashboard</Link></li>
              <li><Link to="/my-bids">My Bids</Link></li>
              <li><Link to="/my-auctions">My Auctions</Link></li>
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} BidStation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
