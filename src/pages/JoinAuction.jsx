import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./JoinAuction.css";

export default function JoinAuction() {
  return (
    <div className="join-page">
      <Navbar />

      <div className="join-container">
        <div className="join-card">
          <h2 className="join-title">Join Auction</h2>

          <input
            type="text"
            className="join-input"
            placeholder="Enter Auction Code"
          />

          <button className="join-btn">
            Join
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
