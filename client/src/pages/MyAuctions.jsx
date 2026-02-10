import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MyAuctions.css';

const MyAuctions = () => {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalAuctions: 0,
    liveAuctions: 0,
    completedAuctions: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchMyAuctions();
  }, []);

  const fetchMyAuctions = async () => {
    try {
      const response = await api.get('/auction/my-auctions');
      const auctionsData = response.data;
      setAuctions(auctionsData);

      // Calculate stats
      const liveAuctions = auctionsData.filter(a => a.status === 'live').length;
      const completedAuctions = auctionsData.filter(a => a.status === 'completed').length;
      
      // Calculate total revenue from sold items
      const totalRevenue = auctionsData.reduce((sum, auction) => {
        return sum + parseFloat(auction.total_revenue || 0);
      }, 0);

      setStats({
        totalAuctions: auctionsData.length,
        liveAuctions,
        completedAuctions,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAuctions = () => {
    switch (filter) {
      case 'live':
        return auctions.filter(auction => auction.status === 'live');
      case 'pending':
        return auctions.filter(auction => auction.status === 'pending');
      case 'completed':
        return auctions.filter(auction => auction.status === 'completed');
      default:
        return auctions;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      live: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-error'
    };
    return badges[status] || 'badge-secondary';
  };

  const filteredAuctions = getFilteredAuctions();

  if (loading) {
    return (
      <div className="my-auctions-page">
        <div className="container">
          <div className="loading">Loading your auctions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-auctions-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>My Auctions</h1>
            <p>Manage all your created auctions</p>
          </div>
          <Link to="/create-auction" className="btn btn-primary">
            ➕ Create New Auction
          </Link>
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

          <div className="stat-card card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>{stats.completedAuctions}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalRevenue)}</h3>
              <p>Total Revenue</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section card">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Auctions
            </button>
            <button
              className={`filter-tab ${filter === 'live' ? 'active' : ''}`}
              onClick={() => setFilter('live')}
            >
              🔴 Live
            </button>
            <button
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              ⏳ Pending
            </button>
            <button
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              ✓ Completed
            </button>
          </div>
        </div>

        {/* Auctions List */}
        {filteredAuctions.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No auctions found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't created any auctions yet" 
                : `No ${filter} auctions`}
            </p>
            <Link to="/create-auction" className="btn btn-primary mt-2">
              Create Your First Auction
            </Link>
          </div>
        ) : (
          <div className="auctions-grid">
            {filteredAuctions.map(auction => (
              <div key={auction.id} className="auction-card card">
                <div className="auction-header">
                  <div className="header-badges">
                    <span className={`badge ${getStatusBadge(auction.status)}`}>
                      {auction.status}
                    </span>
                    <span className="auction-type">
                      {auction.auction_type === 'sports_player' ? '⚽ Sports' : '🛍️ Item'}
                    </span>
                  </div>
                </div>

                <h3>{auction.title}</h3>
                <p className="auction-description">{auction.description}</p>

                <div className="auction-stats">
                  <div className="stat-item">
                    <span className="stat-label">Items</span>
                    <span className="stat-value">{auction.item_count || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Bids</span>
                    <span className="stat-value">{auction.bid_count || 0}</span>
                  </div>
                  {auction.total_revenue > 0 && (
                    <div className="stat-item">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value highlight">
                        {formatCurrency(auction.total_revenue)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="auction-meta">
                  <div className="meta-row">
                    <span className="meta-label">Starts</span>
                    <span className="meta-value">{formatDate(auction.start_time)}</span>
                  </div>
                  {auction.end_time && (
                    <div className="meta-row">
                      <span className="meta-label">Ends</span>
                      <span className="meta-value">{formatDate(auction.end_time)}</span>
                    </div>
                  )}
                </div>

                <div className="auction-actions">
                  <Link 
                    to={`/auction/${auction.id}`} 
                    className="btn"
                  >
                    View Details
                  </Link>
                  {auction.status === 'live' && (
                    <Link 
                      to={`/auction/${auction.id}/live`} 
                      className="btn btn-success"
                    >
                      📺 Manage Live
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAuctions;
