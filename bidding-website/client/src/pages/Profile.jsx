import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.put('/auth/update-profile', formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      // Refresh user data
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleBadgeClass = (role) => {
    const badges = {
      admin: 'role-badge-admin',
      auctioneer: 'role-badge-auctioneer',
      bidder: 'role-badge-bidder'
    };
    return badges[role] || 'role-badge-bidder';
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <h1>My Profile</h1>

          {/* Profile Card */}
          <div className="profile-card card">
            <div className="profile-header">
              <div className="profile-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h2>{user?.username}</h2>
                <p>{user?.email}</p>
                <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {/* Edit Profile Form */}
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <h3>Edit Profile</h3>
                
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-actions">
                <button onClick={() => setIsEditing(true)} className="btn btn-primary">
                  ✏️ Edit Profile
                </button>
                <button 
                  onClick={() => setShowPasswordForm(!showPasswordForm)} 
                  className="btn"
                >
                  🔒 Change Password
                </button>
              </div>
            )}

            {/* Change Password Form */}
            {showPasswordForm && !isEditing && (
              <form onSubmit={handleUpdatePassword} className="password-form">
                <h3>Change Password</h3>

                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordForm(false)} 
                    className="btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Account Actions */}
          <div className="account-actions card">
            <h3>Account Actions</h3>
            <div className="actions-list">
              <button onClick={handleLogout} className="action-btn logout-btn">
                🚪 Logout
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    // Implement account deletion
                    alert('Account deletion feature coming soon!');
                  }
                }} 
                className="action-btn delete-btn"
              >
                🗑️ Delete Account
              </button>
            </div>
          </div>

          {/* Statistics */}
          <div className="profile-stats card">
            <h3>Your Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-icon">📅</span>
                <div className="stat-content">
                  <span className="stat-label">Member Since</span>
                  <span className="stat-value">
                    {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {user?.role === 'auctioneer' && (
                <div className="stat-item">
                  <span className="stat-icon">🎯</span>
                  <div className="stat-content">
                    <span className="stat-label">Auctions Created</span>
                    <span className="stat-value">-</span>
                  </div>
                </div>
              )}

              {user?.role === 'bidder' && (
                <div className="stat-item">
                  <span className="stat-icon">💰</span>
                  <div className="stat-content">
                    <span className="stat-label">Total Bids</span>
                    <span className="stat-value">-</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
