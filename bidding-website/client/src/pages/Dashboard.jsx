import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../services/auctionService';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAuctions: 0,
    liveAuctions: 0,
    myAuctions: 0,
    myBids: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const auctionsData = await auctionService.getAllAuctions();
      setAuctions(auctionsData);
      
      // Calculate stats
      const myAuctions = auctionsData.filter(a => a.creator_id === user.id);
      const liveAuctions = auctionsData.filter(a => a.status === 'live');
      
      setStats({
        totalAuctions: auctionsData.length,
        liveAuctions: liveAuctions.length,
        myAuctions: myAuctions.length,
        myBids: 0 // TODO: Fetch from API
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      live: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-error'
    };
    return badges[status] || 'badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.username}! 👋</h1>
          <p className="dashboard-subtitle">
            Role: <span className="role-badge">{user?.role}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalAuctions}</h3>
              <p>Total Auctions</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <h3>{stats.liveAuctions}</h3>
              <p>Live Auctions</p>
            </div>
          </div>

          {user?.role === 'auctioneer' && (
            <div className="stat-card card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>{stats.myAuctions}</h3>
                <p>My Auctions</p>
              </div>
            </div>
          )}

          {user?.role === 'bidder' && (
            <div className="stat-card card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{stats.myBids}</h3>
                <p>My Bids</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions mt-4">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            {user?.role === 'auctioneer' && (
              <Link to="/create-auction" className="action-card card">
                <span className="action-icon">➕</span>
                <h3>Create Auction</h3>
                <p>Start a new IPL or Item auction</p>
              </Link>
            )}
            
            <Link to="/auctions" className="action-card card">
              <span className="action-icon">🔍</span>
              <h3>Browse Auctions</h3>
              <p>View all available auctions</p>
            </Link>

            {user?.role === 'bidder' && (
              <Link to="/my-bids" className="action-card card">
                <span className="action-icon">📋</span>
                <h3>My Bids</h3>
                <p>Track your bidding activity</p>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Auctions */}
        <div className="recent-auctions mt-4">
          <div className="section-header">
            <h2>Recent Auctions</h2>
            <Link to="/auctions" className="btn">View All</Link>
          </div>
          
          {auctions.length === 0 ? (
            <div className="empty-state card">
              <p>No auctions available yet</p>
              {user?.role === 'auctioneer' && (
                <Link to="/create-auction" className="btn btn-primary mt-2">
                  Create Your First Auction
                </Link>
              )}
            </div>
          ) : (
            <div className="auctions-grid">
              {auctions.slice(0, 6).map(auction => (
                <Link 
                  to={`/auction/${auction.id}`} 
                  key={auction.id}
                  className="auction-card card"
                >
                  <div className="auction-header">
                    <span className={`badge ${getStatusBadge(auction.status)}`}>
                      {auction.status}
                    </span>
                    <span className="auction-type">
                      {auction.auction_type === 'sports_player' ? '⚽ Sports' : '🛍️ Item'}
                    </span>
                  </div>
                  
                  <h3>{auction.title}</h3>
                  <p className="auction-description">{auction.description}</p>
                  
                  <div className="auction-meta">
                    <div className="meta-item">
                      <span className="meta-label">Created by</span>
                      <span className="meta-value">{auction.creator_name}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Start Time</span>
                      <span className="meta-value">{formatDate(auction.start_time)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
