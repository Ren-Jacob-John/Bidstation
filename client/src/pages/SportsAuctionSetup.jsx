import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./SportsAuctionSetup.css";

export default function SportsAuctionSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Auction settings
  const [auctionName, setAuctionName] = useState("");
  const [maxPlayersPerUser, setMaxPlayersPerUser] = useState(5);
  const [startingBudget, setStartingBudget] = useState(100000);
  const [bidTimeLimit, setBidTimeLimit] = useState(30);
  const [minBidIncrement, setMinBidIncrement] = useState(1000);
  
  // Players list
  const [players, setPlayers] = useState([]);
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    position: "",
    team: "",
    basePrice: 10000,
    imageUrl: "",
    stats: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const positions = [
    "Goalkeeper",
    "Defender",
    "Midfielder",
    "Forward",
    "All-Rounder",
    "Batsman",
    "Bowler",
    "Wicket-Keeper",
    "Point Guard",
    "Shooting Guard",
    "Small Forward",
    "Power Forward",
    "Center"
  ];

  const handlePlayerChange = (e) => {
    const { name, value } = e.target;
    setNewPlayer(prev => ({
      ...prev,
      [name]: name === "basePrice" ? Number(value) : value
    }));
  };

  const addPlayer = () => {
    if (!newPlayer.name.trim()) {
      toast.error("Player name is required");
      return;
    }
    if (!newPlayer.position) {
      toast.error("Player position is required");
      return;
    }
    if (newPlayer.basePrice <= 0) {
      toast.error("Base price must be greater than 0");
      return;
    }

    const playerWithId = {
      ...newPlayer,
      id: Date.now().toString(),
      status: "available"
    };

    setPlayers(prev => [...prev, playerWithId]);
    setNewPlayer({
      name: "",
      position: "",
      team: "",
      basePrice: 10000,
      imageUrl: "",
      stats: ""
    });
    toast.success(`${playerWithId.name} added to player pool`);
  };

  const removePlayer = (playerId) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
    toast.success("Player removed");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!auctionName.trim()) {
      newErrors.auctionName = "Auction name is required";
    }

    if (maxPlayersPerUser < 1) {
      newErrors.maxPlayersPerUser = "Must allow at least 1 player per user";
    }

    if (startingBudget < 1000) {
      newErrors.startingBudget = "Starting budget must be at least 1000";
    }

    if (bidTimeLimit < 10) {
      newErrors.bidTimeLimit = "Bid time must be at least 10 seconds";
    }

    if (players.length < 2) {
      newErrors.players = "Add at least 2 players to start an auction";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartAuction = () => {
    if (!validateForm()) {
      return;
    }

    // Store auction data in localStorage for the live auction page
    const auctionData = {
      id: Date.now().toString(),
      name: auctionName,
      maxPlayersPerUser,
      startingBudget,
      bidTimeLimit,
      minBidIncrement,
      players: players.map(p => ({ ...p, status: "available" })),
      participants: [],
      createdBy: user?.email || "admin",
      createdAt: new Date().toISOString(),
      status: "active"
    };

    localStorage.setItem("currentSportsAuction", JSON.stringify(auctionData));
    toast.success("Auction created! Redirecting to live auction...");
    navigate("/sports-auction/live");
  };

  const handleImportPlayers = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const lines = content.split("\n").filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes("name") ? 1 : 0;
        
        const importedPlayers = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(",").map(p => p.trim());
          if (parts.length >= 2) {
            importedPlayers.push({
              id: Date.now().toString() + i,
              name: parts[0],
              position: parts[1] || "Unknown",
              team: parts[2] || "",
              basePrice: Number(parts[3]) || 10000,
              imageUrl: parts[4] || "",
              stats: parts[5] || "",
              status: "available"
            });
          }
        }

        if (importedPlayers.length > 0) {
          setPlayers(prev => [...prev, ...importedPlayers]);
          toast.success(`Imported ${importedPlayers.length} players`);
        } else {
          toast.error("No valid players found in file");
        }
      } catch (error) {
        toast.error("Error parsing file. Please check the format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="sports-setup-page">
      <Navbar />

      <div className="sports-setup-container">
        <div className="sports-setup-card">
          <h2 className="sports-setup-title">🏆 Sports Player Auction Setup</h2>

          {/* Auction Settings Section */}
          <div className="setup-section">
            <h3 className="section-title">Auction Settings</h3>
            
            <div className="input-group">
              <label className="input-label">Auction Name</label>
              <input
                type="text"
                className={`setup-input ${errors.auctionName ? "input-error" : ""}`}
                placeholder="e.g., IPL 2024 Mini Auction"
                value={auctionName}
                onChange={(e) => setAuctionName(e.target.value)}
              />
              {errors.auctionName && <span className="error-text">{errors.auctionName}</span>}
            </div>

            <div className="settings-grid">
              <div className="input-group">
                <label className="input-label">Max Players Per User</label>
                <input
                  type="number"
                  className={`setup-input ${errors.maxPlayersPerUser ? "input-error" : ""}`}
                  value={maxPlayersPerUser}
                  onChange={(e) => setMaxPlayersPerUser(Number(e.target.value))}
                  min="1"
                  max="50"
                />
                {errors.maxPlayersPerUser && <span className="error-text">{errors.maxPlayersPerUser}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">Starting Budget ($)</label>
                <input
                  type="number"
                  className={`setup-input ${errors.startingBudget ? "input-error" : ""}`}
                  value={startingBudget}
                  onChange={(e) => setStartingBudget(Number(e.target.value))}
                  min="1000"
                  step="1000"
                />
                {errors.startingBudget && <span className="error-text">{errors.startingBudget}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">Bid Time Limit (seconds)</label>
                <input
                  type="number"
                  className={`setup-input ${errors.bidTimeLimit ? "input-error" : ""}`}
                  value={bidTimeLimit}
                  onChange={(e) => setBidTimeLimit(Number(e.target.value))}
                  min="10"
                  max="120"
                />
                {errors.bidTimeLimit && <span className="error-text">{errors.bidTimeLimit}</span>}
              </div>

              <div className="input-group">
                <label className="input-label">Min Bid Increment ($)</label>
                <input
                  type="number"
                  className="setup-input"
                  value={minBidIncrement}
                  onChange={(e) => setMinBidIncrement(Number(e.target.value))}
                  min="100"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Add Players Section */}
          <div className="setup-section">
            <h3 className="section-title">Add Players</h3>
            
            <div className="add-player-form">
              <div className="player-form-grid">
                <div className="input-group">
                  <label className="input-label">Player Name *</label>
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="e.g., Virat Kohli"
                    name="name"
                    value={newPlayer.name}
                    onChange={handlePlayerChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Position *</label>
                  <select
                    className="setup-input"
                    name="position"
                    value={newPlayer.position}
                    onChange={handlePlayerChange}
                  >
                    <option value="">Select Position</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Previous Team</label>
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="e.g., Royal Challengers"
                    name="team"
                    value={newPlayer.team}
                    onChange={handlePlayerChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Base Price ($) *</label>
                  <input
                    type="number"
                    className="setup-input"
                    name="basePrice"
                    value={newPlayer.basePrice}
                    onChange={handlePlayerChange}
                    min="1000"
                    step="1000"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Image URL</label>
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="https://..."
                    name="imageUrl"
                    value={newPlayer.imageUrl}
                    onChange={handlePlayerChange}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Stats/Info</label>
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="e.g., Avg: 52.3, SR: 138.5"
                    name="stats"
                    value={newPlayer.stats}
                    onChange={handlePlayerChange}
                  />
                </div>
              </div>

              <div className="player-actions">
                <button className="add-player-btn" onClick={addPlayer}>
                  + Add Player
                </button>
                
                <label className="import-btn">
                  📁 Import CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleImportPlayers}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {errors.players && <span className="error-text">{errors.players}</span>}
          </div>

          {/* Players List Section */}
          {players.length > 0 && (
            <div className="setup-section">
              <h3 className="section-title">Player Pool ({players.length} players)</h3>
              
              <div className="players-list">
                {players.map((player, index) => (
                  <div key={player.id} className="player-item">
                    <div className="player-info">
                      <span className="player-number">{index + 1}</span>
                      {player.imageUrl && (
                        <img 
                          src={player.imageUrl} 
                          alt={player.name}
                          className="player-avatar"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      )}
                      <div className="player-details">
                        <span className="player-name">{player.name}</span>
                        <span className="player-position">{player.position}</span>
                        {player.team && <span className="player-team">{player.team}</span>}
                      </div>
                    </div>
                    <div className="player-price">
                      <span className="base-price">${player.basePrice.toLocaleString()}</span>
                      <button 
                        className="remove-player-btn"
                        onClick={() => removePlayer(player.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Auction Button */}
          <button
            className="start-auction-btn"
            onClick={handleStartAuction}
            disabled={isLoading}
          >
            {isLoading ? "Starting..." : "🚀 Start Live Auction"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
