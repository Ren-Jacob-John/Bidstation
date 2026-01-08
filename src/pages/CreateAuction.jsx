import React from "react";
import Navbar from "../components/Navbar";
import "./CreateAuction.css";

export default function CreateAuction() {
  return (
    <div className="create-page">
      <Navbar />

      <div className="create-container">
        <div className="create-card">
          <h2 className="create-title">Create Auction</h2>

          <input
            type="text"
            className="create-input"
            placeholder="Auction Name"
          />

          <input
            type="date"
            className="create-input"
          />

          <input
            type="text"
            className="create-input"
            placeholder="Time Limit (e.g., 2 hours)"
          />

          <button className="create-btn">
            Create Auction
          </button>
        </div>
      </div>
    </div>
  );
}