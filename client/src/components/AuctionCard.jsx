// ---------------------------------------------------------------------------
// client/src/components/AuctionCard.jsx
// ---------------------------------------------------------------------------
import { Link } from 'react-router-dom';
import './AuctionCard.css';

const AuctionCard = ({ auction, showActions = true, userRole }) => {
  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: 'Upcoming', className: 'status-upcoming' },
      live: { label: 'Live Now', className: 'status-live' },
      completed: { label: 'Completed', className: 'status-completed' },
    };
    return badges[status] || badges.upcoming;
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBudget = (budget) => {
    if (!budget) return '₹0';
    const crores = budget / 10000000;
    return `₹${crores.toFixed(1)}Cr`;
  };

  const getSportIcon = (sport) => {
    const icons = {
      IPL: '🏏',
      PKL: '🤼',
      ISL: '⚽',
      HIL: '🏑',
      PBL: '🏸',
      UTT: '🏓',
      PVL: '🏐',
      IBL: '🏀',
      PWL: '🤼',
    };
    return icons[sport] || '🏆';
  };

  const status = getStatusBadge(auction.status);

  return (
    <div className={`auction-card ${auction.status}`}>
      {/* Header */}
      <div className="auction-header">
        <div className="auction-icon">{getSportIcon(auction.sport)}</div>
        <div className="auction-title-section">
          <h3 className="auction-title">{auction.title}</h3>
          <span className="auction-sport">{auction.sport}</span>
        </div>
        <span className={`status-badge ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="auction-details">
        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-icon">📅</span>
            <div className="detail-content">
              <span className="detail-label">Start Date</span>
              <span className="detail-value">{formatDate(auction.startDate)}</span>
            </div>
          </div>

          <div className="detail-item">
            <span className="detail-icon">🏁</span>
            <div className="detail-content">
              <span className="detail-label">End Date</span>
              <span className="detail-value">{formatDate(auction.endDate)}</span>
            </div>
          </div>
        </div>

        <div className="detail-row">
          <div className="detail-item">
            <span className="detail-icon">💰</span>
            <div className="detail-content">
              <span className="detail-label">Total Budget</span>
              <span className="detail-value highlight">
                {formatBudget(auction.totalBudget)}
              </span>
            </div>
          </div>

          <div className="detail-item">
            <span className="detail-icon">👥</span>
            <div className="detail-content">
              <span className="detail-label">Players</span>
              <span className="detail-value">{auction.playerCount || 0}</span>
            </div>
          </div>
        </div>

        {auction.description && (
          <div className="auction-description">
            <p>{auction.description}</p>
          </div>
        )}

        {auction.createdBy && (
          <div className="auction-creator">
            <span className="creator-icon">🎯</span>
            <span className="creator-label">Organized by:</span>
            <span className="creator-name">{auction.creatorName || 'Auctioneer'}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="auction-actions">
          {auction.status === 'live' && userRole === 'bidder' && (
            <Link
              to={`/auction/live/${auction.id}`}
              className="btn btn-primary btn-block"
            >
              🔴 Join Live Auction
            </Link>
          )}

          {auction.status === 'live' && userRole === 'auctioneer' && (
            <Link
              to={`/auction/live/${auction.id}`}
              className="btn btn-primary btn-block"
            >
              Manage Live Auction
            </Link>
          )}

          {auction.status === 'upcoming' && (
            <Link
              to={`/auction/${auction.id}`}
              className="btn btn-outline btn-block"
            >
              View Details
            </Link>
          )}

          {auction.status === 'completed' && (
            <Link
              to={`/auction/${auction.id}`}
              className="btn btn-outline btn-block"
            >
              View Results
            </Link>
          )}

          {!userRole && (
            <Link
              to={`/auction/${auction.id}`}
              className="btn btn-outline btn-block"
            >
              View Auction
            </Link>
          )}
        </div>
      )}

      {/* Footer Stats */}
      <div className="auction-footer">
        <div className="footer-stat">
          <span className="stat-label">Created</span>
          <span className="stat-value">
            {formatDate(auction.createdAt)}
          </span>
        </div>
        {auction.totalBids && (
          <div className="footer-stat">
            <span className="stat-label">Total Bids</span>
            <span className="stat-value">{auction.totalBids}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionCard;
