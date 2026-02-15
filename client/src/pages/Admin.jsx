import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();

  return (
    <div className="admin-page">
      <div className="container">
        <header className="admin-header">
          <h1>Admin Dashboard</h1>
          <p className="admin-welcome">Welcome, {user?.username || user?.email}</p>
        </header>

        <section className="admin-section">
          <h2>Quick links</h2>
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

        <p className="admin-note">
          Admin-only features (e.g. user management, site settings) can be added here.
        </p>
      </div>
    </div>
  );
};

export default Admin;
