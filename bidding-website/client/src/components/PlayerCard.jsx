// ---------------------------------------------------------------------------
// client/src/components/PlayerCard.jsx
// ---------------------------------------------------------------------------
import { useState } from 'react';
import './PlayerCard.css';

const PlayerCard = ({ player, onBid, userRole, auctionStatus }) => {
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const handleBidClick = () => {
    if (userRole !== 'bidder') {
      setError('Only bidders can place bids');
      return;
    }
    if (auctionStatus !== 'live') {
      setError('Auction is not live');
      return;
    }
    setShowBidModal(true);
    setBidAmount(player.currentBid ? (player.currentBid + 100000).toString() : player.basePrice.toString());
  };

  const handleBidSubmit = () => {
    const amount = parseInt(bidAmount);
    
    // Validation
    if (!amount || isNaN(amount)) {
      setError('Please enter a valid amount');
      return;
    }
    
    const minBid = player.currentBid ? player.currentBid + 50000 : player.basePrice;
    if (amount < minBid) {
      setError(`Minimum bid: ₹${(minBid / 100000).toFixed(1)}L`);
      return;
    }

    setError('');
    onBid(player.id, amount);
    setShowBidModal(false);
    setBidAmount('');
  };

  const formatPrice = (price) => {
    if (!price) return '₹0';
    const crores = price / 10000000;
    const lakhs = price / 100000;
    
    if (crores >= 1) {
      return `₹${crores.toFixed(2)}Cr`;
    }
    return `₹${lakhs.toFixed(1)}L`;
  };

  return (
    <>
      <div className={`player-card ${player.sold ? 'sold' : ''}`}>
        {/* Player Image */}
        <div className="player-image-container">
          {player.imageUrl ? (
            <img 
              src={player.imageUrl} 
              alt={player.name}
              className="player-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/200x250?text=Player';
              }}
            />
          ) : (
            <div className="player-image-placeholder">
              <span className="placeholder-icon">👤</span>
            </div>
          )}
          
          {player.sold && (
            <div className="sold-badge">SOLD</div>
          )}
        </div>

        {/* Player Info */}
        <div className="player-info">
          <h3 className="player-name">{player.name}</h3>
          
          <div className="player-details">
            <div className="detail-item">
              <span className="detail-label">Role:</span>
              <span className="detail-value">{player.role}</span>
            </div>
            
            <div className="detail-item">
              <span className="detail-label">Sport:</span>
              <span className="detail-value">{player.sport}</span>
            </div>
            
            {player.nationality && (
              <div className="detail-item">
                <span className="detail-label">Country:</span>
                <span className="detail-value">{player.nationality}</span>
              </div>
            )}
          </div>

          {/* Pricing */}
          <div className="player-pricing">
            <div className="price-row">
              <span className="price-label">Base Price:</span>
              <span className="price-value">{formatPrice(player.basePrice)}</span>
            </div>
            
            {player.currentBid && (
              <div className="price-row current">
                <span className="price-label">Current Bid:</span>
                <span className="price-value highlight">{formatPrice(player.currentBid)}</span>
              </div>
            )}
            
            {player.currentBidder && (
              <div className="current-bidder">
                Leading: {player.currentBidder}
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {player.stats && (
            <div className="player-stats">
              {Object.entries(player.stats).slice(0, 3).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <span className="stat-label">{key}:</span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          {!player.sold && auctionStatus === 'live' && (
            <button 
              onClick={handleBidClick}
              className="btn btn-bid"
              disabled={userRole !== 'bidder'}
            >
              {userRole === 'bidder' ? 'Place Bid' : 'Bidders Only'}
            </button>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      {showBidModal && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place Bid for {player.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowBidModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="bid-info">
                <p>Current: {formatPrice(player.currentBid || player.basePrice)}</p>
                <p className="min-bid-text">
                  Minimum: {formatPrice((player.currentBid || player.basePrice) + 50000)}
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="bidAmount">Your Bid Amount (₹)</label>
                <input
                  type="number"
                  id="bidAmount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="Enter amount in rupees"
                  min={player.currentBid ? player.currentBid + 50000 : player.basePrice}
                  step="50000"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="quick-bids">
                <p className="quick-bids-label">Quick Amounts:</p>
                <div className="quick-bid-buttons">
                  {[1, 2, 5, 10].map((lakhs) => {
                    const amount = (player.currentBid || player.basePrice) + (lakhs * 100000);
                    return (
                      <button
                        key={lakhs}
                        onClick={() => setBidAmount(amount.toString())}
                        className="btn btn-quick"
                      >
                        +{lakhs}L
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowBidModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                onClick={handleBidSubmit}
                className="btn btn-primary"
              >
                Confirm Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayerCard;
