import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auctionService } from '../services/auctionService';
import './LiveAuction.css';

const LiveAuction = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  useEffect(() => {
    if (currentItem) {
      fetchItemBids(currentItem.id);
    }
  }, [currentItem]);

  const fetchAuctionData = async () => {
    try {
      const auctionData = await auctionService.getAuctionById(id);
      setAuction(auctionData.auction);
      
      const itemsData = await auctionService.getAuctionItems(id);
      setItems(itemsData);
      
      if (itemsData.length > 0) {
        setCurrentItem(itemsData[0]);
        setBidAmount(itemsData[0].currentBid || itemsData[0].basePrice || 0);
      }
    } catch (error) {
      console.error('Error fetching auction data:', error);
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemBids = async (itemId) => {
    try {
      const bidsData = await auctionService.getItemBids(itemId);
      setBids(bidsData);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(bidAmount);
    const currentPrice = currentItem.currentBid || currentItem.basePrice || 0;

    if (amount <= currentPrice) {
      setError('Bid must be higher than current price');
      return;
    }

    if (auction.auctionType === 'sports_player' && !selectedTeam) {
      setError('Please select a team');
      return;
    }

    try {
      await auctionService.placeBid({
        itemId: currentItem.id,
        auctionId: id,
        bidderId: user?.id,
        bidderName: user?.username || 'Anonymous',
        bidAmount: amount,
        teamName: selectedTeam || null
      });

      // Refresh data
      await fetchAuctionData();
      await fetchItemBids(currentItem.id);
      
      // Increment bid amount
      setBidAmount((amount + 100000).toString());
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    }
  };

  const selectItem = (item) => {
    setCurrentItem(item);
    setBidAmount((item.currentBid || item.basePrice || 0).toString());
    setError('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
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
        </div>

        <div className="auction-content">
          {/* Current Item Section */}
          <div className="current-item-section">
            {currentItem ? (
              <div className="current-item-card card">
                <div className="item-badge">
                  {auction.auctionType === 'sports_player' ? '⚽ Player' : '🛍️ Item'}
                </div>
                
                <h2>{currentItem.name}</h2>
                <p className="item-description">{currentItem.description}</p>
                
                {auction.auctionType === 'sports_player' && currentItem.playerDetails && (
                  <div className="player-stats">
                    {currentItem.playerDetails.role && (
                      <div className="stat-item">
                        <span className="stat-label">Position:</span>
                        <span className="stat-value">
                          {currentItem.playerDetails.role}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="price-section">
                  <div className="price-item">
                    <span className="price-label">Base Price</span>
                    <span className="price-value">{formatCurrency(currentItem.basePrice || 0)}</span>
                  </div>
                  <div className="price-item current">
                    <span className="price-label">Current Bid</span>
                    <span className="price-value highlight">
                      {formatCurrency(currentItem.currentBid || currentItem.basePrice || 0)}
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

                    {auction.auctionType === 'sports_player' && (
                      <div className="form-group">
                        <label>Select Team / Franchise</label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          required
                        >
                          <option value="">Choose a team...</option>
                          {(typeof auction.teams === 'string' ? JSON.parse(auction.teams || '[]') : (auction.teams || [])).map(team => (
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
                <p className="text-center">No items in this auction</p>
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
                        <span className="bidder-name">{bid.bidderName || 'Anonymous'}</span>
                        {bid.teamName && (
                          <span className="team-name">{bid.teamName}</span>
                        )}
                      </div>
                      <span className="bid-amount">{formatCurrency(bid.bidAmount || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Items List Sidebar */}
          <div className="items-sidebar">
            <div className="items-list card">
              <h3>All Items ({items.length})</h3>
              <div className="items-scroll">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`item-card ${currentItem?.id === item.id ? 'active' : ''}`}
                    onClick={() => selectItem(item)}
                  >
                    <h4>{item.name}</h4>
                    <div className="item-price">
                      {formatCurrency(item.currentBid || item.basePrice || 0)}
                    </div>
                    <span className={`item-status ${item.status}`}>
                      {item.status}
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