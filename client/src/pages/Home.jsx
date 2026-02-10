import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Welcome to BidStation</h1>
          <p className="hero-subtitle">
            The ultimate platform for sports player auctions and item bidding
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-lg">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Features</h2>
          <div className="features-grid">
            <div className="feature-card card">
              <span className="feature-icon">⚽</span>
              <h3>Sports Player Auctions</h3>
              <p>Create player auctions for Cricket, Football, Basketball, Tennis, and more sports tournaments</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">🛍️</span>
              <h3>Item Auctions</h3>
              <p>Auction various items with competitive bidding and real-time updates</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">🔴</span>
              <h3>Live Bidding</h3>
              <p>Experience real-time auctions with instant bid updates and notifications</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">🏆</span>
              <h3>Team Management</h3>
              <p>Manage multiple teams or franchises and build your dream squad</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">📊</span>
              <h3>Analytics</h3>
              <p>Track your bidding history, spending, and auction performance</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">🔒</span>
              <h3>Secure Platform</h3>
              <p>Role-based access control and secure transactions for all users</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to start bidding?</h2>
          <p>Join thousands of users in exciting sports player auctions</p>
          {!user && (
            <Link to="/register" className="btn btn-primary btn-lg">
              Create Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
