import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import auctionService from '../services/auctionService';
import './CreateAuction.css';

const CreateAuction = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    auctionType: 'sports_player',
    sportType: 'Cricket',
    startTime: '',
    endTime: '',
    teams: []
  });
  
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState({
    name: '',
    description: '',
    basePrice: '',
    imageUrl: '',
    position: '',
    age: '',
    nationality: ''
  });
  
  const [teamInput, setTeamInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

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

  const addTeam = () => {
    if (teamInput.trim() && !formData.teams.includes(teamInput.trim())) {
      setFormData({
        ...formData,
        teams: [...formData.teams, teamInput.trim()]
      });
      setTeamInput('');
    }
  };

  const removeTeam = (teamToRemove) => {
    setFormData({
      ...formData,
      teams: formData.teams.filter(team => team !== teamToRemove)
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
      description: '',
      basePrice: '',
      imageUrl: '',
      position: '',
      age: '',
      nationality: ''
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
      // Step 1: Create the auction
      console.log('Creating auction with data:', formData);
      const auctionResponse = await auctionService.createAuction({
        title: formData.title,
        description: formData.description,
        sport: formData.sportType,
        auctionType: formData.auctionType,
        teams: formData.teams,
        startDate: formData.startTime,
        endDate: formData.endTime
      });
      const auctionId = auctionResponse.id;
      
      console.log('Auction created with ID:', auctionId);

      // Step 2: Add all players to the auction
      if (players.length > 0) {
        console.log(`Adding ${players.length} players to auction...`);
        
        for (const player of players) {
          const playerData = {
            name: player.name,
            description: player.description || '',
            basePrice: parseFloat(player.basePrice),
            role: player.position || '',
            age: player.age ? parseInt(player.age) : null,
            nationality: player.nationality || ''
          };

          console.log('Adding player:', playerData);
          await auctionService.addPlayerToAuction(auctionId, playerData);
        }
        
        console.log('All players added successfully');
      }

      // Navigate to the auction details page
      navigate(`/auction/${auctionId}`);
      
    } catch (err) {
      console.error('Error creating auction:', err);
      setError(err.response?.data?.message || 'Failed to create auction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.auctionType) {
        setError('Please fill in all required fields');
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.startTime || !formData.endTime) {
        setError('Please set start and end times');
        return;
      }
      
      if (formData.auctionType === 'sports_player' && formData.teams.length === 0) {
        setError('Please add at least one team for sports player auction');
        return;
      }
      
      // Validate dates
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);
      
      if (startDate >= endDate) {
        setError('End time must be after start time');
        return;
      }
    }
    
    if (step === 3 && formData.auctionType === 'sports_player' && players.length === 0) {
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
              <span>Details</span>
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
                    placeholder="e.g., Cricket Premier League 2026 Auction"
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
                  <label htmlFor="auctionType">Auction Type *</label>
                  <select
                    id="auctionType"
                    name="auctionType"
                    value={formData.auctionType}
                    onChange={handleChange}
                    required
                  >
                    <option value="sports_player">⚽ Sports Player Auction</option>
                    <option value="item">🛍️ Item Auction</option>
                  </select>
                </div>

                {formData.auctionType === 'sports_player' && (
                  <div className="form-group">
                    <label htmlFor="sportType">Sport Type *</label>
                    <select
                      id="sportType"
                      name="sportType"
                      value={formData.sportType}
                      onChange={handleChange}
                      required
                    >
                      <option value="Cricket">🏏 Cricket</option>
                      <option value="Football">⚽ Football</option>
                      <option value="Basketball">🏀 Basketball</option>
                      <option value="Tennis">🎾 Tennis</option>
                      <option value="Hockey">🏑 Hockey</option>
                      <option value="Volleyball">🏐 Volleyball</option>
                      <option value="Baseball">⚾ Baseball</option>
                      <option value="Badminton">🏸 Badminton</option>
                      <option value="Other">🏅 Other</option>
                    </select>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={nextStep} className="btn btn-primary">
                    Next Step →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Auction Details */}
            {step === 2 && (
              <div className="form-step">
                <h2>Auction Details</h2>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startTime">Start Time *</label>
                    <input
                      type="datetime-local"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="endTime">End Time *</label>
                    <input
                      type="datetime-local"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {formData.auctionType === 'sports_player' && (
                  <div className="form-group">
                    <label>Teams / Franchises *</label>
                    <div className="team-input-group">
                      <input
                        type="text"
                        value={teamInput}
                        onChange={(e) => setTeamInput(e.target.value)}
                        placeholder="Enter team name"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTeam())}
                      />
                      <button type="button" onClick={addTeam} className="btn">
                        Add Team
                      </button>
                    </div>
                    
                    {formData.teams.length > 0 && (
                      <div className="teams-list">
                        {formData.teams.map((team, index) => (
                          <div key={index} className="team-chip">
                            <span>{team}</span>
                            <button
                              type="button"
                              onClick={() => removeTeam(team)}
                              className="remove-btn"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

            {/* Step 3: Add Players */}
            {step === 3 && (
              <div className="form-step">
                <h2>Add {formData.auctionType === 'sports_player' ? 'Players' : 'Items'}</h2>
                <p className="step-description">
                  Add {formData.auctionType === 'sports_player' ? 'players' : 'items'} to your auction now, or you can add them later.
                </p>

                {/* Add Player Form */}
                <div className="add-player-form">
                  <h3>Add New {formData.auctionType === 'sports_player' ? 'Player' : 'Item'}</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={currentPlayer.name}
                        onChange={handlePlayerChange}
                        placeholder={formData.auctionType === 'sports_player' ? 'Player name' : 'Item name'}
                      />
                    </div>

                    <div className="form-group">
                      <label>Base Price * ($)</label>
                      <input
                        type="number"
                        name="basePrice"
                        value={currentPlayer.basePrice}
                        onChange={handlePlayerChange}
                        placeholder="e.g., 100000"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  {formData.auctionType === 'sports_player' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Position / Role</label>
                        <input
                          type="text"
                          name="position"
                          value={currentPlayer.position}
                          onChange={handlePlayerChange}
                          placeholder="e.g., Forward, Batsman, Point Guard"
                        />
                      </div>

                      <div className="form-group">
                        <label>Age</label>
                        <input
                          type="number"
                          name="age"
                          value={currentPlayer.age}
                          onChange={handlePlayerChange}
                          placeholder="Age"
                          min="15"
                          max="50"
                        />
                      </div>

                      <div className="form-group">
                        <label>Nationality</label>
                        <input
                          type="text"
                          name="nationality"
                          value={currentPlayer.nationality}
                          onChange={handlePlayerChange}
                          placeholder="Country"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={currentPlayer.description}
                      onChange={handlePlayerChange}
                      placeholder="Add details..."
                      rows="2"
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Image URL</label>
                    <input
                      type="url"
                      name="imageUrl"
                      value={currentPlayer.imageUrl}
                      onChange={handlePlayerChange}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <button type="button" onClick={addPlayer} className="btn btn-success">
                    ✓ Add {formData.auctionType === 'sports_player' ? 'Player' : 'Item'}
                  </button>
                </div>

                {/* Players List */}
                {players.length > 0 && (
                  <div className="players-list">
                    <h3>Added {formData.auctionType === 'sports_player' ? 'Players' : 'Items'} ({players.length})</h3>
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
                            <p><strong>Base Price:</strong> ${parseFloat(player.basePrice).toLocaleString()}</p>
                            {player.position && <p><strong>Position:</strong> {player.position}</p>}
                            {player.age && <p><strong>Age:</strong> {player.age}</p>}
                            {player.nationality && <p><strong>Nationality:</strong> {player.nationality}</p>}
                            {player.description && <p className="player-desc">{player.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {players.length === 0 && (
                  <div className="empty-state">
                    <p>No {formData.auctionType === 'sports_player' ? 'players' : 'items'} added yet.</p>
                    <p className="text-muted">You can skip this step and add them later from the auction details page.</p>
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
                    <span className="review-label">Description:</span>
                    <span className="review-value">{formData.description}</span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">Type:</span>
                    <span className="review-value">
                      {formData.auctionType === 'sports_player' ? '⚽ Sports Player' : '🛍️ Item'} Auction
                    </span>
                  </div>
                  
                  {formData.auctionType === 'sports_player' && (
                    <div className="review-item">
                      <span className="review-label">Sport:</span>
                      <span className="review-value">{formData.sportType}</span>
                    </div>
                  )}
                  
                  <div className="review-item">
                    <span className="review-label">Start Time:</span>
                    <span className="review-value">
                      {new Date(formData.startTime).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="review-item">
                    <span className="review-label">End Time:</span>
                    <span className="review-value">
                      {new Date(formData.endTime).toLocaleString()}
                    </span>
                  </div>
                  
                  {formData.auctionType === 'sports_player' && formData.teams.length > 0 && (
                    <div className="review-item">
                      <span className="review-label">Teams:</span>
                      <span className="review-value">{formData.teams.join(', ')}</span>
                    </div>
                  )}

                  {players.length > 0 && (
                    <div className="review-item">
                      <span className="review-label">{formData.auctionType === 'sports_player' ? 'Players' : 'Items'}:</span>
                      <span className="review-value">{players.length} added</span>
                    </div>
                  )}
                </div>

                {players.length > 0 && (
                  <div className="review-section">
                    <h3>{formData.auctionType === 'sports_player' ? 'Players' : 'Items'} Summary</h3>
                    <div className="review-players-list">
                      {players.map((player, index) => (
                        <div key={player.id} className="review-player-item">
                          <span className="player-number">{index + 1}.</span>
                          <span className="player-name">{player.name}</span>
                          <span className="player-price">${parseFloat(player.basePrice).toLocaleString()}</span>
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
                    {loading ? 'Creating Auction...' : 'Create Auction'}
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
