import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionService } from '../services/auctionService';
import './CreateAuction.css';

const CreateAuction = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    auctionType: 'ipl_player',
    startTime: '',
    endTime: '',
    teams: []
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.auctionType === 'ipl_player' && formData.teams.length === 0) {
      setError('Please add at least one team for IPL auction');
      return;
    }

    setLoading(true);

    try {
      const response = await auctionService.createAuction(formData);
      navigate(`/auction/${response.auctionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.description || !formData.auctionType) {
        setError('Please fill in all required fields');
        return;
      }
    }
    setError('');
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
                    placeholder="e.g., IPL 2024 Mega Auction"
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
                    <option value="ipl_player">🏏 IPL Player Auction</option>
                    <option value="item">🛍️ Item Auction</option>
                  </select>
                </div>

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

                {formData.auctionType === 'ipl_player' && (
                  <div className="form-group">
                    <label>Teams</label>
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

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="form-step">
                <h2>Review & Create</h2>
                
                <div className="review-section">
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
                      {formData.auctionType === 'ipl_player' ? '🏏 IPL Player' : '🛍️ Item'} Auction
                    </span>
                  </div>
                  
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
                  
                  {formData.auctionType === 'ipl_player' && formData.teams.length > 0 && (
                    <div className="review-item">
                      <span className="review-label">Teams:</span>
                      <span className="review-value">{formData.teams.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="button" onClick={prevStep} className="btn">
                    ← Previous
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Auction'}
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
