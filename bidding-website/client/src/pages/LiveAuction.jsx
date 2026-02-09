import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';
import { formatCurrency, formatTimeRemaining } from '../services/helpers';
import './LiveAuction.css';

const LiveAuction = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  useEffect(() => {
    if (currentPlayer) {
      fetchPlayerBids(currentPlayer.id);
    }
  }, [currentPlayer]);

  const fetchAuctionData = async () => {
    try {
      const auctionData = await auctionService.getAuction(id);
      setAuction(auctionData);
      
      const playersData = await auctionService.getAuctionPlayers(id);
      setPlayers(playersData);
      
      if (playersData.length > 0) {
        setCurrentPlayer(playersData[0]);
        setBidAmount(playersData[0].currentBid || playersData[0].basePrice);
      }
    } catch (error) {
      console.error('Error fetching auction data:', error);
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerBids = async (playerId) => {
    try {
      const bidsData = await bidService.getPlayerBids(id, playerId);
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(bidAmount);
    const currentPrice = currentPlayer?.currentBid || currentPlayer?.basePrice;

    if (amount <= currentPrice) {
      setError('Bid must be higher than current bid');
      return;
    }

    if (auction.sport && !selectedTeam) {
      setError('Please select a team');
      return;
    }

    try {
      await bidService.placeBid(id, currentPlayer.id, amount);

      // Refresh data
      await fetchAuctionData();
      await fetchPlayerBids(currentPlayer.id);
      
      // Increment bid amount
      setBidAmount((amount + 100000).toString());
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    }
  };

  const selectPlayer = (player) => {
    setCurrentPlayer(player);
    setBidAmount((player.currentBid || player.basePrice).toString());
    setError('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      available: 'badge-success',
      sold: 'badge-secondary',
      unsold: 'badge-warning'
    };
    return badges[status] || 'badge-secondary';
  };

  if (loading) {
    return (
      <div className="live-auction-page">
        <div className="container">
          <div className="loading">Loading auction...</div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="live-auction-page">
        <div className="container">
          <div className="error-state card">
            <h2>Auction not found</h2>
            <button onClick={() => navigate('/auctions')} className="btn btn-primary">
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-auction-page">
      <div className="container">
        {/* Auction Header */}
        <div className="auction-header-section card">
          <div className="auction-title-area">
            <h1>{auction.title}</h1>
            <span className={`badge badge-${auction.status === 'live' ? 'success' : 'warning'}`}>
              {auction.status === 'live' ? '🔴 Live' : auction.status}
            </span>
          </div>
          <p>{auction.description}</p>
          {auction.endDate && (
            <div className="auction-timer">
              {formatTimeRemaining(auction.endDate)}
            </div>
          )}
        </div>

        <div className="auction-content">
          {/* Current Player Section */}
          <div className="current-player-section">
            {currentPlayer ? (
              <div className="current-player-card card">
                <div className="player-badge">
                  {auction.sport ? `⚽ ${auction.sport} Player` : '🛍️ Item'}
                </div>
                
                <h2>{currentPlayer.name}</h2>
                <p className="player-description">{currentPlayer.description}</p>
                
                {auction.sport && currentPlayer.role && (
                  <div className="player-stats">
                    <div className="stat-item">
                      <span className="stat-label">Position:</span>
                      <span className="stat-value">{currentPlayer.role}</span>
                    </div>
                    {currentPlayer.nationality && (
                      <div className="stat-item">
                        <span className="stat-label">Nationality:</span>
                        <span className="stat-value">{currentPlayer.nationality}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="price-section">
                  <div className="price-item">
                    <span className="price-label">Base Price</span>
                    <span className="price-value">{formatCurrency(currentPlayer.basePrice)}</span>
                  </div>
                  <div className="price-item current">
                    <span className="price-label">Current Bid</span>
                    <span className="price-value highlight">
                      {formatCurrency(currentPlayer.currentBid || currentPlayer.basePrice)}
                    </span>
                  </div>
                </div>

                {auction.status === 'live' && user?.role === 'bidder' && (
                  <form onSubmit={handlePlaceBid} className="bid-form">
                    {error && (
                      <div className="alert alert-error">
                        {error}
                      </div>
                    )}

                    {auction.sport && auction.teams && (
                      <div className="form-group">
                        <label>Select Team / Franchise</label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          required
                        >
                          <option value="">Choose a team...</option>
                          {auction.teams?.map(team => (
                            <option key={team} value={team}>{team}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Your Bid Amount</label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount"
                        step="100000"
                        required
                      />
                    </div>

                    <button type="submit" className="btn btn-primary w-full">
                      Place Bid
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <div className="card">
                <p className="text-center">No players in this auction</p>
              </div>
            )}

            {/* Bid History */}
            <div className="bid-history card">
              <h3>Bid History</h3>
              {bids.length === 0 ? (
                <p className="empty-bids">No bids yet</p>
              ) : (
                <div className="bids-list">
                  {bids.map((bid, index) => (
                    <div key={bid.id} className={`bid-item ${index === 0 ? 'highest' : ''}`}>
                      <div className="bid-info">
                        <span className="bidder-name">{bid.bidderName}</span>
                        {bid.teamName && (
                          <span className="team-name">{bid.teamName}</span>
                        )}
                      </div>
                      <span className="bid-amount">{formatCurrency(bid.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Players List Sidebar */}
          <div className="players-sidebar">
            <div className="players-list card">
              <h3>All Players ({players.length})</h3>
              <div className="players-scroll">
                {players.map(player => (
                  <div
                    key={player.id}
                    className={`player-card ${currentPlayer?.id === player.id ? 'active' : ''}`}
                    onClick={() => selectPlayer(player)}
                  >
                    <h4>{player.name}</h4>
                    <div className="player-price">
                      {formatCurrency(player.currentBid || player.basePrice)}
                    </div>
                    <span className={`player-status ${player.status}`}>
                      {player.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAuction;
