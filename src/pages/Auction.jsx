import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Auction.css";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

export default function Auction() {
  const { user } = useAuth();
  const [auction, setAuction] = useState({
    id: 'auction1',
    name: 'Sample Auction',
    description: 'This is a sample auction for demonstration.',
    startingPrice: 50,
    currentBid: 0,
    highestBidder: null,
  });
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [status, setStatus] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinAuction', 'auction1');
    });

    socket.on('auctionState', (state) => {
      setAuction((a) => ({ ...a, ...state }));
      setTimeRemaining(state.timeRemaining || 0);
    });

    socket.on('bidUpdate', (update) => {
      if (update.auctionId !== auction.id) return;
      setAuction((a) => ({ ...a, currentBid: update.currentBid, highestBidder: update.highestBidder }));
      setStatus(`Highest bid: $${update.currentBid} by ${update.highestBidder}`);
    });

    socket.on('timeUpdate', (t) => {
      if (t.auctionId !== auction.id) return;
      setTimeRemaining(t.timeRemaining);
    });

    socket.on('auctionEnded', () => {
      setStatus('Auction ended');
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlaceBid = () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= (auction.currentBid || 0)) {
      setStatus('Enter a higher bid than current.');
      return;
    }

    const bidderName = user?.fullName || user?.email || 'Anonymous';
    socketRef.current?.emit('placeBid', { auctionId: auction.id, amount, bidder: bidderName }, (res) => {
      if (!res || !res.success) {
        setStatus(res?.message || 'Bid failed');
      } else {
        setStatus('Bid placed successfully');
        setBidAmount('');
      }
    });
  };

  // Format timeRemaining (seconds) into mm:ss or h:m:s
  const formatTime = (secs) => {
    if (secs <= 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="auction-page">
      <Navbar />

      <div className="auction-container">
        <div className="auction-card">
          <h2 className="auction-title">{auction.name}</h2>

          <div className="auction-details">
            <p><strong>Auction Name:</strong> {auction.name}</p>
            <p><strong>Description:</strong> {auction.description}</p>
            <p><strong>Starting Price:</strong> ${auction.startingPrice}</p>
            <p><strong>Current Highest Bid:</strong> ${auction.currentBid}</p>
            <p><strong>Highest Bidder:</strong> {auction.highestBidder || '—'}</p>
            <p><strong>Time Remaining:</strong> {formatTime(timeRemaining)}</p>
          </div>

          <input
            type="number"
            className="auction-input"
            placeholder="Enter your bid amount"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            disabled={timeRemaining <= 0}
          />

          <button className="auction-btn" onClick={handlePlaceBid} disabled={timeRemaining <= 0}>
            Place Bid
          </button>

          {status && <p className="auction-status">{status}</p>}
        </div>
      </div>

      <Footer />
    </div>
  );
}