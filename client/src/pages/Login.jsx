import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/authService';
import './Login.css';

const Login = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'admin' ? 'admin' : 'regular';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState(initialMode);
  
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      
      if (loginMode === 'admin') {
        // Check if user is admin
        const profile = await getCurrentUser();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          await logout();
          setError('Access denied. This area is for administrators only.');
        }
      } else {
        // Regular login - go to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminMode = loginMode === 'admin';

  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-container">
          <div className={`auth-card card ${isAdminMode ? 'admin-login-card' : ''}`}>
            <h1 className="auth-title">
              {isAdminMode ? 'Admin Login' : 'Welcome Back'}
            </h1>
            <p className="auth-subtitle">
              {isAdminMode 
                ? 'Sign in to access the admin dashboard' 
                : 'Login to continue bidding'}
            </p>

            {/* Login Mode Toggle */}
            <div className="login-mode-toggle">
              <button
                type="button"
                className={`toggle-btn ${!isAdminMode ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('regular');
                  setError('');
                }}
              >
                Regular User
              </button>
              <button
                type="button"
                className={`toggle-btn ${isAdminMode ? 'active' : ''}`}
                onClick={() => {
                  setLoginMode('admin');
                  setError('');
                }}
              >
                Admin
              </button>
            </div>

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isAdminMode ? "Admin email" : "Enter your email"}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
                {!isAdminMode && (
                  <p className="forgot-password-link">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </p>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading 
                  ? (isAdminMode ? 'Signing in...' : 'Logging in...') 
                  : (isAdminMode ? 'Sign in as Admin' : 'Login')}
              </button>
            </form>

            <div className="auth-footer">
              {isAdminMode ? (
                <p>
                  <Link to="/login">← Back to regular login</Link>
                </p>
              ) : (
                <p>Don't have an account? <Link to="/register">Register here</Link></p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
