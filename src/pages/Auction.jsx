import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Auction.css";

export default function Auction() {
  return (
    <div className="auction-page">
      <Navbar />

      <div className="auction-container">
        <div className="auction-card">
          <h2 className="auction-title">Auction Details</h2>

          <div className="auction-details">
            <p><strong>Auction Name:</strong> Sample Auction</p>
            <p><strong>Description:</strong> This is a sample auction for demonstration.</p>
            <p><strong>Starting Price:</strong> $50</p>
            <p><strong>Current Highest Bid:</strong> $120</p>
            <p><strong>Time Remaining:</strong> 2 hours 30 minutes</p>
          </div>

          <input
            type="number"
            className="auction-input"
            placeholder="Enter your bid amount"
          />

          <button className="auction-btn">
            Place Bid
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}