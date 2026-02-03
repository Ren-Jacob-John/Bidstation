import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../services/auctionService';
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
    if (user?.id) {
      fetchMyBids();
    }
  }, [user?.id]);

  const fetchMyBids = async () => {
    if (!user?.id) return;
    
    try {
      const bidsData = await auctionService.getUserBids(user.id);
      setBids(bidsData);

      // Calculate stats
      const winningBids = bidsData.filter(bid => bid.isWinning).length;
      const totalSpent = bidsData
        .filter(bid => bid.itemStatus === 'sold' && bid.isWinning)
        .reduce((sum, bid) => sum + parseFloat(bid.bidAmount || 0), 0);
      
      // Get unique auction IDs that are still live
      const activeAuctionIds = new Set(
        bidsData
          .filter(bid => bid.auctionStatus === 'live')
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
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
      case 'winning':
        return bids.filter(bid => bid.isWinning && bid.auctionStatus === 'live');
      case 'lost':
        return bids.filter(bid => !bid.isWinning && bid.auctionStatus === 'live');
      case 'won':
        return bids.filter(bid => bid.isWinning && bid.itemStatus === 'sold');
      default:
        return bids;
    }
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
              className={`filter-tab ${filter === 'winning' ? 'active' : ''}`}
              onClick={() => setFilter('winning')}
            >
              🏆 Winning
            </button>
            <button
              className={`filter-tab ${filter === 'lost' ? 'active' : ''}`}
              onClick={() => setFilter('lost')}
            >
              ⏳ Outbid
            </button>
            <button
              className={`filter-tab ${filter === 'won' ? 'active' : ''}`}
              onClick={() => setFilter('won')}
            >
              ✓ Won
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
                    <h3>{bid.itemName || 'Item'}</h3>
                    <Link to={`/auction/${bid.auctionId}`} className="auction-link">
                      {bid.auctionTitle || 'Auction'}
                    </Link>
                  </div>
                  <div className="bid-badges">
                    {bid.isWinning ? (
                      <span className="badge badge-success">Winning</span>
                    ) : bid.auctionStatus === 'completed' ? (
                      <span className="badge badge-secondary">Lost</span>
                    ) : (
                      <span className="badge badge-warning">Outbid</span>
                    )}
                    {bid.itemStatus === 'sold' && bid.isWinning && (
                      <span className="badge badge-success">Won</span>
                    )}
                  </div>
                </div>

                <div className="bid-details">
                  <div className="detail-row">
                    <span className="detail-label">Your Bid:</span>
                    <span className="detail-value highlight">
                      {formatCurrency(bid.bidAmount || 0)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Current Price:</span>
                    <span className="detail-value">
                      {formatCurrency(bid.currentBid || 0)}
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
                    <span className="detail-value">
                      {bid.createdAt ? formatDate(bid.createdAt.toDate()) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="bid-footer">
                  {bid.auctionStatus === 'live' && (
                    <Link 
                      to={`/auction/${bid.auctionId}/live`} 
                      className="btn btn-primary"
                    >
                      View Live Auction
                    </Link>
                  )}
                  {bid.auctionStatus !== 'live' && (
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
