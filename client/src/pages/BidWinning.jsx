import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { 
  Trophy, 
  Package, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  FileText, 
  Truck, 
  CheckCircle, 
  AlertCircle,
  Download,
  Share2,
  MessageSquare,
  ArrowLeft,
  Zap,
  Shield,
  Calendar,
  User,
  Hash,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import "./BidWinning.css";

// Sanitize user input to prevent XSS
const sanitizeText = (text) => {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Format currency securely
const formatCurrency = (amount, currency = "USD") => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(numAmount);
};

// Format date securely
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return "Invalid Date";
  }
};

export default function BidWinning() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auctionId = searchParams.get("auctionId");

  const [isLoading, setIsLoading] = useState(true);
  const [auctionData, setAuctionData] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [orderStatus, setOrderStatus] = useState("processing");
  const [showAllBids, setShowAllBids] = useState(false);

  // Mock data for demonstration - in production, fetch from API
  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock auction data
        const mockAuctionData = {
          id: auctionId || "AUC-2024-001",
          title: "Vintage Rolex Submariner 1968",
          description: "A rare vintage Rolex Submariner from 1968 in excellent condition. Original box and papers included. This timepiece features the iconic black dial and rotating bezel.",
          category: "Watches & Jewelry",
          images: [
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
            "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600",
          ],
          startingPrice: 15000,
          currentPrice: 28500,
          winningBid: 28500,
          reservePrice: 20000,
          reserveMet: true,
          startTime: "2024-01-15T10:00:00Z",
          endTime: "2024-01-22T18:00:00Z",
          seller: {
            id: "seller-123",
            name: "Premium Watches Co.",
            rating: 4.9,
            totalSales: 156,
            verified: true,
          },
          winner: {
            id: user?.id || "user-456",
            name: user?.fullName || "John Doe",
            email: user?.email || "john@example.com",
          },
          autoBid: {
            enabled: true,
            maxBid: 30000,
            incrementAmount: 500,
            totalAutoBids: 8,
            savedAmount: 1500,
          },
          shipping: {
            method: "Express Insured",
            estimatedDelivery: "2024-01-28",
            trackingNumber: "TRK-9876543210",
            carrier: "FedEx",
          },
        };

        // Mock bid history
        const mockBidHistory = [
          { id: 1, bidder: "You", amount: 28500, time: "2024-01-22T17:58:00Z", isAutoBid: true, isWinning: true },
          { id: 2, bidder: "Bidder_X92", amount: 28000, time: "2024-01-22T17:55:00Z", isAutoBid: false, isWinning: false },
          { id: 3, bidder: "You", amount: 27500, time: "2024-01-22T17:50:00Z", isAutoBid: true, isWinning: false },
          { id: 4, bidder: "WatchCollector", amount: 27000, time: "2024-01-22T17:45:00Z", isAutoBid: false, isWinning: false },
          { id: 5, bidder: "You", amount: 26500, time: "2024-01-22T17:40:00Z", isAutoBid: true, isWinning: false },
          { id: 6, bidder: "Bidder_X92", amount: 26000, time: "2024-01-22T17:35:00Z", isAutoBid: false, isWinning: false },
          { id: 7, bidder: "You", amount: 25500, time: "2024-01-22T17:30:00Z", isAutoBid: true, isWinning: false },
          { id: 8, bidder: "LuxuryBuyer", amount: 25000, time: "2024-01-22T17:25:00Z", isAutoBid: false, isWinning: false },
          { id: 9, bidder: "You", amount: 24500, time: "2024-01-22T17:20:00Z", isAutoBid: false, isWinning: false },
          { id: 10, bidder: "WatchCollector", amount: 24000, time: "2024-01-22T17:15:00Z", isAutoBid: false, isWinning: false },
          { id: 11, bidder: "Bidder_X92", amount: 23500, time: "2024-01-22T17:10:00Z", isAutoBid: false, isWinning: false },
          { id: 12, bidder: "You", amount: 23000, time: "2024-01-22T17:05:00Z", isAutoBid: true, isWinning: false },
          { id: 13, bidder: "LuxuryBuyer", amount: 22500, time: "2024-01-22T17:00:00Z", isAutoBid: false, isWinning: false },
          { id: 14, bidder: "WatchCollector", amount: 22000, time: "2024-01-22T16:55:00Z", isAutoBid: false, isWinning: false },
          { id: 15, bidder: "You", amount: 21500, time: "2024-01-22T16:50:00Z", isAutoBid: true, isWinning: false },
        ];

        setAuctionData(mockAuctionData);
        setBidHistory(mockBidHistory);
        setPaymentStatus("completed");
        setOrderStatus("shipped");
      } catch (error) {
        console.error("Error fetching auction data:", error);
        toast.error("Failed to load auction details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctionData();
  }, [auctionId, user]);

  // Calculate bid statistics
  const bidStats = useMemo(() => {
    if (!bidHistory.length) return null;
    
    const yourBids = bidHistory.filter((bid) => bid.bidder === "You");
    const autoBids = yourBids.filter((bid) => bid.isAutoBid);
    const highestBid = Math.max(...bidHistory.map((bid) => bid.amount));
    const lowestBid = Math.min(...bidHistory.map((bid) => bid.amount));
    
    return {
      totalBids: bidHistory.length,
      yourBids: yourBids.length,
      autoBids: autoBids.length,
      manualBids: yourBids.length - autoBids.length,
      highestBid,
      lowestBid,
      bidRange: highestBid - lowestBid,
    };
  }, [bidHistory]);

  // Generate chart data points
  const chartData = useMemo(() => {
    if (!bidHistory.length) return [];
    
    return [...bidHistory]
      .reverse()
      .map((bid, index) => ({
        x: index,
        y: bid.amount,
        label: bid.bidder,
        isYou: bid.bidder === "You",
        isAutoBid: bid.isAutoBid,
      }));
  }, [bidHistory]);

  const handlePayment = () => {
    toast.success("Redirecting to secure payment gateway...");
    // In production, redirect to payment gateway
  };

  const handleDownloadInvoice = () => {
    toast.success("Invoice downloaded successfully!");
    // In production, generate and download PDF invoice
  };

  const handleContactSeller = () => {
    toast.success("Opening chat with seller...");
    // In production, open chat/messaging system
  };

  const handleShareWin = () => {
    if (navigator.share) {
      navigator.share({
        title: `I won ${auctionData?.title}!`,
        text: `Just won this amazing item on BidStation!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="bid-winning-page">
        <Navbar />
        <div className="bid-winning-container">
          <div className="loading-state">
            <div className="loading-spinner-large"></div>
            <p>Loading your winning bid details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!auctionData) {
    return (
      <div className="bid-winning-page">
        <Navbar />
        <div className="bid-winning-container">
          <div className="error-state">
            <AlertCircle size={64} />
            <h2>Auction Not Found</h2>
            <p>The auction you're looking for doesn't exist or has been removed.</p>
            <Link to="/dashboard" className="btn-primary">
              Return to Dashboard
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bid-winning-page">
      <Navbar />
      
      <div className="bid-winning-container">
        {/* Back Navigation */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        {/* Winner Announcement Section */}
        <WinnerAnnouncement 
          auctionData={auctionData} 
          onShare={handleShareWin}
        />

        {/* Main Content Grid */}
        <div className="bid-winning-grid">
          {/* Left Column */}
          <div className="bid-winning-left">
            {/* Auction Item Details */}
            <AuctionItemDetails auctionData={auctionData} />

            {/* Bid History Chart */}
            <BidHistoryChart 
              chartData={chartData} 
              bidStats={bidStats}
              auctionData={auctionData}
            />

            {/* Bid History Table */}
            <BidHistoryTable 
              bidHistory={bidHistory}
              showAllBids={showAllBids}
              setShowAllBids={setShowAllBids}
            />
          </div>

          {/* Right Column */}
          <div className="bid-winning-right">
            {/* Auto-Bid Summary */}
            <AutoBidSummary autoBid={auctionData.autoBid} bidStats={bidStats} />

            {/* Payment & Invoice Section */}
            <PaymentInvoice 
              auctionData={auctionData}
              paymentStatus={paymentStatus}
              onPayment={handlePayment}
              onDownloadInvoice={handleDownloadInvoice}
            />

            {/* Order/Delivery Status */}
            <OrderDeliveryStatus 
              shipping={auctionData.shipping}
              orderStatus={orderStatus}
            />

            {/* Action Buttons */}
            <ActionButtons 
              onContactSeller={handleContactSeller}
              onShare={handleShareWin}
              auctionData={auctionData}
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// Winner Announcement Component
function WinnerAnnouncement({ auctionData, onShare }) {
  return (
    <section className="winner-announcement">
      <div className="confetti-container">
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
        <div className="confetti"></div>
      </div>
      
      <div className="winner-content">
        <div className="trophy-icon">
          <Trophy size={64} />
        </div>
        
        <h1 className="winner-title">🎉 Congratulations! You Won! 🎉</h1>
        
        <p className="winner-subtitle">
          You are the winning bidder for <strong>{sanitizeText(auctionData.title)}</strong>
        </p>
        
        <div className="winning-bid-display">
          <span className="winning-label">Winning Bid</span>
          <span className="winning-amount">{formatCurrency(auctionData.winningBid)}</span>
        </div>

        <div className="winner-badges">
          {auctionData.reserveMet && (
            <span className="badge badge-success">
              <CheckCircle size={16} />
              Reserve Met
            </span>
          )}
          <span className="badge badge-info">
            <Clock size={16} />
            Auction Ended {formatDate(auctionData.endTime)}
          </span>
        </div>

        <button className="share-win-btn" onClick={onShare}>
          <Share2 size={18} />
          Share Your Win
        </button>
      </div>
    </section>
  );
}

// Auction Item Details Component
function AuctionItemDetails({ auctionData }) {
  const [activeImage, setActiveImage] = useState(0);

  return (
    <section className="auction-item-details card-section">
      <h2 className="section-title">
        <Package size={24} />
        Item Details
      </h2>

      <div className="item-content">
        <div className="item-gallery">
          <div className="main-image">
            <img 
              src={auctionData.images[activeImage]} 
              alt={sanitizeText(auctionData.title)}
              loading="lazy"
            />
          </div>
          {auctionData.images.length > 1 && (
            <div className="thumbnail-row">
              {auctionData.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === activeImage ? "active" : ""}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img} alt={`View ${index + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="item-info">
          <h3 className="item-title">{sanitizeText(auctionData.title)}</h3>
          
          <div className="item-meta">
            <span className="meta-item">
              <Hash size={16} />
              {sanitizeText(auctionData.id)}
            </span>
            <span className="meta-item">
              <Package size={16} />
              {sanitizeText(auctionData.category)}
            </span>
          </div>

          <p className="item-description">{sanitizeText(auctionData.description)}</p>

          <div className="price-breakdown">
            <div className="price-row">
              <span>Starting Price</span>
              <span>{formatCurrency(auctionData.startingPrice)}</span>
            </div>
            <div className="price-row">
              <span>Reserve Price</span>
              <span>{formatCurrency(auctionData.reservePrice)}</span>
            </div>
            <div className="price-row highlight">
              <span>Your Winning Bid</span>
              <span className="winning-price">{formatCurrency(auctionData.winningBid)}</span>
            </div>
          </div>

          <div className="seller-info">
            <h4>Seller Information</h4>
            <div className="seller-card">
              <div className="seller-avatar">
                <User size={24} />
              </div>
              <div className="seller-details">
                <span className="seller-name">
                  {sanitizeText(auctionData.seller.name)}
                  {auctionData.seller.verified && (
                    <Shield size={16} className="verified-badge" />
                  )}
                </span>
                <span className="seller-stats">
                  ⭐ {auctionData.seller.rating} • {auctionData.seller.totalSales} sales
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Bid History Chart Component
function BidHistoryChart({ chartData, bidStats, auctionData }) {
  if (!chartData.length) return null;

  const maxBid = Math.max(...chartData.map((d) => d.y));
  const minBid = Math.min(...chartData.map((d) => d.y));
  const range = maxBid - minBid || 1;

  return (
    <section className="bid-history-chart card-section">
      <h2 className="section-title">
        <TrendingUp size={24} />
        Bid Progression
      </h2>

      <div className="chart-container">
        <div className="chart-y-axis">
          <span>{formatCurrency(maxBid)}</span>
          <span>{formatCurrency((maxBid + minBid) / 2)}</span>
          <span>{formatCurrency(minBid)}</span>
        </div>
        
        <div className="chart-area">
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="chart-svg">
            {/* Grid lines */}
            <line x1="0" y1="12.5" x2="100" y2="12.5" className="grid-line" />
            <line x1="0" y1="25" x2="100" y2="25" className="grid-line" />
            <line x1="0" y1="37.5" x2="100" y2="37.5" className="grid-line" />
            
            {/* Area fill */}
            <path
              d={`M 0 50 ${chartData
                .map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 50 - ((d.y - minBid) / range) * 45;
                  return `L ${x} ${y}`;
                })
                .join(" ")} L 100 50 Z`}
              className="chart-area-fill"
            />
            
            {/* Line */}
            <path
              d={`M ${chartData
                .map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 50 - ((d.y - minBid) / range) * 45;
                  return `${i === 0 ? "" : "L "}${x} ${y}`;
                })
                .join(" ")}`}
              className="chart-line"
            />
            
            {/* Data points */}
            {chartData.map((d, i) => {
              const x = (i / (chartData.length - 1)) * 100;
              const y = 50 - ((d.y - minBid) / range) * 45;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  className={`chart-point ${d.isYou ? "your-bid" : ""} ${d.isAutoBid ? "auto-bid" : ""}`}
                />
              );
            })}
          </svg>
        </div>
      </div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-dot your-bid"></span>
          Your Bids
        </span>
        <span className="legend-item">
          <span className="legend-dot auto-bid"></span>
          Auto-Bids
        </span>
        <span className="legend-item">
          <span className="legend-dot other-bid"></span>
          Other Bidders
        </span>
      </div>

      <div className="chart-stats">
        <div className="stat-box">
          <span className="stat-label">Total Bids</span>
          <span className="stat-value">{bidStats?.totalBids || 0}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Your Bids</span>
          <span className="stat-value">{bidStats?.yourBids || 0}</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Price Increase</span>
          <span className="stat-value">
            {formatCurrency((auctionData.winningBid - auctionData.startingPrice))}
          </span>
        </div>
      </div>
    </section>
  );
}

// Bid History Table Component
function BidHistoryTable({ bidHistory, showAllBids, setShowAllBids }) {
  const displayedBids = showAllBids ? bidHistory : bidHistory.slice(0, 5);

  return (
    <section className="bid-history-table card-section">
      <h2 className="section-title">
        <Clock size={24} />
        Bid History
      </h2>

      <div className="table-container">
        <table className="bid-table">
          <thead>
            <tr>
              <th>Bidder</th>
              <th>Amount</th>
              <th>Time</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {displayedBids.map((bid) => (
              <tr 
                key={bid.id} 
                className={`${bid.isWinning ? "winning-row" : ""} ${bid.bidder === "You" ? "your-row" : ""}`}
              >
                <td className="bidder-cell">
                  <span className="bidder-name">
                    {sanitizeText(bid.bidder)}
                    {bid.isWinning && <Trophy size={14} className="winner-icon" />}
                  </span>
                </td>
                <td className="amount-cell">
                  <span className={bid.isWinning ? "winning-amount" : ""}>
                    {formatCurrency(bid.amount)}
                  </span>
                </td>
                <td className="time-cell">
                  {formatDate(bid.time)}
                </td>
                <td className="type-cell">
                  {bid.isAutoBid ? (
                    <span className="bid-type auto">
                      <Zap size={14} />
                      Auto
                    </span>
                  ) : (
                    <span className="bid-type manual">Manual</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bidHistory.length > 5 && (
        <button 
          className="show-more-btn"
          onClick={() => setShowAllBids(!showAllBids)}
        >
          {showAllBids ? (
            <>
              <ChevronUp size={18} />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown size={18} />
              Show All {bidHistory.length} Bids
            </>
          )}
        </button>
      )}
    </section>
  );
}

// Auto-Bid Summary Component
function AutoBidSummary({ autoBid, bidStats }) {
  if (!autoBid?.enabled) {
    return (
      <section className="auto-bid-summary card-section">
        <h2 className="section-title">
          <Zap size={24} />
          Auto-Bid Summary
        </h2>
        <div className="auto-bid-disabled">
          <p>Auto-bidding was not enabled for this auction.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auto-bid-summary card-section">
      <h2 className="section-title">
        <Zap size={24} />
        Auto-Bid Summary
      </h2>

      <div className="auto-bid-stats">
        <div className="auto-bid-stat">
          <span className="stat-icon success">
            <CheckCircle size={20} />
          </span>
          <div className="stat-content">
            <span className="stat-label">Auto-Bids Placed</span>
            <span className="stat-value">{autoBid.totalAutoBids}</span>
          </div>
        </div>

        <div className="auto-bid-stat">
          <span className="stat-icon info">
            <TrendingUp size={20} />
          </span>
          <div className="stat-content">
            <span className="stat-label">Max Bid Limit</span>
            <span className="stat-value">{formatCurrency(autoBid.maxBid)}</span>
          </div>
        </div>

        <div className="auto-bid-stat">
          <span className="stat-icon warning">
            <DollarSign size={20} />
          </span>
          <div className="stat-content">
            <span className="stat-label">Increment Amount</span>
            <span className="stat-value">{formatCurrency(autoBid.incrementAmount)}</span>
          </div>
        </div>

        <div className="auto-bid-stat highlight">
          <span className="stat-icon success">
            <Shield size={20} />
          </span>
          <div className="stat-content">
            <span className="stat-label">Amount Saved</span>
            <span className="stat-value saved">{formatCurrency(autoBid.savedAmount)}</span>
          </div>
        </div>
      </div>

      <div className="auto-bid-message">
        <p>
          🎯 Your auto-bid strategy worked! You saved <strong>{formatCurrency(autoBid.savedAmount)}</strong> by 
          setting a max bid of {formatCurrency(autoBid.maxBid)} and winning at {formatCurrency(autoBid.maxBid - autoBid.savedAmount)}.
        </p>
      </div>
    </section>
  );
}

// Payment & Invoice Section Component
function PaymentInvoice({ auctionData, paymentStatus, onPayment, onDownloadInvoice }) {
  const fees = {
    itemPrice: auctionData.winningBid,
    buyerPremium: auctionData.winningBid * 0.05,
    shipping: 150,
    insurance: 75,
    tax: auctionData.winningBid * 0.08,
  };
  
  const total = Object.values(fees).reduce((sum, fee) => sum + fee, 0);

  return (
    <section className="payment-invoice card-section">
      <h2 className="section-title">
        <CreditCard size={24} />
        Payment & Invoice
      </h2>

      <div className="payment-status-badge">
        {paymentStatus === "completed" ? (
          <span className="status-badge success">
            <CheckCircle size={18} />
            Payment Completed
          </span>
        ) : paymentStatus === "pending" ? (
          <span className="status-badge warning">
            <AlertCircle size={18} />
            Payment Pending
          </span>
        ) : (
          <span className="status-badge error">
            <AlertCircle size={18} />
            Payment Failed
          </span>
        )}
      </div>

      <div className="invoice-breakdown">
        <div className="invoice-row">
          <span>Item Price</span>
          <span>{formatCurrency(fees.itemPrice)}</span>
        </div>
        <div className="invoice-row">
          <span>Buyer's Premium (5%)</span>
          <span>{formatCurrency(fees.buyerPremium)}</span>
        </div>
        <div className="invoice-row">
          <span>Shipping & Handling</span>
          <span>{formatCurrency(fees.shipping)}</span>
        </div>
        <div className="invoice-row">
          <span>Insurance</span>
          <span>{formatCurrency(fees.insurance)}</span>
        </div>
        <div className="invoice-row">
          <span>Tax (8%)</span>
          <span>{formatCurrency(fees.tax)}</span>
        </div>
        <div className="invoice-row total">
          <span>Total Amount</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="payment-actions">
        {paymentStatus !== "completed" && (
          <button className="btn-primary" onClick={onPayment}>
            <CreditCard size={18} />
            Pay Now
          </button>
        )}
        <button className="btn-secondary" onClick={onDownloadInvoice}>
          <Download size={18} />
          Download Invoice
        </button>
      </div>

      <div className="payment-security">
        <Shield size={16} />
        <span>Secure payment powered by Stripe. Your data is encrypted.</span>
      </div>
    </section>
  );
}

// Order/Delivery Status Component
function OrderDeliveryStatus({ shipping, orderStatus }) {
  const statusSteps = [
    { id: "confirmed", label: "Order Confirmed", icon: CheckCircle },
    { id: "processing", label: "Processing", icon: Package },
    { id: "shipped", label: "Shipped", icon: Truck },
    { id: "delivered", label: "Delivered", icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.id === orderStatus);

  return (
    <section className="order-delivery-status card-section">
      <h2 className="section-title">
        <Truck size={24} />
        Order & Delivery Status
      </h2>

      <div className="status-timeline">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div 
              key={step.id} 
              className={`timeline-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
            >
              <div className="step-icon">
                <Icon size={20} />
              </div>
              <span className="step-label">{step.label}</span>
              {index < statusSteps.length - 1 && <div className="step-connector"></div>}
            </div>
          );
        })}
      </div>

      <div className="shipping-details">
        <h4>Shipping Information</h4>
        <div className="shipping-info-grid">
          <div className="shipping-info-item">
            <span className="info-label">Carrier</span>
            <span className="info-value">{sanitizeText(shipping.carrier)}</span>
          </div>
          <div className="shipping-info-item">
            <span className="info-label">Method</span>
            <span className="info-value">{sanitizeText(shipping.method)}</span>
          </div>
          <div className="shipping-info-item">
            <span className="info-label">Tracking Number</span>
            <span className="info-value tracking">{sanitizeText(shipping.trackingNumber)}</span>
          </div>
          <div className="shipping-info-item">
            <span className="info-label">
              <Calendar size={14} />
              Est. Delivery
            </span>
            <span className="info-value">{formatDate(shipping.estimatedDelivery)}</span>
          </div>
        </div>
      </div>

      <a 
        href={`https://www.fedex.com/track?tracknumbers=${shipping.trackingNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="track-package-btn"
      >
        <Truck size={18} />
        Track Package
      </a>
    </section>
  );
}

// Action Buttons Component
function ActionButtons({ onContactSeller, onShare, auctionData }) {
  return (
    <section className="action-buttons-section card-section">
      <h2 className="section-title">
        <FileText size={24} />
        Quick Actions
      </h2>

      <div className="action-buttons-grid">
        <button className="action-btn contact" onClick={onContactSeller}>
          <MessageSquare size={20} />
          Contact Seller
        </button>

        <button className="action-btn share" onClick={onShare}>
          <Share2 size={20} />
          Share Win
        </button>

        <Link to="/dashboard" className="action-btn dashboard">
          <Package size={20} />
          My Auctions
        </Link>

        <Link to="/join" className="action-btn browse">
          <TrendingUp size={20} />
          Browse More
        </Link>
      </div>

      <div className="support-info">
        <p>Need help? Contact our support team at <a href="mailto:support@bidstation.com">support@bidstation.com</a></p>
      </div>
    </section>
  );
}
