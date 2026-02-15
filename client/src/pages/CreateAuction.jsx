import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction, addPlayerToAuction, addItemToAuction } from '../services/auctionService';
import './CreateAuction.css';

// Auction type: sports player or item (eBay-style categories)
const AUCTION_TYPES = [
  { value: 'sports_player', label: 'Sports Player Auction', icon: '🏏', desc: 'Cricket, Football, and more' },
  { value: 'item', label: 'Item Auction', icon: '🛍️', desc: 'Electronics, collectibles, fashion & more' },
];

// Sports only (no tournament/league names)
const SPORTS_LIST = [
  { value: 'Cricket', label: 'Cricket', icon: '🏏' },
  { value: 'Kabaddi', label: 'Kabaddi', icon: '🤼' },
  { value: 'Football', label: 'Football', icon: '⚽' },
  { value: 'Hockey', label: 'Hockey', icon: '🏑' },
  { value: 'Badminton', label: 'Badminton', icon: '🏸' },
  { value: 'Table Tennis', label: 'Table Tennis', icon: '🏓' },
  { value: 'Volleyball', label: 'Volleyball', icon: '🏐' },
  { value: 'Basketball', label: 'Basketball', icon: '🏀' },
  { value: 'Wrestling', label: 'Wrestling', icon: '🤼‍♂️' },
  { value: 'Tennis', label: 'Tennis', icon: '🎾' },
  { value: 'Boxing', label: 'Boxing', icon: '🥊' },
  { value: 'Athletics', label: 'Athletics', icon: '🏃' },
  { value: 'Esports', label: 'Esports', icon: '🎮' },
];

const ITEM_CATEGORIES = [
  { value: 'Electronics', label: 'Electronics & Gadgets' },
  { value: 'Collectibles', label: 'Collectibles & Memorabilia' },
  { value: 'Fashion', label: 'Fashion & Accessories' },
  { value: 'HomeGarden', label: 'Home & Garden' },
  { value: 'SportsEquipment', label: 'Sports Equipment' },
  { value: 'Vehicles', label: 'Vehicles & Parts' },
  { value: 'ArtAntiques', label: 'Art & Antiques' },
  { value: 'BooksMedia', label: 'Books & Media' },
  { value: 'ToysHobby', label: 'Toys & Hobby' },
  { value: 'HealthBeauty', label: 'Health & Beauty' },
  { value: 'Other', label: 'Other' },
];

const ITEM_CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Refurbished'];

