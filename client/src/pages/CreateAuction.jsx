import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAuction, addPlayerToAuction } from '../services/auctionService';
import './CreateAuction.css';

const CreateAuction = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport: 'IPL',
    startDate: '',
    endDate: '',
    totalBudget: '',
    minIncrement: 100000,
    maxPlayers: 100,
    rules: ''
  });
  
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: '',
    role: '',
    basePrice: '',
    nationality: '',
    imageUrl: '',
    stats: {}
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

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

      // Step 1: Create the auction
      console.log('Creating auction with data:', formData);
      
      const auctionData = {
        title: formData.title,
        description: formData.description,
        sport: formData.sport,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalBudget: parseFloat(formData.totalBudget) || 0,
        minIncrement: parseFloat(formData.minIncrement) || 100000,
        maxPlayers: parseInt(formData.maxPlayers) || 100,
        rules: formData.rules,
        players: [] // We'll add players separately
      };

      const auction = await createAuction(auctionData);
      const auctionId = auction.id;
      
      console.log('Auction created with ID:', auctionId);

      // Step 2: Add all players to the auction
      if (players.length > 0) {
        console.log(`Adding ${players.length} players to auction...`);
        
        for (const player of players) {
          const playerData = {
            name: player.name,
            sport: formData.sport,
            role: player.role || 'Player',
            basePrice: parseFloat(player.basePrice),
            nationality: player.nationality || 'Unknown',
            imageUrl: player.imageUrl || '',
            stats: player.stats || {}
          };

          console.log('Adding player:', playerData);
          await addPlayerToAuction(auctionId, playerData);
        }
        
        console.log('All players added successfully');
      }

      // Navigate to the auction details page
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
      if (!formData.title || !formData.description || !formData.sport) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please set start and end dates');
        return;
      }
      
      if (!formData.totalBudget || parseFloat(formData.totalBudget) <= 0) {
        setError('Please enter a valid total budget');
        return;
      }
      
      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate >= endDate) {
        setError('End date must be after start date');
        return;
      }
    }
    
    if (step === 3 && players.length === 0) {
      const confirmSkip = window.confirm(
        'You haven\'t added any players yet. You can add them later from the auction details page. Continue?'
      );
      if (!confirmSkip) return;
    }
    
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  const getSportRoles = (sport) => {
    const roles = {
      IPL: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
      PKL: ['Raider', 'Defender', 'All-Rounder'],
      ISL: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      HIL: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
      PBL: ['Singles', 'Doubles', 'Mixed Doubles'],
      UTT: ['Singles', 'Doubles'],
      PVL: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero'],
      IBL: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
      PWL: ['Freestyle', 'Greco-Roman', 'Women\'s Wrestling'],
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
              <span>Add Players</span>
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
                  <label htmlFor="title">Auction Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., IPL 2025 Mega Auction"
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

                <div className="form-group">
                  <label htmlFor="sport">Sport Type *</label>
                  <select
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleChange}
                    required
                  >
                    <option value="IPL">🏏 IPL - Indian Premier League</option>
                    <option value="PKL">🤼 PKL - Pro Kabaddi League</option>
                    <option value="ISL">⚽ ISL - Indian Super League</option>
                    <option value="HIL">🏑 HIL - Hockey India League</option>
                    <option value="PBL">🏸 PBL - Premier Badminton League</option>
                    <option value="UTT">🏓 UTT - Ultimate Table Tennis</option>
                    <option value="PVL">🏐 PVL - Pro Volleyball League</option>
                    <option value="IBL">🏀 IBL - Indian Basketball League</option>
                    <option value="PWL">🤼‍♂️ PWL - Pro Wrestling League</option>
                  </select>
                </div>

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
                <h2>Budget & Rules</h2>

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
                    required
                  />
                  <p className="helper-text">
                    {formData.totalBudget && `₹${(parseFloat(formData.totalBudget) / 10000000).toFixed(1)} Crores`}
                  </p>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="minIncrement">Minimum Bid Increment (₹)</label>
                    <input
                      type="number"
                      id="minIncrement"
                      name="minIncrement"
                      value={formData.minIncrement}
                      onChange={handleChange}
                      placeholder="e.g., 100000"
                      min="1000"
                      step="10000"
                    />
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
                  <button type="button" onClick={prevStep} className="btn">
                    ← Previous
                  </button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Add Players */}
            {step === 3 && (
              <div className="form-step">
                <h2>Add Players</h2>
                <p className="step-description">
                  Add players to your auction now, or you can add them later.
                </p>

                {/* Add Player Form */}
                <div className="add-player-form">
                  <h3>Add New Player</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Player Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={currentPlayer.name}
                        onChange={handlePlayerChange}
                        placeholder="e.g., Virat Kohli"
                      />
                    </div>

                    <div className="form-group">
                      <label>Base Price (₹) *</label>
                      <input
                        type="number"
                        name="basePrice"
                        value={currentPlayer.basePrice}
                        onChange={handlePlayerChange}
                        placeholder="e.g., 2000000"
                        min="0"
                        step="100000"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Role / Position</label>
                      <select
                        name="role"
                        value={currentPlayer.role}
                        onChange={handlePlayerChange}
                      >
                        <option value="">Select Role</option>
                        {getSportRoles(formData.sport).map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        name="nationality"
                        value={currentPlayer.nationality}
                        onChange={handlePlayerChange}
                        placeholder="e.g., India"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={currentPlayer.imageUrl}
                      onChange={handlePlayerChange}
                      placeholder="https://example.com/player.jpg"
                    />
                  </div>

                  <button type="button" onClick={addPlayer} className="btn btn-success">
                    ✓ Add Player
                  </button>
                </div>

                {/* Players List */}
                {players.length > 0 && (
                  <div className="players-list">
                    <h3>Added Players ({players.length})</h3>
                    <div className="players-grid">
                      {players.map((player) => (
                        <div key={player.id} className="player-card">
                          <div className="player-header">
                            <h4>{player.name}</h4>
                            <div className="player-actions">
                              <button
                                type="button"
                                onClick={() => editPlayer(player)}
                                className="btn-icon"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => removePlayer(player.id)}
                                className="btn-icon"
                                title="Remove"
                              >
                                🗑️
                              </button>
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
                  <button type="button" onClick={prevStep} className="btn">
                    ← Previous
                  </button>
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Next Step →
                  </button>
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
                    <span className="review-label">Title:</span>
                    <span className="review-value">{formData.title}</span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">Sport:</span>
                    <span className="review-value">{formData.sport}</span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">Start Date:</span>
                    <span className="review-value">
                      {new Date(formData.startDate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">End Date:</span>
                    <span className="review-value">
                      {new Date(formData.endDate).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">Total Budget:</span>
                    <span className="review-value">
                      ₹{(parseFloat(formData.totalBudget) / 10000000).toFixed(1)} Crores
                    </span>
                  </div>

                  {players.length > 0 && (
                    <div className="review-item">
                      <span className="review-label">Players:</span>
                      <span className="review-value">{players.length} added</span>
                    </div>
                  )}
                </div>

                {players.length > 0 && (
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

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">
                    ← Previous
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
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