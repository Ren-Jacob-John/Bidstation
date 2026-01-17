import React from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RoleCard from "../components/RoleCard";

import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      <Navbar />

      {/* ===== Hero Section ===== */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <h1 className="header-title">
              Secure <span className="highlight">Online Bidding</span> Platform
            </h1>

            <p className="header-subtitle">
              A role-based, real-time auction system designed for transparent,
              secure, and structured player and item bidding.
            </p>

            <div className="header-actions">
              <Link to="/join" className="btn btn-primary">
                Join Auction
              </Link>

              <Link to="/create" className="btn btn-secondary">
                Create Auction
              </Link>
              
              <Link to="/auction" className="btn btn-outline">
                View Live Auction
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Roles Section ===== */}
      <section className="roles">
        <h3 className="roles-title">User Roles</h3>

        <div className="roles-grid">
          <RoleCard
            title="Auction Controller"
            color="red"
            description="Create, monitor, and manage live auctions."
          />

          <RoleCard
            title="Bidder"
            color="yellow"
            description="Participate in auctions and place real-time bids."
          />

          <RoleCard
            title="Player"
            color="blue"
            description="Register and get listed for upcoming auctions."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
