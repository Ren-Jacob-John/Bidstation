import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import bidService from '../services/bidService';
import auctionService from '../services/auctionService';
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
      const rawBids = await bidService.getMyBids();
      const auctions = await auctionService.getAllAuctions();
      const auctionStatusMap = Object.fromEntries(
        auctions.map(a => [a.id, a.status])
      );

      const bidsData = rawBids.map(bid => ({
        id: bid.id,
        auction_id: bid.auctionId,
        auction_title: bid.auctionTitle || 'Auction',
        item_name: bid.playerName || 'Item',
        bid_amount: bid.amount,
        current_price: bid.amount,
        is_winning: bid.status === 'active',
        item_status: bid.status === 'won' ? 'sold' : '',
        auction_status: auctionStatusMap[bid.auctionId] === 'upcoming' ? 'pending' : (auctionStatusMap[bid.auctionId] || 'live'),
        created_at: bid.timestamp,
        team_name: bid.teamName || null
      }));

      setBids(bidsData);

      const winningBids = bidsData.filter(bid => bid.is_winning).length;
      const totalSpent = bidsData
        .filter(bid => bid.item_status === 'sold' && bid.is_winning)
        .reduce((sum, bid) => sum + parseFloat(bid.bid_amount || 0), 0);
      const activeAuctions = new Set(
        bidsData
          .filter(bid => bid.auction_status === 'live')
          .map(bid => bid.auction_id)
      ).size;

      setStats({
        totalBids: bidsData.length,
        winningBids,
        totalSpent,
        activeAuctions
      });
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBids([]);
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

  const formatDate = (dateVal) => {
    if (dateVal == null) return '—';
    const d = typeof dateVal === 'number' ? new Date(dateVal) : new Date(dateVal);
    return d.toLocaleDateString('en-US', {
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
        return bids.filter(bid => bid.is_winning && bid.auction_status === 'live');
      case 'lost':
        return bids.filter(bid => !bid.is_winning && bid.auction_status === 'live');
      case 'won':
        return bids.filter(bid => bid.is_winning && bid.item_status === 'sold');
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
                    <h3>{bid.item_name}</h3>
                    <Link to={`/auction/${bid.auction_id}`} className="auction-link">
                      {bid.auction_title}
                    </Link>
                  </div>
                  <div className="bid-badges">
                    {bid.is_winning ? (
                      <span className="badge badge-success">Winning</span>
                    ) : bid.auction_status === 'completed' ? (
                      <span className="badge badge-secondary">Lost</span>
                    ) : (
                      <span className="badge badge-warning">Outbid</span>
                    )}
                    {bid.item_status === 'sold' && bid.is_winning && (
                      <span className="badge badge-success">Won</span>
                    )}
                  </div>
                </div>

                <div className="bid-details">
                  <div className="detail-row">
                    <span className="detail-label">Your Bid:</span>
                    <span className="detail-value highlight">
                      {formatCurrency(bid.bid_amount)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Current Price:</span>
                    <span className="detail-value">
                      {formatCurrency(bid.current_price)}
                    </span>
                  </div>

                  {bid.team_name && (
                    <div className="detail-row">
                      <span className="detail-label">Team:</span>
                      <span className="detail-value">{bid.team_name}</span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Bid Placed:</span>
                    <span className="detail-value">{formatDate(bid.created_at)}</span>
                  </div>
                </div>

                <div className="bid-footer">
                  {bid.auction_status === 'live' && (
                    <Link 
                      to={`/auction/live/${bid.auction_id}`} 
                      className="btn btn-primary"
                    >
                      View Live Auction
                    </Link>
                  )}
                  {bid.auction_status !== 'live' && (
                    <Link 
                      to={`/auction/${bid.auction_id}`} 
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
