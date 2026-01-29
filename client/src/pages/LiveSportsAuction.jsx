import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./LiveSportsAuction.css";

export default function LiveSportsAuction() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const socketRef = useRef(null);
  const timerRef = useRef(null);

  // Auction State
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState("waiting");

  // User State
  const [myTeam, setMyTeam] = useState([]);
  const [myBudget, setMyBudget] = useState(0);

  // UI State
  const [bidAmount, setBidAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);

  // Load Auction Data
  useEffect(() => {
    const stored = localStorage.getItem("currentSportsAuction");

    if (!stored) {
      toast.error("No auction found!");
      navigate("/sports-auction/setup");
      return;
    }

    const data = JSON.parse(stored);
    setAuction(data);

    const players = data.players || [];

    setAvailablePlayers(players.filter(p => !p.status || p.status === "available"));
    setSoldPlayers(players.filter(p => p.status === "sold"));
    setUnsoldPlayers(players.filter(p => p.status === "unsold"));

    const myName = user?.fullName || user?.email;
    const mine = players.filter(p => p.soldTo === myName);
    const spent = mine.reduce((sum, p) => sum + (p.soldPrice || 0), 0);

    setMyTeam(mine.map(p => ({ ...p, boughtPrice: p.soldPrice })));
    setMyBudget((data.startingBudget || 0) - spent);
  }, [navigate, user]);

  // Socket Setup
  useEffect(() => {
    if (!auction?.id) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || "http://localhost:3000");

    socketRef.current.emit("joinSportsAuction", auction.id);

    socketRef.current.on("playerBidUpdate", ({ currentBid, highestBidder }) => {
      setCurrentBid(currentBid);
      setHighestBidder(highestBidder);
      setTimeRemaining(auction.bidTimeLimit || 30);
    });

    socketRef.current.on("newPlayerUp", startBiddingForPlayer);
    socketRef.current.on("playerSold", handlePlayerSold);
    socketRef.current.on("playerUnsold", handlePlayerUnsold);

    return () => socketRef.current.disconnect();
  }, [auction?.id]);

  // Timer Logic (FIXED)
  useEffect(() => {
    if (auctionStatus !== "bidding") return;

    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleBiddingEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [auctionStatus]);

  // Start Player
  const startBiddingForPlayer = useCallback((player) => {
    if (!player) return;

    setCurrentPlayer(player);
    setCurrentBid(player.basePrice || 0);
    setHighestBidder(null);
    setTimeRemaining(auction?.bidTimeLimit || 30);
    setAuctionStatus("bidding");
    setStatusMessage(`🎯 ${player.name} is LIVE for bidding!`);
  }, [auction]);

  // End Bidding
  const handleBiddingEnd = useCallback(() => {
    if (!currentPlayer) return;

    if (highestBidder) {
      handlePlayerSold({
        player: currentPlayer,
        buyer: highestBidder,
        price: currentBid
      });
    } else {
      handlePlayerUnsold({ player: currentPlayer });
    }
  }, [currentPlayer, highestBidder, currentBid]);

  // Sold Handler
  const handlePlayerSold = useCallback(({ player, buyer, price }) => {
    setAuctionStatus("sold");
    setStatusMessage(`✅ SOLD! ${player.name} → ${buyer} ($${price.toLocaleString()})`);

    setSoldPlayers(prev => [...prev, { ...player, soldTo: buyer, soldPrice: price }]);
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));

    const myName = user?.fullName || user?.email;
    if (buyer === myName) {
      setMyTeam(prev => [...prev, { ...player, boughtPrice: price }]);
      setMyBudget(prev => prev - price);
      toast.success(`You won ${player.name}`);
    }
  }, [user]);

  // Unsold Handler
  const handlePlayerUnsold = useCallback(({ player }) => {
    setAuctionStatus("unsold");
    setStatusMessage(`❌ UNSOLD! ${player.name}`);

    setUnsoldPlayers(prev => [...prev, player]);
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  }, []);

  // Next Player
  const handleStartNextPlayer = () => {
    if (availablePlayers.length === 0) {
      toast.success("Auction Completed!");
      setAuctionStatus("completed");
      return;
    }

    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];

    socketRef.current?.emit("startPlayerBidding", {
      auctionId: auction.id,
      player: randomPlayer
    });

    startBiddingForPlayer(randomPlayer);
  };

  // Place Bid
  const handlePlaceBid = () => {
    if (!isAuthenticated) return toast.error("Login required");

    const amount = Number(bidAmount) || currentBid + (auction?.minBidIncrement || 1000);

    if (amount <= currentBid) return toast.error("Bid too low");
    if (amount > myBudget) return toast.error("Insufficient budget");

    const bidder = user?.fullName || user?.email;

    setCurrentBid(amount);
    setHighestBidder(bidder);
    setTimeRemaining(auction?.bidTimeLimit || 30);
    setBidAmount("");

    socketRef.current?.emit("placeSportsBid", {
      auctionId: auction.id,
      playerId: currentPlayer.id,
      amount,
      bidder
    });

    toast.success("Bid Placed!");
  };

  if (!auction) return null;

  return (
    <div className="live-auction-page">
      <Navbar />

      <div className="live-auction-container">

        <div className="auction-header">
          <h1>🏆 {auction.name}</h1>
          <div className="auction-stats">
            <span>Available: {availablePlayers.length}</span>
            <span className="sold">Sold: {soldPlayers.length}</span>
            <span className="unsold">Unsold: {unsoldPlayers.length}</span>
          </div>
        </div>

        <div className="auction-main">

          <div className="current-player-panel">

            {auctionStatus === "waiting" && (
              <button className="start-btn" onClick={handleStartNextPlayer}>
                🎲 Start Auction
              </button>
            )}

            {currentPlayer && (
              <div className="player-card">

                <h2>{currentPlayer.name}</h2>

                <p>Current Bid: ${currentBid.toLocaleString()}</p>
                <p>Highest Bidder: {highestBidder || "-"}</p>

                {auctionStatus === "bidding" && (
                  <>
                    <h3>{timeRemaining}s</h3>

                    <input
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                    />

                    <button onClick={handlePlaceBid}>Place Bid</button>
                  </>
                )}

                {(auctionStatus === "sold" || auctionStatus === "unsold") && (
                  <button onClick={handleStartNextPlayer}>Next Player</button>
                )}

              </div>
            )}

            {statusMessage && <div className="status">{statusMessage}</div>}

          </div>

        </div>

      </div>

      <Footer />
    </div>
  );
}
