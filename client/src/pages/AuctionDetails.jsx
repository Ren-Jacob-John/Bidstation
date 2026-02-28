import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';
import './AuctionDetails.css';

const AuctionDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    condition: 'Good',
    imageUrl: '',
    playerDetails: {
      role: '',
      age: '',
      nationality: ''
    }
  });

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  const fetchAuctionData = async () => {
    try {
      const auctionData = await auctionService.getAuction(id);
      setAuction(auctionData);
      const itemsData = await auctionService.getAuctionItems(id, { auctionType: auctionData.auction_type });
      setItems(itemsData);
    } catch (err) {
      console.error('Error fetching auction data:', err);
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
      await bidService.finalizeAuctionBids(id);
      await auctionService.endAuction(id);
      await fetchAuctionData();
    } catch (err) {
      setError(err.message || 'Failed to end auction');
    }
  };

  const handleItemFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('player_')) {
      const playerField = name.replace('player_', '');
      setItemForm({
        ...itemForm,
        playerDetails: {
          ...itemForm.playerDetails,
          [playerField]: value
        }
      });
    } else {
      setItemForm({
        ...itemForm,
        [name]: value
      });
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await auctionService.addItem({
        auctionId: id,
        name: itemForm.name,
        description: itemForm.description,
        basePrice: parseFloat(itemForm.basePrice),
        base_price: parseFloat(itemForm.basePrice),
        category: itemForm.category,
        imageUrl: itemForm.imageUrl,
        condition: itemForm.condition,
        playerDetails: auction.auction_type === 'sports_player' ? itemForm.playerDetails : null
      });
      setItemForm({
        name: '',
        description: '',
        basePrice: '',
        category: auction.category || 'Electronics',
        imageUrl: '',
        condition: 'Good',
        playerDetails: { role: '', age: '', nationality: '' }
      });
      setShowAddItem(false);
      await fetchAuctionData();
    } catch (err) {
      setError(err.message || 'Failed to add item');
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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

  const isCreator = user?.uid === auction.creator_id || user?.id === auction.creator_id;
  const canManage = user && (isCreator || user?.role === 'admin');

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
                  {auction.auction_type === 'sports_player' ? '⚽ Sports Player' : '🛍️ Item'} Auction
                </span>
              </div>
            </div>
            <p className="description">{auction.description}</p>
          </div>

          <div className="auction-info-grid">
            <div className="info-card">
              <span className="info-label">Start Time</span>
              <span className="info-value">{formatDate(auction.start_time)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">End Time</span>
              <span className="info-value">{formatDate(auction.end_time)}</span>
            </div>
            <div className="info-card">
              <span className="info-label">{auction.auction_type === 'sports_player' ? 'Players' : 'Items'}</span>
              <span className="info-value">{items.length}</span>
            </div>
          </div>

          {/* Join code (sports auctions only, visible only to auctioneer) */}
          {auction.auction_type === 'sports_player' && isCreator && (auction.joinCode || auction.join_code) && (
            <div className="join-code-box">
              <span className="join-code-label">Share this code to join</span>
              <div className="join-code-value-wrap">
                <code className="join-code-value">{auction.joinCode || auction.join_code}</code>
                <button
                  type="button"
                  className="btn btn-outline btn-sm join-code-copy"
                  onClick={() => {
                    const c = auction.joinCode || auction.join_code;
                    navigator.clipboard?.writeText(c);
                  }}
                >
                  Copy
                </button>
              </div>
              <p className="join-code-hint">Participants can enter this code at <Link to="/join">Join with code</Link></p>
            </div>
          )}

          {/* Action Buttons */}
          {!user && (
            <div className="action-buttons">
              <Link to="/login" className="btn btn-primary">Sign in to bid or manage</Link>
              <Link to="/register" className="btn btn-outline">Create account</Link>
            </div>
          )}
          {canManage && (
            <div className="action-buttons">
              {auction.status === 'pending' && items.length > 0 && (
                <button onClick={handleStartAuction} className="btn btn-success">
                  🚀 Start Auction
                </button>
              )}
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
              {auction.status === 'pending' && (
                <button onClick={() => setShowAddItem(true)} className="btn btn-primary">
                  ➕ Add Item
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

        {/* Teams Section (for sports player auctions) */}
        {auction.auction_type === 'sports_player' && (() => {
          const teamsRaw = auction.teams;
          let teamsList = [];
          try {
            if (typeof teamsRaw === 'string') teamsList = JSON.parse(teamsRaw || '[]');
            else if (Array.isArray(teamsRaw)) teamsList = teamsRaw;
          } catch (_) { teamsList = []; }
          if (teamsList.length === 0) return null;
          return (
            <div className="teams-section card">
              <h2>Participating Teams / Franchises</h2>
              <div className="teams-grid">
                {teamsList.map((team, index) => (
                  <div key={index} className="team-card">
                    <span className="team-icon">⚽</span>
                    <span className="team-name">{team}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Add Item Form */}
        {showAddItem && canManage && (
          <div className="add-item-section card">
            <div className="section-header">
              <h2>Add New {auction.auction_type === 'sports_player' ? 'Player' : 'Item'}</h2>
              <button onClick={() => setShowAddItem(false)} className="btn">
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddItem} className="item-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={itemForm.name}
                    onChange={handleItemFormChange}
                    placeholder="Enter name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Base Price *</label>
                  <input
                    type="number"
                    name="basePrice"
                    value={itemForm.basePrice}
                    onChange={handleItemFormChange}
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
                  value={itemForm.description}
                  onChange={handleItemFormChange}
                  placeholder="Enter description"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={itemForm.category}
                    onChange={handleItemFormChange}
                    placeholder="Enter category"
                  />
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={itemForm.imageUrl}
                    onChange={handleItemFormChange}
                    placeholder="Enter image URL"
                  />
                </div>
              </div>

              {auction.auction_type === 'sports_player' && (
                <>
                  <h3>Player Details</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Position / Role</label>
                      <input
                        type="text"
                        name="player_role"
                        value={itemForm.playerDetails.role}
                        onChange={handleItemFormChange}
                        placeholder="e.g., Forward, Batsman, Point Guard"
                      />
                    </div>

                    <div className="form-group">
                      <label>Age</label>
                      <input
                        type="number"
                        name="player_age"
                        value={itemForm.playerDetails.age}
                        onChange={handleItemFormChange}
                        placeholder="Enter age"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        name="player_nationality"
                        value={itemForm.playerDetails.nationality}
                        onChange={handleItemFormChange}
                        placeholder="Enter nationality"
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-success">
                Add {auction.auction_type === 'sports_player' ? 'Player' : 'Item'}
              </button>
            </form>
          </div>
        )}

        {/* Auction Results (when completed) */}
        {auction.status === 'completed' && items.length > 0 && (
          <div className="results-section card">
            <h2>Auction Results</h2>
            <p className="results-subtitle">
              {items.filter(i => i.status === 'sold').length} sold, {items.filter(i => i.status !== 'sold').length} unsold
            </p>
            <div className="results-grid">
              {items.map(item => {
                const isSold = item.status === 'sold';
                return (
                  <div key={item.id} className={`result-card ${isSold ? 'sold' : 'unsold'}`}>
                    <div className="result-card-header">
                      <h3>{item.name}</h3>
                      <span className={`item-status ${isSold ? 'sold' : 'unsold'}`}>
                        {isSold ? 'Sold' : 'Unsold'}
                      </span>
                    </div>
                    {isSold && item.current_bidder_name && (
                      <p className="result-winner">
                        Won by <strong>{item.current_bidder_name}</strong> for {formatCurrency(item.current_price)}
                      </p>
                    )}
                    {!isSold && (
                      <p className="result-unsold">No winning bid</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Auction Result – shared contact details */}
            {auction.status === 'completed' && (
              <div className="auction-result-contact card">
                <h3>Auction Result – Contact Details</h3>
                <p className="results-subtitle">
                  Once this auction is completed, the winning bidder and auctioneer can see each other's contact details here.
                </p>
                {/* Actual contact details are protected and fetched via Realtime Database
                    security rules under auctions/{auctionId}/sharedContacts. */}
              </div>
            )}
          </div>
        )}

        {/* Items List */}
        <div className="items-section">
          <h2>
            {auction.auction_type === 'sports_player' ? 'Players' : 'Items'} ({items.length})
          </h2>

          {items.length === 0 ? (
            <div className="empty-state card">
              <p>No {auction.auction_type === 'sports_player' ? 'players' : 'items'} added yet</p>
              {canManage && auction.status === 'pending' && (
                <button onClick={() => setShowAddItem(true)} className="btn btn-primary mt-2">
                  Add First {auction.auction_type === 'sports_player' ? 'Player' : 'Item'}
                </button>
              )}
            </div>
          ) : (
            <div className="items-grid">
              {items.map(item => (
                <div key={item.id} className="item-card card">
                  <div className="item-header">
                    <h3>{item.name}</h3>
                    <span className={`item-status ${item.status}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="item-description">{item.description}</p>

                  {auction.auction_type === 'sports_player' && item.player_details && (
                    <div className="player-info">
                      {JSON.parse(item.player_details).role && (
                        <span className="player-stat">
                          Position: {JSON.parse(item.player_details).role}
                        </span>
                      )}
                      {JSON.parse(item.player_details).age && (
                        <span className="player-stat">
                          Age: {JSON.parse(item.player_details).age}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="item-pricing">
                    <div className="price-info">
                      <span className="price-label">Base Price</span>
                      <span className="price-value">{formatCurrency(item.base_price)}</span>
                    </div>
                    {item.current_price && item.current_price > item.base_price && (
                      <div className="price-info highlight">
                        <span className="price-label">Current Price</span>
                        <span className="price-value">{formatCurrency(item.current_price)}</span>
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
