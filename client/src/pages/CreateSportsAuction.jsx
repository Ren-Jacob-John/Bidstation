import { useState } from "react";
import { toast } from "react-hot-toast";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./CreateSportsAuction.css";

export default function CreateSportsAuction() {
  const [name, setName] = useState("");
  const [budget, setBudget] = useState(100000);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auction", {
        name,
        startingBudget: budget,
        maxPlayersPerUser: maxPlayers
      });

      toast.success("Auction created!");
      navigate(`/sports-auction/live/${res.data.auctionId}`);

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="create-sports-auction-page">
      <Navbar />

      <div className="create-sports-auction-container">
        <div className="create-sports-auction-card">
          <h2 className="create-sports-auction-title">🏆 Create Sports Auction</h2>

          <form className="create-sports-auction-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Auction Name</label>
              <input
                type="text"
                className="create-sports-auction-input"
                placeholder="e.g., IPL 2024 Mini Auction"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Starting Budget ($)</label>
              <input
                type="number"
                className="create-sports-auction-input"
                placeholder="100000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                min="1000"
                step="1000"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Max Players Per User</label>
              <input
                type="number"
                className="create-sports-auction-input"
                placeholder="5"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                min="1"
                max="50"
                required
              />
            </div>

            <button type="submit" className="create-sports-auction-btn">
              🚀 Create Auction
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}