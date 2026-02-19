import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getAllUsers, banUser, unbanUser } from '../services/authService';
import { getAllAuctions, deleteAuction } from '../services/auctionService';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, auctionsData] = await Promise.all([
        getAllUsers(),
        getAllAuctions(),
      ]);
      setUsers(usersData);
      setAuctions(auctionsData);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to ban ${username || 'this user'}?`)) {
      return;
    }

    try {
      await banUser(userId);
      setSuccess(`User ${username || userId} has been banned`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to ban user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUnbanUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to unban ${username || 'this user'}?`)) {
      return;
    }

    try {
      await unbanUser(userId);
      setSuccess(`User ${username || userId} has been unbanned`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to unban user');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteAuction = async (auctionId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteAuction(auctionId);
      setSuccess(`Auction "${title}" has been deleted`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete auction');
      setTimeout(() => setError(null), 3000);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <div className="container">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p className="admin-welcome">Welcome, {user?.username || user?.email}</p>
        </header>

        {error && (
          <div className="admin-alert admin-alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="admin-alert admin-alert-success">
            {success}
          </div>
        )}

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 User Management
          </button>
          <button
            className={`admin-tab ${activeTab === 'auctions' ? 'active' : ''}`}
            onClick={() => setActiveTab('auctions')}
          >
            🏛️ Auction Management
          </button>
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'users' && (
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2>User Management</h2>
                  <button onClick={loadData} className="admin-refresh-btn">
                    🔄 Refresh
                  </button>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="admin-empty">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.uid} className={u.banned ? 'admin-row-banned' : ''}>
                            <td>{u.username || 'N/A'}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${u.role}`}>
                                {u.role || 'bidder'}
                              </span>
                            </td>
                            <td>
                              {u.banned ? (
                                <span className="admin-badge admin-badge-banned">Banned</span>
                              ) : (
                                <span className="admin-badge admin-badge-active">Active</span>
                              )}
                            </td>
                            <td>{formatDate(u.createdAt)}</td>
                            <td>
                              {u.uid !== user?.uid && u.role !== 'admin' && (
                                <>
                                  {u.banned ? (
                                    <button
                                      onClick={() => handleUnbanUser(u.uid, u.username)}
                                      className="admin-btn admin-btn-unban"
                                    >
                                      Unban
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBanUser(u.uid, u.username)}
                                      className="admin-btn admin-btn-ban"
                                    >
                                      Ban
                                    </button>
                                  )}
                                </>
                              )}
                              {u.uid === user?.uid && (
                                <span className="admin-text-muted">You</span>
                              )}
                              {u.role === 'admin' && u.uid !== user?.uid && (
                                <span className="admin-text-muted">Admin</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'auctions' && (
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2>Auction Management</h2>
                  <button onClick={loadData} className="admin-refresh-btn">
                    🔄 Refresh
                  </button>
                </div>
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="admin-empty">
                            No auctions found
                          </td>
                        </tr>
                      ) : (
                        auctions.map((auction) => (
                          <tr key={auction.id}>
                            <td>{auction.title || 'Untitled Auction'}</td>
                            <td>
                              <span className={`admin-badge admin-badge-${auction.status || 'upcoming'}`}>
                                {auction.status || 'upcoming'}
                              </span>
                            </td>
                            <td>{auction.auctionType || auction.sport || 'item'}</td>
                            <td>{formatDate(auction.createdAt)}</td>
                            <td>
                              <div className="admin-actions">
                                <Link
                                  to={`/auction/${auction.id}`}
                                  className="admin-btn admin-btn-view"
                                >
                                  View
                                </Link>
                                <button
                                  onClick={() => handleDeleteAuction(auction.id, auction.title)}
                                  className="admin-btn admin-btn-delete"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

        <section className="admin-section">
          <h2>Quick Links</h2>
          <div className="admin-cards">
            <Link to="/auctions" className="admin-card card">
              <span className="admin-card-icon">📋</span>
              <h3>View all auctions</h3>
              <p>Browse and manage auctions</p>
            </Link>
            <Link to="/dashboard" className="admin-card card">
              <span className="admin-card-icon">🏠</span>
              <h3>User dashboard</h3>
              <p>Go to your user dashboard</p>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
