import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import { formatCurrency } from '../services/helpers';
import './AuctionDetails.css';

const AuctionDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add player form
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [playerForm, setPlayerForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    role: '',
    age: '',
    nationality: ''
  });

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  const fetchAuctionData = async () => {
    try {
      const auctionData = await auctionService.getAuction(id);
      setAuction(auctionData);
      
      const playersData = await auctionService.getAuctionPlayers(id);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error fetching auction data:', error);
      setError('Failed to load auction details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = async () => {
    if (!window.confirm('Are you sure you want to start this auction?')) return;
    
    try {
      await auctionService.startAuction(id);
      navigate(`/auction/live/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to start auction');
    }
  };

  const handleEndAuction = async () => {
    if (!window.confirm('Are you sure you want to end this auction?')) return;
    
    try {
      await auctionService.endAuction(id);
      await fetchAuctionData();
    } catch (err) {
      setError(err.message || 'Failed to end auction');
    }
  };

  const handlePlayerFormChange = (e) => {
    const { name, value } = e.target;
    setPlayerForm({
      ...playerForm,
      [name]: value
    });
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await auctionService.addPlayerToAuction(id, {
        name: playerForm.name,
        description: playerForm.description,
        basePrice: parseFloat(playerForm.basePrice),
        role: playerForm.role,
        age: parseInt(playerForm.age) || null,
        nationality: playerForm.nationality
      });

      // Reset form and refresh players
      setPlayerForm({
        name: '',
        description: '',
        basePrice: '',
        role: '',
        age: '',
        nationality: ''
      });
      setShowAddPlayer(false);
      await fetchAuctionData();
    } catch (err) {
      setError(err.message || 'Failed to add player');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: 'badge-warning',
      pending: 'badge-warning',
      live: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-error'
    };
    return badges[status] || 'badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="auction-details-page">
        <div className="container">
          <div className="loading">Loading auction details...</div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="auction-details-page">
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

  const isCreator = user?.id === auction.createdBy;
  const canManage = isCreator || user?.role === 'admin';

  return (
    <div className="auction-details-page">
      <div className="container">
        {/* Auction Header */}
        <div className="auction-header card">
          <div className="header-content">
            <div className="title-section">
              <h1>{auction.title}</h1>
              <div className="badges">
                <span className={`badge ${getStatusBadge(auction.status)}`}>
                  {auction.status}
                </span>
                <span className="badge badge-secondary">
                  {auction.sport ? `⚽ ${auction.sport}` : '🛍️'} Auction
                </span>
              </div>
            </div>
            <p className="description">{auction.description}</p>
          </div>

          <div className="auction-info-grid">
            <div className="info-card">
              <span className="info-label">Created by</span>
              <span className="info-value">{auction.createdBy || 'Unknown'}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Start Date</span>
              <span className="info-value">{formatDate(auction.startDate)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">End Date</span>
              <span className="info-value">{formatDate(auction.endDate)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Total Players</span>
              <span className="info-value">{players.length}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {canManage && (
            <div className="action-buttons">
              {auction.status === 'upcoming' || auction.status === 'pending' ? (
                players.length > 0 && (
                  <button onClick={handleStartAuction} className="btn btn-success">
                    🚀 Start Auction
                  </button>
                )
              ) : null}
              {auction.status === 'live' && (
                <>
                  <button onClick={() => navigate(`/auction/live/${id}`)} className="btn btn-primary">
                    📺 View Live Auction
                  </button>
                  <button onClick={handleEndAuction} className="btn btn-error">
                    🛑 End Auction
                  </button>
                </>
              )}
              {(auction.status === 'upcoming' || auction.status === 'pending') && (
                <button onClick={() => setShowAddPlayer(true)} className="btn btn-primary">
                  ➕ Add Player
                </button>
              )}
            </div>
          )}

          {!canManage && auction.status === 'live' && (
            <div className="action-buttons">
              <button onClick={() => navigate(`/auction/live/${id}`)} className="btn btn-primary">
                🔴 Join Live Auction
              </button>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
        </div>

        {/* Teams Section (for sports auctions) */}
        {auction.sport && auction.teams && (
          <div className="teams-section card">
            <h2>Participating Teams / Franchises</h2>
            <div className="teams-grid">
              {auction.teams.map((team, index) => (
                <div key={index} className="team-card">
                  <span className="team-icon">⚽</span>
                  <span className="team-name">{team}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Player Form */}
        {showAddPlayer && canManage && (
          <div className="add-player-section card">
            <div className="section-header">
              <h2>Add New Player</h2>
              <button onClick={() => setShowAddPlayer(false)} className="btn">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddPlayer} className="player-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={playerForm.name}
                    onChange={handlePlayerFormChange}
                    placeholder="Enter player name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Base Price *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={playerForm.basePrice}
                    onChange={handlePlayerFormChange}
                    placeholder="Enter base price"
                    step="100000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={playerForm.description}
                  onChange={handlePlayerFormChange}
                  placeholder="Enter player description"
                  rows="3"
                  required
                ></textarea>
              </div>

              {auction.sport && (
                <>
                  <h3>Player Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Position / Role</label>
                      <input
                        type="text"
                        name="role"
                        value={playerForm.role}
                        onChange={handlePlayerFormChange}
                        placeholder="e.g., Forward, Batsman, Point Guard"
                      />
                    </div>

                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        name="age"
                        value={playerForm.age}
                        onChange={handlePlayerFormChange}
                        placeholder="Enter age"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        name="nationality"
                        value={playerForm.nationality}
                        onChange={handlePlayerFormChange}
                        placeholder="Enter nationality"
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-success">
                Add Player
              </button>
            </form>
          </div>
        )}

        {/* Players List */}
        <div className="players-section">
          <h2>Players ({players.length})</h2>

          {players.length === 0 ? (
            <div className="empty-state card">
              <p>No players added yet</p>
              {canManage && (auction.status === 'upcoming' || auction.status === 'pending') && (
                <button onClick={() => setShowAddPlayer(true)} className="btn btn-primary mt-2">
                  Add First Player
                </button>
              )}
            </div>
          ) : (
            <div className="players-grid">
              {players.map(player => (
                <div key={player.id} className="player-card card">
                  <div className="player-header">
                    <h3>{player.name}</h3>
                    <span className={`player-status ${player.status}`}>
                      {player.status}
                    </span>
                  </div>

                  <p className="player-description">{player.description}</p>

                  {player.role && (
                    <div className="player-info">
                      <span className="player-stat">
                        Position: {player.role}
                      </span>
                      {player.age && (
                        <span className="player-stat">
                          Age: {player.age}
                        </span>
                      )}
                      {player.nationality && (
                        <span className="player-stat">
                          {player.nationality}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="player-pricing">
                    <div className="price-info">
                      <span className="price-label">Base Price</span>
                      <span className="price-value">{formatCurrency(player.basePrice)}</span>
                    </div>
                    {player.currentBid && player.currentBid > player.basePrice && (
                      <div className="price-info highlight">
                        <span className="price-label">Current Bid</span>
                        <span className="price-value">{formatCurrency(player.currentBid)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuctionDetails;
