import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home-page">
      <div className="container">
        <section className="hero">
          <h1>Welcome to BidStation</h1>
          <p className="hero-subtitle">
            Your Ultimate Platform for IPL Player Bidding & Item Auctions
          </p>
          
          <div className="hero-features">
            <div className="feature-card card">
              <span className="feature-icon">🏏</span>
              <h3>IPL Player Bidding</h3>
              <p>Create and participate in exciting IPL-style player auctions</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">🛍️</span>
              <h3>Item Auctions</h3>
              <p>Bid on various items in real-time competitive auctions</p>
            </div>
            
            <div className="feature-card card">
              <span className="feature-icon">⚡</span>
              <h3>Real-time Bidding</h3>
              <p>Experience live bidding with instant updates</p>
            </div>
          </div>

          <div className="cta-buttons">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-large">
                  Go to Dashboard
                </Link>
                <Link to="/auctions" className="btn btn-large">
                  Browse Auctions
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-large">
                  Login
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="how-it-works mt-4">
          <h2 className="text-center mb-3">How It Works</h2>
          <div className="steps grid grid-cols-3 gap-3">
            <div className="step card">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Sign up as a bidder or auctioneer</p>
            </div>
            
            <div className="step card">
              <div className="step-number">2</div>
              <h3>Join or Create Auction</h3>
              <p>Browse existing auctions or create your own</p>
            </div>
            
            <div className="step card">
              <div className="step-number">3</div>
              <h3>Start Bidding</h3>
              <p>Place bids and win players or items</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
