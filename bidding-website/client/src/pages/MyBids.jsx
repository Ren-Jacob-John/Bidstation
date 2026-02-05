import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bidService } from '../services/bidService';
import { formatCurrency } from '../services/helpers';
import './MyBids.css';

const MyBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalBids: 0,
    winningBids: 0,
    totalSpent: 0,
    activeAuctions: 0
  });

  useEffect(() => {
    fetchMyBids();
  }, []);

  const fetchMyBids = async () => {
    try {
      const bidsData = await bidService.getMyBids();
      setBids(bidsData);

      // Calculate stats
      const winningBids = bidsData.filter(bid => bid.status === 'active').length;
      const totalSpent = bidsData
        .filter(bid => bid.status === 'won')
        .reduce((sum, bid) => sum + (bid.amount || 0), 0);
      const activeAuctionIds = new Set(
        bidsData
          .filter(bid => bid.status === 'active')
          .map(bid => bid.auctionId)
      );

      setStats({
        totalBids: bidsData.length,
        winningBids,
        totalSpent,
        activeAuctions: activeAuctionIds.size
      });
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredBids = () => {
    switch (filter) {
      case 'active':
        return bids.filter(bid => bid.status === 'active');
      case 'outbid':
        return bids.filter(bid => bid.status === 'outbid');
      case 'won':
        return bids.filter(bid => bid.status === 'won');
      case 'lost':
        return bids.filter(bid => bid.status === 'lost');
      default:
        return bids;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-success',
      outbid: 'badge-warning',
      won: 'badge-success',
      lost: 'badge-secondary'
    };
    return badges[status] || 'badge-secondary';
  };

  const filteredBids = getFilteredBids();

  if (loading) {
    return (
      <div className="my-bids-page">
        <div className="container">
          <div className="loading">Loading your bids...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bids-page">
      <div className="container">
        <div className="page-header">
          <h1>My Bids</h1>
          <p>Track all your bidding activity</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{stats.totalBids}</h3>
              <p>Total Bids</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>{stats.winningBids}</h3>
              <p>Winning Bids</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>{formatCurrency(stats.totalSpent)}</h3>
              <p>Total Spent</p>
            </div>
          </div>

          <div className="stat-card card">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <h3>{stats.activeAuctions}</h3>
              <p>Active Auctions</p>
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
              All Bids
            </button>
            <button
              className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              🏆 Winning
            </button>
            <button
              className={`filter-tab ${filter === 'outbid' ? 'active' : ''}`}
              onClick={() => setFilter('outbid')}
            >
              ⏳ Outbid
            </button>
            <button
              className={`filter-tab ${filter === 'won' ? 'active' : ''}`}
              onClick={() => setFilter('won')}
            >
              ✓ Won
            </button>
            <button
              className={`filter-tab ${filter === 'lost' ? 'active' : ''}`}
              onClick={() => setFilter('lost')}
            >
              ✗ Lost
            </button>
          </div>
        </div>

        {/* Bids List */}
        {filteredBids.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No bids found</h3>
            <p>
              {filter === 'all' 
                ? "You haven't placed any bids yet" 
                : "No bids match this filter"}
            </p>
            <Link to="/auctions" className="btn btn-primary mt-2">
              Browse Auctions
            </Link>
          </div>
        ) : (
          <div className="bids-list">
            {filteredBids.map(bid => (
              <div key={bid.id} className="bid-card card">
                <div className="bid-header">
                  <div className="bid-title-section">
                    <h3>{bid.playerName}</h3>
                    <Link to={`/auction/${bid.auctionId}`} className="auction-link">
                      {bid.auctionTitle || 'Auction'}
                    </Link>
                  </div>
                  <div className="bid-badges">
                    <span className={`badge ${getStatusBadge(bid.status)}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>

                <div className="bid-details">
                  <div className="detail-row">
                    <span className="detail-label">Your Bid:</span>
                    <span className="detail-value highlight">
                      {formatCurrency(bid.amount)}
                    </span>
                  </div>

                  {bid.teamName && (
                    <div className="detail-row">
                      <span className="detail-label">Team:</span>
                      <span className="detail-value">{bid.teamName}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Bid Placed:</span>
                    <span className="detail-value">{formatDate(bid.timestamp)}</span>
                  </div>
                </div>

                <div className="bid-footer">
                  {bid.status === 'active' && (
                    <Link 
                      to={`/auction/live/${bid.auctionId}`} 
                      className="btn btn-primary"
                    >
                      View Live Auction
                    </Link>
                  )}
                  {bid.status !== 'active' && (
                    <Link 
                      to={`/auction/${bid.auctionId}`} 
                      className="btn"
                    >
                      View Auction
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

export default MyBids;
