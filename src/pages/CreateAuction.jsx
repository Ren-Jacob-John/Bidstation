import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./CreateAuction.css";
import Footer from "../components/Footer";

export default function CreateAuction() {
  const navigate = useNavigate();

  const handleCreateAuction = () => {
    // Here you can add logic to create the auction
    navigate("/auction");
  };

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

          <button className="create-btn" onClick={handleCreateAuction}>
            Create Auction
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}