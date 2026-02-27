// ---------------------------------------------------------------------------
// client/src/components/BidHistory.jsx
// ---------------------------------------------------------------------------
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPlayerBids, listenToAuctionBids } from '../services/bidService';
import './BidHistory.css';

const BidHistory = ({ playerId, playerName, auctionId }) => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, my-bids

  const normaliseBids = (data) =>
    data.map((bid) => ({
      ...bid,
      timestamp: bid.timestamp ? new Date(bid.timestamp) : new Date(),
    }));

  const fetchBidHistory = async () => {
    if (!playerId || !auctionId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getPlayerBids(auctionId, playerId);
      setBids(normaliseBids(data));
    } catch (err) {
      console.error('Failed to load bid history', err);
      setError('Failed to load bid history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!playerId || !auctionId) {
      setBids([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const unsubscribe = listenToAuctionBids(auctionId, (allBids) => {
      try {
        const filtered = allBids.filter((b) => b.playerId === playerId);
        setBids(normaliseBids(filtered));
        setLoading(false);
      } catch (err) {
        console.error('Failed to update bid history', err);
        setError('Failed to load bid history');
        setLoading(false);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [playerId, auctionId]);

  const formatPrice = (price) => {
    const crores = price / 10000000;
    const lakhs = price / 100000;
    
    if (crores >= 1) {
      return `₹${crores.toFixed(2)}Cr`;
    }
    return `₹${lakhs.toFixed(1)}L`;
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatFullTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHighestBid = () => {
    if (bids.length === 0) return null;
    return bids.reduce(
      (max, bid) => (bid.amount > max.amount ? bid : max),
      bids[0]
    );
  };

  const getBidIncrement = (list, index) => {
    if (index === list.length - 1) return null;
    const current = list[index];
    const previous = list[index + 1];
    return current.amount - previous.amount;
  };

  const myUserId = user?.id || user?.uid;

  const visibleBids = useMemo(() => {
    if (filter === 'my-bids' && myUserId) {
      return bids.filter((b) => b.bidderId === myUserId);
    }
    return bids;
  }, [bids, filter, myUserId]);

  if (loading) {
    return (
      <div className="bid-history">
        <div className="bid-history-header">
          <h3>Bid History</h3>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading bid history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bid-history">
        <div className="bid-history-header">
          <h3>Bid History</h3>
        </div>
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={fetchBidHistory} className="btn btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const highestBid = getHighestBid();

  return (
    <div className="bid-history">
      {/* Header */}
      <div className="bid-history-header">
        <div className="header-left">
          <h3>Bid History</h3>
          {playerName && (
            <span className="player-name-badge">{playerName}</span>
          )}
        </div>
        <div className="header-right">
          <span className="bid-count">{bids.length} Bids</span>
          <button 
            onClick={fetchBidHistory}
            className="btn btn-refresh"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Summary */}
      {highestBid && (
        <div className="bid-summary">
          <div className="summary-item">
            <span className="summary-label">Current Highest</span>
            <span className="summary-value highlight">
              {formatPrice(highestBid.amount)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Leading Bidder</span>
            <span className="summary-value">{highestBid.bidderName}</span>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="bid-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Bids
        </button>
        <button
          className={`filter-btn ${filter === 'my-bids' ? 'active' : ''}`}
          onClick={() => setFilter('my-bids')}
          disabled={!myUserId}
          title={!myUserId ? 'Sign in to see your bids' : undefined}
        >
          My Bids
        </button>
      </div>

      {/* Bid List */}
      <div className="bid-list">
        {visibleBids.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No bids placed yet</p>
            <p className="empty-subtitle">Be the first to bid!</p>
          </div>
        ) : (
          visibleBids.map((bid, index) => {
            const increment = getBidIncrement(visibleBids, index);
            const isWinning = bid.status === 'active';

            return (
              <div
                key={bid.id}
                className={`bid-item ${isWinning ? 'winning' : ''}`}
              >
                <div className="bid-rank">
                  {isWinning ? (
                    <span className="rank-badge winning">👑</span>
                  ) : (
                    <span className="rank-number">#{index + 1}</span>
                  )}
                </div>

                <div className="bid-content">
                  <div className="bid-main">
                    <div className="bidder-info">
                      <span className="bidder-icon">👤</span>
                      <span className="bidder-name">{bid.bidderName}</span>
                      {isWinning && (
                        <span className="winning-badge">Winning</span>
                      )}
                    </div>
                    <div className="bid-amount">
                      {formatPrice(bid.amount)}
                      {increment && (
                        <span className="bid-increment">
                          +{formatPrice(increment)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bid-meta">
                    <span className="bid-time" title={formatFullTime(bid.timestamp)}>
                      🕒 {formatTime(bid.timestamp)}
                    </span>
                    {bid.status === 'outbid' && (
                      <span className="bid-status outbid">Outbid</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Stats */}
      {bids.length > 0 && (
        <div className="bid-history-footer">
          <div className="footer-stat">
            <span className="stat-label">Total Bids</span>
            <span className="stat-value">{bids.length}</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Last Updated</span>
            <span className="stat-value">{formatTime(bids[0].timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BidHistory;
