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
  
  // Auction state
  const [auction, setAuction] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [highestBidder, setHighestBidder] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [auctionStatus, setAuctionStatus] = useState("waiting"); // waiting, bidding, sold, unsold, completed
  
  // Participants state
  const [participants, setParticipants] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [myBudget, setMyBudget] = useState(0);
  
  // UI state
  const [bidAmount, setBidAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  
  // Timer ref
  const timerRef = useRef(null);

  // Load auction data from localStorage
  useEffect(() => {
    const storedAuction = localStorage.getItem("currentSportsAuction");
    if (!storedAuction) {
      toast.error("No auction found. Please create one first.");
      navigate("/sports-auction/setup");
      return;
    }

    const auctionData = JSON.parse(storedAuction);
    setAuction(auctionData);
    setAvailablePlayers(auctionData.players.filter(p => p.status === "available"));
    setMyBudget(auctionData.startingBudget);
    
    // Initialize participants (for demo, add current user)
    if (isAuthenticated && user) {
      const currentParticipant = {
        id: user.email || "user1",
        name: user.fullName || user.email || "You",
        budget: auctionData.startingBudget,
        players: [],
        maxPlayers: auctionData.maxPlayersPerUser
      };
      setParticipants([currentParticipant]);
    }
  }, [navigate, isAuthenticated, user]);

  // Socket connection for real-time updates
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      if (auction) {
        socket.emit('joinSportsAuction', auction.id);
      }
    });

    socket.on('playerBidUpdate', (update) => {
      setCurrentBid(update.currentBid);
      setHighestBidder(update.highestBidder);
      setStatusMessage(`${update.highestBidder} bid $${update.currentBid.toLocaleString()}`);
    });

    socket.on('playerSold', (data) => {
      handlePlayerSold(data);
    });

    socket.on('playerUnsold', (data) => {
      handlePlayerUnsold(data);
    });

    socket.on('newPlayerUp', (player) => {
      startBiddingForPlayer(player);
    });

    return () => {
      socket.disconnect();
    };
  }, [auction]);

  // Timer countdown
  useEffect(() => {
    if (auctionStatus === "bidding" && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleBiddingEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [auctionStatus, currentPlayer]);

  const selectRandomPlayer = useCallback(() => {
    if (availablePlayers.length === 0) {
      setAuctionStatus("completed");
      setStatusMessage("🎉 Auction Complete! All players have been auctioned.");
      return null;
    }

    const randomIndex = Math.floor(Math.random() * availablePlayers.length);
    const selectedPlayer = availablePlayers[randomIndex];
    return selectedPlayer;
  }, [availablePlayers]);

  const startBiddingForPlayer = (player) => {
    setCurrentPlayer(player);
    setCurrentBid(player.basePrice);
    setHighestBidder(null);
    setTimeRemaining(auction?.bidTimeLimit || 30);
    setAuctionStatus("bidding");
    setBidAmount("");
    setStatusMessage(`🎯 ${player.name} is up for auction! Base price: $${player.basePrice.toLocaleString()}`);
  };

  const handleStartNextPlayer = () => {
    const player = selectRandomPlayer();
    if (player) {
      startBiddingForPlayer(player);
      
      // Emit to socket for other participants
      socketRef.current?.emit('startPlayerBidding', {
        auctionId: auction.id,
        player
      });
    }
  };

  const handleBiddingEnd = () => {
    if (highestBidder) {
      // Player sold
      handlePlayerSold({
        player: currentPlayer,
        buyer: highestBidder,
        price: currentBid
      });
    } else {
      // Player unsold
      handlePlayerUnsold({ player: currentPlayer });
    }
  };

  const handlePlayerSold = (data) => {
    const { player, buyer, price } = data;
    
    setAuctionStatus("sold");
    setStatusMessage(`✅ SOLD! ${player.name} to ${buyer} for $${price.toLocaleString()}`);
    
    // Update sold players list
    setSoldPlayers(prev => [...prev, { ...player, soldTo: buyer, soldPrice: price }]);
    
    // Remove from available players
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
    
    // Update participant's team and budget
    setParticipants(prev => prev.map(p => {
      if (p.name === buyer || p.id === buyer) {
        return {
          ...p,
          budget: p.budget - price,
          players: [...p.players, { ...player, boughtPrice: price }]
        };
      }
      return p;
    }));

    // Update my team if I'm the buyer
    const myName = user?.fullName || user?.email || "You";
    if (buyer === myName) {
      setMyTeam(prev => [...prev, { ...player, boughtPrice: price }]);
      setMyBudget(prev => prev - price);
      toast.success(`You won ${player.name} for $${price.toLocaleString()}!`);
    }

    // Update localStorage
    updateAuctionStorage(player, buyer, price);
  };

  const handlePlayerUnsold = (data) => {
    const { player } = data;
    
    setAuctionStatus("unsold");
    setStatusMessage(`❌ UNSOLD! ${player.name} received no bids.`);
    
    // Update unsold players list
    setUnsoldPlayers(prev => [...prev, player]);
    
    // Remove from available players
    setAvailablePlayers(prev => prev.filter(p => p.id !== player.id));
  };

  const updateAuctionStorage = (player, buyer, price) => {
    const storedAuction = JSON.parse(localStorage.getItem("currentSportsAuction"));
    if (storedAuction) {
      storedAuction.players = storedAuction.players.map(p => {
        if (p.id === player.id) {
          return { ...p, status: "sold", soldTo: buyer, soldPrice: price };
        }
        return p;
      });
      localStorage.setItem("currentSportsAuction", JSON.stringify(storedAuction));
    }
  };

  const handlePlaceBid = () => {
    if (!isAuthenticated) {
      toast.error("Please login to place bids");
      return;
    }

    // Check if user has reached max players
    if (myTeam.length >= (auction?.maxPlayersPerUser || 5)) {
      toast.error(`You've reached the maximum of ${auction?.maxPlayersPerUser} players!`);
      return;
    }

    const amount = Number(bidAmount) || (currentBid + (auction?.minBidIncrement || 1000));
    
    if (amount <= currentBid) {
      toast.error(`Bid must be higher than $${currentBid.toLocaleString()}`);
      return;
    }

    if (amount > myBudget) {
      toast.error(`Insufficient budget! You have $${myBudget.toLocaleString()}`);
      return;
    }

    const bidderName = user?.fullName || user?.email || "You";
    
    // Update local state
    setCurrentBid(amount);
    setHighestBidder(bidderName);
    setTimeRemaining(auction?.bidTimeLimit || 30); // Reset timer on new bid
    setBidAmount("");
    setStatusMessage(`💰 ${bidderName} bid $${amount.toLocaleString()}`);
    
    // Emit to socket
    socketRef.current?.emit('placeSportsBid', {
      auctionId: auction.id,
      playerId: currentPlayer.id,
      amount,
      bidder: bidderName
    });

    toast.success(`Bid placed: $${amount.toLocaleString()}`);
  };

  const handleQuickBid = (increment) => {
    const newBid = currentBid + increment;
    if (newBid > myBudget) {
      toast.error(`Insufficient budget!`);
      return;
    }
    setBidAmount(newBid.toString());
  };

  const formatTime = (secs) => {
    if (secs <= 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getTimerClass = () => {
    if (timeRemaining <= 5) return "timer-critical";
    if (timeRemaining <= 10) return "timer-warning";
    return "";
  };

  if (!auction) {
    return (
      <div className="live-auction-page">
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner">Loading auction...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="live-auction-page">
      <Navbar />

      <div className="live-auction-container">
        {/* Header */}
        <div className="auction-header">
          <h1 className="auction-name">🏆 {auction.name}</h1>
          <div className="auction-stats">
            <span className="stat-item">
              <span className="stat-label">Available:</span>
              <span className="stat-value">{availablePlayers.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Sold:</span>
              <span className="stat-value sold">{soldPlayers.length}</span>
            </span>
            <span className="stat-item">
              <span className="stat-label">Unsold:</span>
              <span className="stat-value unsold">{unsoldPlayers.length}</span>
            </span>
          </div>
        </div>

        <div className="auction-main">
          {/* Left Panel - Current Player */}
          <div className="current-player-panel">
            {auctionStatus === "waiting" && (
              <div className="waiting-state">
                <h2>Ready to Start</h2>
                <p>Click the button below to randomly select the first player</p>
                <button className="start-btn" onClick={handleStartNextPlayer}>
                  🎲 Select Random Player
                </button>
              </div>
            )}

            {auctionStatus === "completed" && (
              <div className="completed-state">
                <h2>🎉 Auction Complete!</h2>
                <p>All players have been auctioned.</p>
                <div className="final-stats">
                  <p>Total Sold: {soldPlayers.length}</p>
                  <p>Total Unsold: {unsoldPlayers.length}</p>
                </div>
                <button className="new-auction-btn" onClick={() => navigate("/sports-auction/setup")}>
                  Start New Auction
                </button>
              </div>
            )}

            {(auctionStatus === "bidding" || auctionStatus === "sold" || auctionStatus === "unsold") && currentPlayer && (
              <div className="player-card">
                <div className={`player-status-badge ${auctionStatus}`}>
                  {auctionStatus === "bidding" && "LIVE BIDDING"}
                  {auctionStatus === "sold" && "SOLD!"}
                  {auctionStatus === "unsold" && "UNSOLD"}
                </div>

                {currentPlayer.imageUrl ? (
                  <img 
                    src={currentPlayer.imageUrl} 
                    alt={currentPlayer.name}
                    className="player-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="player-image-placeholder">
                    {currentPlayer.name.charAt(0)}
                  </div>
                )}

                <h2 className="player-name">{currentPlayer.name}</h2>
                <div className="player-meta">
                  <span className="player-position">{currentPlayer.position}</span>
                  {currentPlayer.team && (
                    <span className="player-team">Ex: {currentPlayer.team}</span>
                  )}
                </div>
                {currentPlayer.stats && (
                  <p className="player-stats">{currentPlayer.stats}</p>
                )}

                <div className="bid-info">
                  <div className="base-price">
                    <span className="label">Base Price</span>
                    <span className="value">${currentPlayer.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="current-bid">
                    <span className="label">Current Bid</span>
                    <span className="value highlight">${currentBid.toLocaleString()}</span>
                  </div>
                  {highestBidder && (
                    <div className="highest-bidder">
                      <span className="label">Highest Bidder</span>
                      <span className="value">{highestBidder}</span>
                    </div>
                  )}
                </div>

                {auctionStatus === "bidding" && (
                  <div className={`timer ${getTimerClass()}`}>
                    <span className="timer-label">Time Remaining</span>
                    <span className="timer-value">{formatTime(timeRemaining)}</span>
                  </div>
                )}

                {auctionStatus === "bidding" && isAuthenticated && (
                  <div className="bidding-controls">
                    <div className="quick-bids">
                      <button onClick={() => handleQuickBid(1000)}>+$1K</button>
                      <button onClick={() => handleQuickBid(5000)}>+$5K</button>
                      <button onClick={() => handleQuickBid(10000)}>+$10K</button>
                    </div>
                    <div className="custom-bid">
                      <input
                        type="number"
                        placeholder={`Min: $${(currentBid + (auction?.minBidIncrement || 1000)).toLocaleString()}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        disabled={myTeam.length >= auction.maxPlayersPerUser}
                      />
                      <button 
                        className="place-bid-btn"
                        onClick={handlePlaceBid}
                        disabled={myTeam.length >= auction.maxPlayersPerUser}
                      >
                        Place Bid
                      </button>
                    </div>
                    {myTeam.length >= auction.maxPlayersPerUser && (
                      <p className="max-players-warning">
                        You've reached the maximum of {auction.maxPlayersPerUser} players!
                      </p>
                    )}
                  </div>
                )}

                {!isAuthenticated && auctionStatus === "bidding" && (
                  <p className="login-prompt">Login to participate in bidding</p>
                )}

                {(auctionStatus === "sold" || auctionStatus === "unsold") && (
                  <button className="next-player-btn" onClick={handleStartNextPlayer}>
                    🎲 Next Random Player
                  </button>
                )}
              </div>
            )}

            {statusMessage && (
              <div className={`status-message ${auctionStatus}`}>
                {statusMessage}
              </div>
            )}
          </div>

          {/* Right Panel - My Team & Budget */}
          <div className="side-panel">
            {/* My Budget */}
            <div className="budget-card">
              <h3>💰 My Budget</h3>
              <div className="budget-amount">${myBudget.toLocaleString()}</div>
              <div className="budget-bar">
                <div 
                  className="budget-fill"
                  style={{ width: `${(myBudget / auction.startingBudget) * 100}%` }}
                />
              </div>
              <p className="budget-info">
                {myTeam.length} / {auction.maxPlayersPerUser} players
              </p>
            </div>

            {/* My Team */}
            <div className="my-team-card">
              <h3>👥 My Team</h3>
              {myTeam.length === 0 ? (
                <p className="empty-team">No players yet</p>
              ) : (
                <div className="team-list">
                  {myTeam.map((player, index) => (
                    <div key={player.id} className="team-player">
                      <span className="team-player-number">{index + 1}</span>
                      <div className="team-player-info">
                        <span className="team-player-name">{player.name}</span>
                        <span className="team-player-position">{player.position}</span>
                      </div>
                      <span className="team-player-price">
                        ${player.boughtPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sold Players */}
            {soldPlayers.length > 0 && (
              <div className="sold-players-card">
                <h3>✅ Sold Players</h3>
                <div className="sold-list">
                  {soldPlayers.slice(-5).reverse().map((player) => (
                    <div key={player.id} className="sold-player">
                      <span className="sold-player-name">{player.name}</span>
                      <span className="sold-player-buyer">→ {player.soldTo}</span>
                      <span className="sold-player-price">
                        ${player.soldPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
