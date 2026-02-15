import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import auctionService from '../services/auctionService';
import './JoinWithCode.css';

const JoinWithCode = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const auction = await auctionService.getAuctionByJoinCode(code);
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
