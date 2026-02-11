import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg-decoration">
          <div className="hero-blob hero-blob-1"></div>
          <div className="hero-blob hero-blob-2"></div>
          <div className="hero-blob hero-blob-3"></div>
        </div>

        <div className="container">
          <div className="hero-content">
            

            <h1 className="hero-title">
              Welcome to <span className="gradient-text-red">BidStation</span>
            </h1>

            <p className="hero-subtitle">
              The ultimate platform for sports player auctions and item bidding.
              Join thousands of users in exciting real-time auctions.
            </p>

            <div className="hero-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <span className="btn-icon">📊</span>
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    <span className="btn-icon">🚀</span>
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    <span className="btn-icon">🔐</span>
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose BidStation?</h2>
            <p className="section-subtitle">
              Everything you need for seamless sports auctions
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">⚽</span>
              </div>
              <h3>Sports Player Auctions</h3>
              <p>
                Create player auctions for Cricket, Football, Basketball, Tennis,
                and more sports tournaments
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🛡️</span>
              </div>
              <h3>Item Auctions</h3>
              <p>
                Auction various items with competitive bidding and real-time
                updates
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">⚡</span>
              </div>
              <h3>Live Bidding</h3>
              <p>
                Experience real-time auctions with instant bid updates and
                notifications
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🏆</span>
              </div>
              <h3>Team Management</h3>
              <p>
                Manage multiple teams or franchises and build your dream squad
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">📈</span>
              </div>
              <h3>Analytics</h3>
              <p>
                Track your bidding history, spending, and auction performance
              </p>
              <div className="feature-decoration"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🔒</span>
              </div>
              <h3>Secure Platform</h3>
              <p>
                Role-based access control and secure transactions for all users
              </p>
              <div className="feature-decoration"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-bg-decoration">
          <div className="cta-circle cta-circle-1"></div>
          <div className="cta-circle cta-circle-2"></div>
        </div>

        <div className="container">
          <div className="cta-content">
            <span className="cta-badge">Get Started Today</span>
            <h2>Ready to Start Bidding?</h2>
            <p>
              Join thousands of users in exciting sports player auctions. Create
              your free account now and start bidding!
            </p>
            {!user && (
              <Link to="/register" className="btn btn-light btn-lg">
                Create Free Account
                <span className="btn-arrow">→</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
