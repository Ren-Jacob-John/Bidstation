import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import "./Dashboard.css";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeAuctions: 0,
    totalBids: 0,
    completedAuctions: 0,
    avgRating: 0,
    totalAuctions: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  // Role-based content rendering
  const renderRoleSpecificContent = () => {
    const role = user?.role || 'user';

    switch (role) {
      case 'seller':
        return <SellerDashboard stats={stats} />;
      case 'admin':
        return <AdminDashboard stats={stats} />;
      case 'moderator':
        return <ModeratorDashboard stats={stats} />;
      default:
        return <UserDashboard stats={stats} />;
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-spinner">Loading dashboard...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container">
        {renderRoleSpecificContent()}
      </div>
      <Footer />
    </div>
  );
}

// Role-specific Dashboard Components
function UserDashboard({ stats }) {
  const { user } = useAuth();

  return (
    <>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Welcome back, {user?.fullName || 'User'}!</h1>
        <p className="dashboard-subtitle">Here's an overview of your auction activity</p>
      </div>

      <div className="dashboard-grid">
        <Card
          title="Active Auctions"
          value={stats.activeAuctions}
          color="red"
          link="/join"
          linkText="Browse Auctions"
        />
        <Card
          title="Total Bids"
          value={stats.totalBids}
          color="yellow"
          link="/dashboard"
          linkText="View History"
        />
        <Card
          title="Auctions Won"
          value={stats.completedAuctions}
          color="blue"
          link="/dashboard"
          linkText="View History"
        />
        <Card
          title="Average Rating"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}
          color="green"
          showStar={true}
        />
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <Link to="/join" className="action-btn primary">
              Join Auction
            </Link>
            <Link to="/create" className="action-btn secondary">
              Create Auction
            </Link>
          </div>
        </div>

        <div className="action-card sports-auction-card">
          <h3>🏆 Sports Player Auction</h3>
          <p className="action-description">Create and manage live sports player auctions with random player selection</p>
          <div className="action-buttons">
            <Link to="/sports-auction/setup" className="action-btn sports-btn">
              Create Sports Auction
            </Link>
            <Link to="/sports-auction/live" className="action-btn secondary">
              Join Live Auction
            </Link>
          </div>
        </div>

        <div className="stats-summary">
          <h3>Your Statistics</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Total Auctions Created:</span>
              <span className="stat-value">{stats.totalAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Auctions:</span>
              <span className="stat-value">{stats.activeAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Bids Placed:</span>
              <span className="stat-value">{stats.totalBids}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Auctions Won:</span>
              <span className="stat-value">{stats.completedAuctions}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SellerDashboard({ stats }) {
  const { user } = useAuth();

  return (
    <>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Seller Dashboard</h1>
        <p className="dashboard-subtitle">Manage your auctions and track performance</p>
      </div>

      <div className="dashboard-grid">
        <Card
          title="Active Auctions"
          value={stats.activeAuctions}
          color="red"
          link="/create"
          linkText="Create New"
        />
        <Card
          title="Total Auctions"
          value={stats.totalAuctions}
          color="blue"
          link="/dashboard"
          linkText="View All"
        />
        <Card
          title="Auctions Sold"
          value={stats.completedAuctions}
          color="green"
          link="/dashboard"
          linkText="View Sales"
        />
        <Card
          title="Average Rating"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : 'N/A'}
          color="yellow"
          showStar={true}
        />
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Seller Actions</h3>
          <div className="action-buttons">
            <Link to="/create" className="action-btn primary">
              Create Auction
            </Link>
            <Link to="/dashboard" className="action-btn secondary">
              Manage Auctions
            </Link>
          </div>
        </div>

        <div className="stats-summary">
          <h3>Seller Statistics</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Total Auctions Created:</span>
              <span className="stat-value">{stats.totalAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Auctions:</span>
              <span className="stat-value">{stats.activeAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Auctions Completed:</span>
              <span className="stat-value">{stats.completedAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Seller Rating:</span>
              <span className="stat-value">
                {stats.avgRating ? `${stats.avgRating.toFixed(1)} ⭐` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AdminDashboard({ stats }) {
  const { user } = useAuth();

  return (
    <>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">Platform overview and management tools</p>
      </div>

      <div className="dashboard-grid">
        <Card
          title="Total Users"
          value="1,234"
          color="blue"
          link="/admin/users"
          linkText="Manage Users"
        />
        <Card
          title="Active Auctions"
          value={stats.activeAuctions}
          color="red"
          link="/admin/auctions"
          linkText="Manage Auctions"
        />
        <Card
          title="Pending Reports"
          value="12"
          color="yellow"
          link="/admin/reports"
          linkText="Review Reports"
        />
        <Card
          title="Platform Revenue"
          value="$45,678"
          color="green"
          link="/admin/finance"
          linkText="View Reports"
        />
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Admin Actions</h3>
          <div className="action-buttons">
            <Link to="/admin/users" className="action-btn primary">
              User Management
            </Link>
            <Link to="/admin/auctions" className="action-btn secondary">
              Auction Oversight
            </Link>
            <Link to="/admin/reports" className="action-btn secondary">
              Review Reports
            </Link>
          </div>
        </div>

        <div className="stats-summary">
          <h3>Platform Statistics</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">1,234</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Auctions:</span>
              <span className="stat-value">{stats.activeAuctions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Transactions:</span>
              <span className="stat-value">5,678</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Platform Revenue:</span>
              <span className="stat-value">$45,678</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ModeratorDashboard({ stats }) {
  const { user } = useAuth();

  return (
    <>
      <div className="dashboard-header">
        <h1 className="dashboard-title">Moderator Dashboard</h1>
        <p className="dashboard-subtitle">Monitor and moderate platform activity</p>
      </div>

      <div className="dashboard-grid">
        <Card
          title="Pending Reports"
          value="8"
          color="red"
          link="/moderator/reports"
          linkText="Review Now"
        />
        <Card
          title="Flagged Auctions"
          value="3"
          color="yellow"
          link="/moderator/auctions"
          linkText="Review Auctions"
        />
        <Card
          title="Active Auctions"
          value={stats.activeAuctions}
          color="blue"
          link="/moderator/monitor"
          linkText="Monitor Live"
        />
        <Card
          title="Resolved Issues"
          value="156"
          color="green"
          link="/moderator/history"
          linkText="View History"
        />
      </div>

      <div className="dashboard-actions">
        <div className="action-card">
          <h3>Moderation Actions</h3>
          <div className="action-buttons">
            <Link to="/moderator/reports" className="action-btn primary">
              Review Reports
            </Link>
            <Link to="/moderator/auctions" className="action-btn secondary">
              Moderate Auctions
            </Link>
            <Link to="/moderator/users" className="action-btn secondary">
              User Oversight
            </Link>
          </div>
        </div>

        <div className="stats-summary">
          <h3>Moderation Statistics</h3>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Reports Reviewed:</span>
              <span className="stat-value">156</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Auctions Moderated:</span>
              <span className="stat-value">89</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Users Warned:</span>
              <span className="stat-value">23</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Active Investigations:</span>
              <span className="stat-value">5</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Card({ title, value, color, link, linkText, showStar = false }) {
  const colorMap = {
    red: "card-red",
    yellow: "card-yellow",
    blue: "card-blue",
    green: "card-green",
  };

  const cardContent = (
    <div className="card">
      <p className="card-title">{title}</p>
      <h2 className={`card-value ${colorMap[color]}`}>
        {showStar && value !== 'N/A' && <span className="star-icon">⭐</span>}
        {value}
      </h2>
      {link && linkText && (
        <p className="card-link">{linkText} →</p>
      )}
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="card-link-wrapper">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