const CreateAuction = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    auctionType: 'sports_player',
    title: '',
    description: '',
    sport: 'Cricket',
    category: 'Electronics',
    teams: '',
    startDate: '',
    endDate: '',
    totalBudget: '',
    minIncrement: 100000,
    maxPlayers: 100,
    rules: ''
  });
  
  const [players, setPlayers] = useState([]);
  const [items, setItems] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: '',
    role: '',
    basePrice: '',
    nationality: '',
    imageUrl: '',
    stats: {}
  });
  const [currentItem, setCurrentItem] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: 'Electronics',
    condition: 'Good',
    imageUrl: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const isItemAuction = formData.auctionType === 'item';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePlayerChange = (e) => {
    setCurrentPlayer({
      ...currentPlayer,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (e) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };

  const addItem = () => {
    if (!currentItem.name || !currentItem.basePrice) {
      setError('Item name and base price are required');
      return;
    }
    if (isNaN(currentItem.basePrice) || parseFloat(currentItem.basePrice) <= 0) {
      setError('Base price must be a positive number');
      return;
    }
    setItems([...items, { ...currentItem, id: Date.now() }]);
    setCurrentItem({
      name: '',
      description: '',
      basePrice: '',
      category: formData.category,
      condition: 'Good',
      imageUrl: ''
    });
    setError('');
  };

  const removeItem = (itemId) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const editItem = (item) => {
    setCurrentItem(item);
    setItems(items.filter(i => i.id !== item.id));
  };

  const addPlayer = () => {
    if (!currentPlayer.name || !currentPlayer.basePrice) {
      setError('Player name and base price are required');
      return;
    }

    if (isNaN(currentPlayer.basePrice) || parseFloat(currentPlayer.basePrice) <= 0) {
      setError('Base price must be a positive number');
      return;
    }

    setPlayers([...players, { ...currentPlayer, id: Date.now() }]);
    setCurrentPlayer({
      name: '',
      role: '',
      basePrice: '',
      nationality: '',
      imageUrl: '',
      stats: {}
    });
    setError('');
  };

  const removePlayer = (playerId) => {
    setPlayers(players.filter(p => p.id !== playerId));
  };

  const editPlayer = (player) => {
    setCurrentPlayer(player);
    setPlayers(players.filter(p => p.id !== player.id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be logged in to create an auction');
      }

      const teamsArray = formData.auctionType === 'sports_player' && formData.teams
        ? formData.teams.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const auctionData = {
        title: formData.title,
        description: formData.description,
        auctionType: formData.auctionType,
        category: formData.auctionType === 'item' ? formData.category : formData.sport,
        sport: formData.auctionType === 'sports_player' ? formData.sport : undefined,
        teams: formData.auctionType === 'sports_player' ? JSON.stringify(teamsArray) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: parseFloat(formData.totalBudget) || 0,
        minIncrement: parseFloat(formData.minIncrement) || (formData.auctionType === 'item' ? 100 : 100000),
        maxPlayers: formData.auctionType === 'sports_player' ? (parseInt(formData.maxPlayers) || 100) : 0,
        rules: formData.rules,
        itemCount: formData.auctionType === 'item' ? items.length : 0,
      };

      const auction = await createAuction(auctionData);
      const auctionId = auction.id;

      if (formData.auctionType === 'sports_player' && players.length > 0) {
        for (const player of players) {
          await addPlayerToAuction(auctionId, {
            name: player.name,
            sport: formData.sport,
            role: player.role || 'Player',
            basePrice: parseFloat(player.basePrice),
            nationality: player.nationality || 'Unknown',
            imageUrl: player.imageUrl || '',
            stats: player.stats || {}
          });
        }
      }

      if (formData.auctionType === 'item' && items.length > 0) {
        for (const item of items) {
          await addItemToAuction(auctionId, {
            name: item.name,
            description: item.description || '',
            basePrice: parseFloat(item.basePrice),
            category: item.category || formData.category,
            condition: item.condition || 'Good',
            imageUrl: item.imageUrl || ''
          });
        }
      }

      navigate(`/auction/${auctionId}`);
    } catch (err) {
      console.error('Error creating auction:', err);
      setError(err.message || 'Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.title || !formData.description) {
        setError('Please fill in title and description');
        return;
      }
      if (formData.auctionType === 'sports_player' && !formData.sport) {
        setError('Please select a sport/league');
        return;
      }
      if (formData.auctionType === 'sports_player') {
        const teamsList = formData.teams.split(',').map(t => t.trim()).filter(Boolean);
        if (teamsList.length === 0) {
          setError('Please add at least one participating team (comma-separated)');
          return;
        }
      }
      if (formData.auctionType === 'item' && !formData.category) {
        setError('Please select an item category');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please set start and end dates');
        return;
      }
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        setError('End date must be after start date');
        return;
      }
      if (formData.auctionType === 'sports_player' && (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0)) {
        setError('Please enter a valid total budget for the squad');
        return;
      }
    }
    
    if (step === 3) {
      if (formData.auctionType === 'sports_player' && players.length === 0) {
        const confirmSkip = window.confirm('You haven\'t added any players yet. You can add them later. Continue?');
        if (!confirmSkip) return;
      }
      if (formData.auctionType === 'item' && items.length === 0) {
        const confirmSkip = window.confirm('You haven\'t added any items yet. You can add them later. Continue?');
        if (!confirmSkip) return;
      }
    }
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const getSportRoles = (sport) => {
    const roles = {
      Cricket: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
      Kabaddi: ['Raider', 'Defender', 'All-Rounder'],
      Football: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      Hockey: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      Badminton: ['Singles', 'Doubles', 'Mixed Doubles'],
      'Table Tennis': ['Singles', 'Doubles'],
      Volleyball: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero'],
      Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      Wrestling: ['Freestyle', 'Greco-Roman', 'Women\'s Wrestling'],
      Tennis: ['Singles', 'Doubles'],
      Boxing: ['Heavyweight', 'Light Heavyweight', 'Middleweight', 'Welterweight', 'Lightweight', 'Featherweight'],
      Athletics: ['Sprint', 'Middle Distance', 'Long Distance', 'Field'],
      Esports: ['Captain', 'Player', 'Substitute'],
    };
    return roles[sport] || ['Player'];
  };

  return (
    <div className="create-auction-page">
      <div className="container">
        <div className="create-auction-container">
          <h1>Create New Auction</h1>
          
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Basic Info</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Budget & Rules</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>{formData.auctionType === 'item' ? 'Add Items' : 'Add Players'}</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
              <div className="step-number">4</div>
              <span>Review</span>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auction-form card">
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="form-step">
                <h2>Basic Information</h2>

                <div className="form-group">
                  <label>Auction Type *</label>
                  <div className="auction-type-options">
                    {AUCTION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        className={`auction-type-btn ${formData.auctionType === type.value ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, auctionType: type.value })}
                      >
                        <span className="type-icon">{type.icon}</span>
                        <span className="type-label">{type.label}</span>
                        <span className="type-desc">{type.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Auction Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={isItemAuction ? 'e.g., Vintage Electronics Sale' : 'e.g., IPL 2025 Mega Auction'}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your auction..."
                    rows="4"
                    required
                  ></textarea>
                </div>

                {formData.auctionType === 'sports_player' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="sport">Sport *</label>
                      <select
                        id="sport"
                        name="sport"
                        value={formData.sport}
                        onChange={handleChange}
                        required
                      >
                        {SPORTS_LIST.map((s) => (
                          <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="teams">Participating teams / franchises *</label>
                      <input
                        type="text"
                        id="teams"
                        name="teams"
                        value={formData.teams}
                        onChange={handleChange}
                        placeholder="e.g. Team A, Team B, Team C (comma-separated)"
                      />
                      <p className="helper-text">Bidders will choose one of these when placing bids.</p>
                    </div>
                  </>
                )}

                {formData.auctionType === 'item' && (
                  <div className="form-group">
                    <label htmlFor="category">Item Category *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                    >
                      {ITEM_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Budget & Rules */}
            {step === 2 && (
              <div className="form-step">
                <h2>{isItemAuction ? 'Rules & Increments' : 'Budget & Rules'}</h2>

                {formData.auctionType === 'sports_player' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="totalBudget">Total Budget (₹) *</label>
                      <input
                        type="number"
                        id="totalBudget"
                        name="totalBudget"
                        value={formData.totalBudget}
                        onChange={handleChange}
                        placeholder="e.g., 100000000"
                        min="0"
                        step="1000000"
                      />
                      <p className="helper-text">
                        {formData.totalBudget && `₹${(parseFloat(formData.totalBudget) / 10000000).toFixed(1)} Crores`}
                      </p>
                    </div>
                    <div className="form-group">
                      <label htmlFor="maxPlayers">Maximum Players</label>
                      <input
                        type="number"
                        id="maxPlayers"
                        name="maxPlayers"
                        value={formData.maxPlayers}
                        onChange={handleChange}
                        placeholder="e.g., 100"
                        min="1"
                        max="500"
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label htmlFor="minIncrement">Minimum Bid Increment (₹)</label>
                  <input
                    type="number"
                    id="minIncrement"
                    name="minIncrement"
                    value={formData.minIncrement}
                    onChange={handleChange}
                    placeholder={isItemAuction ? 'e.g., 100' : 'e.g., 100000'}
                    min={isItemAuction ? 10 : 1000}
                    step={isItemAuction ? 10 : 10000}
                  />
                  {isItemAuction && (
                    <p className="helper-text">Smaller increments (e.g. ₹100) work well for item auctions.</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="rules">Additional Rules</label>
                  <textarea
                    id="rules"
                    name="rules"
                    value={formData.rules}
                    onChange={handleChange}
                    placeholder="Enter any special rules or conditions..."
                    rows="4"
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">← Previous</button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">Next Step →</button>
                </div>
              </div>
            )}

            {/* Step 3: Add Players or Items */}
            {step === 3 && formData.auctionType === 'sports_player' && (
              <div className="form-step">
                <h2>Add Players</h2>
                <p className="step-description">
                  Add players to your auction now, or you can add them later.
                </p>

                <div className="add-player-form">
                  <h3>Add New Player</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Player Name *</label>
                      <input type="text" name="name" value={currentPlayer.name} onChange={handlePlayerChange} placeholder="e.g., Virat Kohli" />
                    </div>
                    <div className="form-group">
                      <label>Base Price (₹) *</label>
                      <input type="number" name="basePrice" value={currentPlayer.basePrice} onChange={handlePlayerChange} placeholder="e.g., 2000000" min="0" step="100000" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Role / Position</label>
                      <select name="role" value={currentPlayer.role} onChange={handlePlayerChange}>
                        <option value="">Select Role</option>
                        {getSportRoles(formData.sport).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nationality</label>
                      <input type="text" name="nationality" value={currentPlayer.nationality} onChange={handlePlayerChange} placeholder="e.g., India" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input type="url" name="imageUrl" value={currentPlayer.imageUrl} onChange={handlePlayerChange} placeholder="https://example.com/player.jpg" />
                  </div>
                  <button type="button" onClick={addPlayer} className="btn btn-success">✓ Add Player</button>
                </div>

                {players.length > 0 && (
                  <div className="players-list">
                    <h3>Added Players ({players.length})</h3>
                    <div className="players-grid">
                      {players.map((player) => (
                        <div key={player.id} className="player-card">
                          <div className="player-header">
                            <h4>{player.name}</h4>
                            <div className="player-actions">
                              <button type="button" onClick={() => editPlayer(player)} className="btn-icon" title="Edit">✏️</button>
                              <button type="button" onClick={() => removePlayer(player.id)} className="btn-icon" title="Remove">🗑️</button>
                            </div>
                          </div>
                          <div className="player-details">
                            <p><strong>Base Price:</strong> ₹{parseFloat(player.basePrice).toLocaleString()}</p>
                            {player.role && <p><strong>Role:</strong> {player.role}</p>}
                            {player.nationality && <p><strong>Nationality:</strong> {player.nationality}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {players.length === 0 && (
                  <div className="empty-state">
                    <p>No players added yet.</p>
                    <p className="text-muted">You can skip this step and add them later.</p>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">← Previous</button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">Next Step →</button>
                </div>
              </div>
            )}

            {step === 3 && formData.auctionType === 'item' && (
              <div className="form-step">
                <h2>Add Items</h2>
                <p className="step-description">
                  Add items to your auction. Each item will have its own base price and condition.
                </p>

                <div className="add-player-form add-item-form">
                  <h3>Add New Item</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Item Name *</label>
                      <input type="text" name="name" value={currentItem.name} onChange={handleItemChange} placeholder="e.g., iPhone 14 Pro" />
                    </div>
                    <div className="form-group">
                      <label>Base Price (₹) *</label>
                      <input type="number" name="basePrice" value={currentItem.basePrice} onChange={handleItemChange} placeholder="e.g., 50000" min="0" step="100" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" value={currentItem.description} onChange={handleItemChange} placeholder="Brief description" rows="2" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select name="category" value={currentItem.category} onChange={handleItemChange}>
                        {ITEM_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Condition</label>
                      <select name="condition" value={currentItem.condition} onChange={handleItemChange}>
                        {ITEM_CONDITIONS.map((cond) => (
                          <option key={cond} value={cond}>{cond}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Image URL</label>
                    <input type="url" name="imageUrl" value={currentItem.imageUrl} onChange={handleItemChange} placeholder="https://example.com/image.jpg" />
                  </div>
                  <button type="button" onClick={addItem} className="btn btn-success">✓ Add Item</button>
                </div>

                {items.length > 0 && (
                  <div className="players-list">
                    <h3>Added Items ({items.length})</h3>
                    <div className="players-grid">
                      {items.map((item) => (
                        <div key={item.id} className="player-card">
                          <div className="player-header">
                            <h4>{item.name}</h4>
                            <div className="player-actions">
                              <button type="button" onClick={() => editItem(item)} className="btn-icon" title="Edit">✏️</button>
                              <button type="button" onClick={() => removeItem(item.id)} className="btn-icon" title="Remove">🗑️</button>
                            </div>
                          </div>
                          <div className="player-details">
                            <p><strong>Base Price:</strong> ₹{parseFloat(item.basePrice).toLocaleString()}</p>
                            {item.condition && <p><strong>Condition:</strong> {item.condition}</p>}
                            {item.category && <p><strong>Category:</strong> {ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <div className="empty-state">
                    <p>No items added yet.</p>
                    <p className="text-muted">You can skip this step and add them later.</p>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">← Previous</button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">Next Step →</button>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="form-step">
                <h2>Review & Create</h2>
                
                <div className="review-section">
                  <h3>Auction Details</h3>
                  <div className="review-item">
                    <span className="review-label">Type:</span>
                    <span className="review-value">{formData.auctionType === 'item' ? 'Item Auction' : 'Sports Player Auction'}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Title:</span>
                    <span className="review-value">{formData.title}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">{formData.auctionType === 'item' ? 'Category:' : 'Sport:'}</span>
                    <span className="review-value">
                      {formData.auctionType === 'item'
                        ? (ITEM_CATEGORIES.find(c => c.value === formData.category)?.label || formData.category)
                        : (SPORTS_LIST.find(s => s.value === formData.sport)?.label || formData.sport)}
                    </span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Start Date:</span>
                    <span className="review-value">{new Date(formData.startDate).toLocaleString()}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">End Date:</span>
                    <span className="review-value">{new Date(formData.endDate).toLocaleString()}</span>
                  </div>
                  {formData.auctionType === 'sports_player' && formData.totalBudget && (
                    <div className="review-item">
                      <span className="review-label">Total Budget:</span>
                      <span className="review-value">₹{(parseFloat(formData.totalBudget) / 10000000).toFixed(1)} Crores</span>
                    </div>
                  )}
                  <div className="review-item">
                    <span className="review-label">{formData.auctionType === 'item' ? 'Items:' : 'Players:'}</span>
                    <span className="review-value">{formData.auctionType === 'item' ? items.length : players.length} added</span>
                  </div>
                </div>

                {players.length > 0 && formData.auctionType === 'sports_player' && (
                  <div className="review-section">
                    <h3>Players Summary</h3>
                    <div className="review-players-list">
                      {players.map((player, index) => (
                        <div key={player.id} className="review-player-item">
                          <span className="player-number">{index + 1}.</span>
                          <span className="player-name">{player.name}</span>
                          <span className="player-price">₹{parseFloat(player.basePrice).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {items.length > 0 && formData.auctionType === 'item' && (
                  <div className="review-section">
                    <h3>Items Summary</h3>
                    <div className="review-players-list">
                      {items.map((item, index) => (
                        <div key={item.id} className="review-player-item">
                          <span className="player-number">{index + 1}.</span>
                          <span className="player-name">{item.name}</span>
                          <span className="player-price">₹{parseFloat(item.basePrice).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">← Previous</button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Creating Auction...' : '🚀 Create Auction'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;