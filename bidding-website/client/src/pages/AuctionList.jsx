import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionService } from '../services/auctionService';
import './AuctionList.css';

const AuctionList = () => {
  const [auctions, setAuctions] = useState([]);
  const [filteredAuctions, setFilteredAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    filterAuctions();
  }, [filter, searchTerm, auctions]);

  const fetchAuctions = async () => {
    try {
      const data = await auctionService.getAllAuctions();
      setAuctions(data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAuctions = () => {
    let filtered = [...auctions];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(auction => auction.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(auction =>
        auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        auction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredAuctions(filtered);
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

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not set';
    // Handle Firestore timestamps
    const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="auction-list-page">
        <div className="container">
          <div className="loading">Loading auctions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auction-list-page">
      <div className="container">
        <div className="page-header">
          <h1>All Auctions</h1>
          <p>Browse and join exciting auctions</p>
        </div>

        {/* Filters */}
        <div className="filters-section card">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
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
              ⏳ Upcoming
            </button>
            <button
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              ✓ Completed
            </button>
          </div>
        </div>

        {/* Auctions Grid */}
        {filteredAuctions.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📭</div>
            <h3>No auctions found</h3>
            <p>Try adjusting your filters or search term</p>
          </div>
        ) : (
          <div className="auctions-grid">
            {filteredAuctions.map(auction => (
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
                    {auction.auctionType === 'sports_player' ? '⚽ Sports' : '🛍️ Item'}
                  </span>
                </div>

                <h3>{auction.title}</h3>
                <p className="auction-description">{auction.description}</p>

                <div className="auction-info">
                  <div className="info-row">
                    <span className="info-label">Created by</span>
                    <span className="info-value">{auction.createdByName || 'Unknown'}</span>
                  </div>
                  
                  {auction.startTime && (
                    <div className="info-row">
                      <span className="info-label">Starts</span>
                      <span className="info-value">{formatDate(auction.startTime)}</span>
                    </div>
                  )}
                  
                  {auction.auctionType === 'sports_player' && auction.teams && (
                    <div className="info-row">
                      <span className="info-label">Teams</span>
                      <span className="info-value">
                        {(typeof auction.teams === 'string' ? JSON.parse(auction.teams) : auction.teams).length} teams
                      </span>
                    </div>
                  )}
                </div>

                <div className="auction-footer">
                  {auction.status === 'live' && (
                    <span className="live-indicator">
                      <span className="pulse"></span>
                      Live Now
                    </span>
                  )}
                  <button className="btn btn-primary">
                    {auction.status === 'live' ? 'Join Auction' : 'View Details'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionList;