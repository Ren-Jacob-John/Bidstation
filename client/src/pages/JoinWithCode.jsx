import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import auctionService from '../services/auctionService';
import './JoinWithCode.css';

const JoinWithCode = () => {
  const [code, setCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [requiresTeamName, setRequiresTeamName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resolvedAuction, setResolvedAuction] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Require login before any sports auction join (join codes are sports-only)
    if (!user) {
      setError('Please login before joining a sports auction.');
      return;
    }

    setLoading(true);
    try {
      let auction = resolvedAuction;
      if (!auction) {
        auction = await auctionService.getAuctionByJoinCode(code);
        setResolvedAuction(auction);
        if (auction.auction_type === 'sports_player') {
          setRequiresTeamName(true);
        }
      }

      // For sports auctions, require team registration before joining
      if (auction.auction_type === 'sports_player') {
        setRequiresTeamName(true);
        const trimmedTeam = teamName.trim();
        if (!trimmedTeam) {
          throw new Error('Team name is required to join this sports auction.');
        }

        try {
          await auctionService.registerTeamForSportsAuction(auction.id, trimmedTeam);
        } catch (err) {
          // Surface friendly validation messages
          if (err.message === 'Team name already taken.' || err.message === 'You are already representing a team in this auction.') {
            throw err;
          }
          throw new Error(err.message || 'Failed to register team for this auction.');
        }
      }

      if (auction.status === 'live') {
        navigate(`/auction/live/${auction.id}`);
      } else {
        navigate(`/auction/${auction.id}`);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-with-code-page">
      <div className="container">
        <div className="join-with-code-card card">
          <div className="join-with-code-header">
            <span className="join-with-code-icon">⚽</span>
            <h1>Join Sports Auction</h1>
            <p>Enter the code shared by the auction host to join their sports auction.</p>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="join-with-code-form">
            <div className="form-group">
              <label htmlFor="join-code">Auction code</label>
              <input
                id="join-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
                placeholder="e.g. ABCD2345"
                maxLength={12}
                className="join-code-input"
                autoComplete="off"
                required
              />
            </div>
            {requiresTeamName && (
              <div className="form-group">
                <label htmlFor="team-name">Team / Franchise Name</label>
                <input
                  id="team-name"
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  required
                />
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !code.trim()}
            >
              {loading ? 'Joining…' : 'Join auction'}
            </button>
          </form>

          <div className="join-with-code-footer">
            <Link to="/auctions">Browse all auctions</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinWithCode;
