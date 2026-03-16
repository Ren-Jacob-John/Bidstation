import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { functions } from '../firebase/firebase.config';
import { httpsCallable } from 'firebase/functions';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';
import BidHistory from '../components/BidHistory';
import './LiveAuction.css';
import { ref, onValue, get, update } from 'firebase/database';
import { database } from '../firebase/firebase.config';

// Format seconds as HH:MM:SS or MM:SS
const formatTimeUnits = (totalSeconds) => {
  if (totalSeconds == null || totalSeconds < 0) return { text: '--:--:--', hours: 0, minutes: 0, seconds: 0 };
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  const text = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
  return { text, hours, minutes, seconds };
};

const LiveAuction = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [auction, setAuction] = useState(null);
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [autoBidMax, setAutoBidMax] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [controllerRunning, setControllerRunning] = useState(false);
  const [controllerLastTickAt, setControllerLastTickAt] = useState(null);
  // FIX (Bug 2): per-player lot countdown
  const LOT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes — must match inactivityMs in tick
  const [lotLastBidAt, setLotLastBidAt] = useState(null);

  // FIX (Bug 4): Only suppress permission_denied for background real-time listeners,
  // NOT for user-triggered bid actions (those should surface real errors).
  const shouldSuppressListenerError = (err) => {
    const msg = String(err?.message || err || '').toLowerCase();
    return msg.includes('permission_denied') || msg.includes('permission denied');
  };

  useEffect(() => {
    fetchAuctionData();
  }, [id]);

  const isSportsAuction = useMemo(
    () => auction?.auction_type === 'sports_player' || auction?.auctionType === 'sports_player',
    [auction?.auction_type, auction?.auctionType]
  );

  const isAuctioneer = useMemo(() => {
    const auctioneerId = auction?.auctioneerUserId ?? auction?.createdBy ?? auction?.creator_id;
    return Boolean(user?.uid && auctioneerId && user.uid === auctioneerId);
  }, [auction?.auctioneerUserId, auction?.createdBy, auction?.creator_id, user?.uid]);

  // Real-time auction + item/player updates (keeps UI in sync, incl. auto-bids)
  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError('');

    const unsubAuction = auctionService.listenToAuction(id, (auctionData) => {
      setAuction({ id, ...auctionData });
      setLoading(false);
    });

    return () => {
      if (typeof unsubAuction === 'function') unsubAuction();
    };
  }, [id]);

  useEffect(() => {
    if (!id || !auction) return;

    const path = isSportsAuction ? `auctions/${id}/players` : `auctions/${id}/items`;
    const itemsRef = ref(database, path);

    const handleItemsError = (err) => {
      const msg = String(err?.message || err || '').toLowerCase();
      if (msg.includes('permission_denied') || msg.includes('permission denied')) {
        console.warn('LiveAuction items listener: permission_denied suppressed');
        return;
      }
      console.error('LiveAuction items listener error:', err);
    };

    const unsubItems = onValue(itemsRef, (snap) => {
      const list = [];
      if (snap.exists()) {
        snap.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
      }

      // Map to the item shape the UI expects
      const mapped = isSportsAuction
        ? list.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.role ? `Role: ${p.role}` : '',
            base_price: p.basePrice,
            current_price: p.currentBid ?? p.basePrice,
            status: p.status || 'available',
            current_bidder_name: p.currentBidderName || null,
            currentBid: p.currentBid ?? null,
            currentBidderId: p.currentBidderId || null,
            lastBidAt: p.lastBidAt || null,
            player_details: JSON.stringify({
              role: p.role,
              age: p.age,
              nationality: p.nationality,
            }),
          }))
        : list.map((it) => ({
            id: it.id,
            ...it,
            base_price: it.base_price ?? it.basePrice ?? it.base_price,
            current_price: it.currentBid ?? it.current_price ?? it.current_price,
          }));

      setItems(mapped);

      // Select current lot.
      // For sports auctions, selection is server-authoritative via auction.currentPlayerId.
      if (mapped.length === 0) {
        setCurrentItem(null);
        return;
      }

      if (isSportsAuction) {
        const currentId = auction?.currentPlayerId;
        const current = currentId ? mapped.find((it) => it.id === currentId) : null;
        setCurrentItem(current || null);
        // FIX (Bug 2): track when the last bid on current lot happened
        if (current && current.lastBidAt) {
          setLotLastBidAt(current.lastBidAt);
        } else if (auction?.currentLotLastBidAt) {
          setLotLastBidAt(auction.currentLotLastBidAt);
        } else if (auction?.currentLotStartedAt) {
          setLotLastBidAt(auction.currentLotStartedAt);
        }
      } else {
        const updatedCurrent = currentItem && mapped.find((it) => it.id === currentItem.id);
        setCurrentItem(updatedCurrent || mapped[0]);
      }
    }, handleItemsError);

    return () => {
      if (typeof unsubItems === 'function') unsubItems();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, auction?.auction_type, auction?.auctionType]);

  // Spark-plan fallback: auctioneer drives "one player at a time" sports lots.
  // All users follow auction.currentPlayerId in real time.
  useEffect(() => {
    if (!id || !auction || !isSportsAuction) return;
    if (auction.status !== 'live' || auction.locked) return;
    if (!isAuctioneer) return;

    const inactivityMs = 5 * 60 * 1000;
    let stopped = false;
    setControllerRunning(true);

    // FIX (Bug 1): Read players fresh from DB inside tick — don't rely on stale
    // closed-over `items` state which causes random selection to stop working.
    const pickRandomAvailable = async () => {
      const playersSnap = await get(ref(database, `auctions/${id}/players`));
      if (!playersSnap.exists()) return null;
      const available = [];
      playersSnap.forEach((child) => {
        const p = child.val();
        if (!p) return;
        const status = p.status || 'available';
        if (status === 'available') available.push({ id: child.key, ...p });
      });
      if (available.length === 0) return null;
      return available[Math.floor(Math.random() * available.length)];
    };

    const tick = async () => {
      if (stopped) return;
      try {
        setControllerLastTickAt(Date.now());
        const auctionRef = ref(database, `auctions/${id}`);
        const auctionSnap = await get(auctionRef);
        if (!auctionSnap.exists()) return;
        const a = auctionSnap.val();
        if (!a || a.status !== 'live' || a.locked) return;

        // Ensure there is a current player
        if (!a.currentPlayerId) {
          const next = await pickRandomAvailable();
          if (!next) {
            await update(auctionRef, { status: 'completed', locked: true, currentPlayerId: null });
            return;
          }
          await update(auctionRef, {
            currentPlayerId: next.id,
            currentLotStartedAt: Date.now(),
            currentLotLastBidAt: Date.now(),
          });
          return;
        }

        const playerId = a.currentPlayerId;
        const playerRef = ref(database, `auctions/${id}/players/${playerId}`);
        const playerSnap = await get(playerRef);
        if (!playerSnap.exists()) {
          await update(auctionRef, { currentPlayerId: null });
          return;
        }
        const p = playerSnap.val();
        const status = (p && p.status) || 'available';
        if (status !== 'available') {
          await update(auctionRef, { currentPlayerId: null });
          return;
        }

        const lastBidAt = Number(p.lastBidAt || a.currentLotLastBidAt || a.currentLotStartedAt || 0);
        if (!lastBidAt) return;
        if (Date.now() - lastBidAt < inactivityMs) return;

        // Auto-close this lot
        const soldToId = p.currentBidderId || null;
        const soldToName = p.currentBidderName || null;
        const soldToTeam = p.currentBidderTeamName || null;
        const soldPrice = Number(p.currentBid || 0);

        if (soldToId && soldPrice > 0) {
          await update(playerRef, {
            status: 'sold',
            soldToUserId: soldToId,
            soldToName,
            soldToTeamName: soldToTeam,
            soldPrice,
            soldAt: Date.now(),
          });
        } else {
          await update(playerRef, {
            status: 'unsold',
            soldAt: Date.now(),
          });
        }

        // Mark bids for this player (active -> won, outbid -> lost)
        try {
          const bidsRef = ref(database, `bids/${id}`);
          const bidsSnap = await get(bidsRef);
          if (bidsSnap.exists()) {
            const updates = {};
            bidsSnap.forEach((c) => {
              const bid = c.val();
              if (!bid || bid.playerId !== playerId) return;
              if (bid.status === 'active') updates[`${c.key}/status`] = 'won';
              if (bid.status === 'outbid') updates[`${c.key}/status`] = 'lost';
            });
            if (Object.keys(updates).length > 0) {
              await update(bidsRef, updates);
            }
          }
        } catch (bidStatusErr) {
          console.error('Error updating bid statuses:', bidStatusErr);
        }

        // Pick next player (FIX Bug 1: await fresh DB read)
        const next = await pickRandomAvailable();
        if (!next) {
          await update(auctionRef, { status: 'completed', locked: true, currentPlayerId: null });
          return;
        }
        await update(auctionRef, {
          currentPlayerId: next.id,
          currentLotStartedAt: Date.now(),
          currentLotLastBidAt: Date.now(),
        });
      } catch (e) {
        console.error('Sports lot tick error:', e);
      }
    };

    const interval = setInterval(tick, 15000);
    tick();

    return () => {
      stopped = true;
      clearInterval(interval);
      setControllerRunning(false);
    };
  }, [id, auction?.status, auction?.locked, isSportsAuction, isAuctioneer, items]);

  // Timer tick for sports auction (elapsed + countdown)
  useEffect(() => {
    if (!auction || auction.status !== 'live') return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [auction?.id, auction?.status]);

  const fetchAuctionData = async () => {
    try {
      const auctionData = await auctionService.getAuction(id);
      setAuction(auctionData);

      const itemsData = await auctionService.getAuctionItems(id, {
        auctionType: auctionData.auction_type,
      });
      setItems(itemsData);

      if (itemsData.length > 0) {
        const updatedCurrent = currentItem && itemsData.find((it) => it.id === currentItem.id);
        const nextItem = updatedCurrent || itemsData[0];
        setCurrentItem(nextItem);
        const price = nextItem.current_price ?? nextItem.base_price ?? nextItem.currentBid ?? nextItem.basePrice;
        setBidAmount(String(price ?? ''));
      }
    } catch (err) {
      console.error('Error fetching auction data:', err);
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    setError('');

    const amount = parseFloat(bidAmount);
    if (!currentItem || Number.isNaN(amount)) {
      setError('Invalid bid amount or player selection.');
      return;
    }

    const currentPrice =
      currentItem.current_price ??
      currentItem.currentBid ??
      currentItem.base_price ??
      currentItem.basePrice ??
      0;

    if (amount <= currentPrice) {
      setError('Bid must be higher than current price');
      return;
    }

    try {
      const auctionType = auction?.auction_type || auction?.auctionType;
      const isItemAuction = auctionType === 'item';

      if (isItemAuction) {
        await bidService.placeBidForItem(id, currentItem.id, amount);
      } else {
        await bidService.placeBid(id, currentItem.id, amount);
      }

      const increment = auction?.minIncrement || 100000;
      setBidAmount((amount + increment).toString());
      setError('');

      // In-app notification for successful bid
      addNotification({
        type: 'success',
        title: 'Bid placed successfully',
        message: `Your bid of ${formatCurrency(amount)} on ${currentItem.name} is now leading (if not outbid).`,
        link: `/auction/live/${id}`,
      });
    } catch (err) {
      // FIX (Bug 4): Don't suppress bid errors — show them to the user
      // (Only background listeners should suppress permission_denied)
      setError(err.message || 'Failed to place bid');
    }
  };

  // Keep suggested bid amount aligned with the live current price.
  // Don’t override if user already typed a higher amount.
  useEffect(() => {
    if (!currentItem) return;
    const increment = Number(auction?.minIncrement) || (isSportsAuction ? 100000 : 100);
    const currentPrice =
      currentItem.current_price ??
      currentItem.currentBid ??
      currentItem.base_price ??
      currentItem.basePrice ??
      0;
    const suggested = Number(currentPrice) + increment;
    const typed = Number(bidAmount);
    if (!bidAmount || !Number.isFinite(typed) || typed <= Number(currentPrice)) {
      setBidAmount(String(suggested));
    }
  }, [currentItem?.id, currentItem?.current_price, currentItem?.currentBid, auction?.minIncrement, isSportsAuction]);

  const selectItem = (item) => {
    setCurrentItem(item);
    setBidAmount((item.current_price || item.base_price).toString());
    setError('');
  };

  const handleSetAutoBid = async (e) => {
    e.preventDefault();
    setError('');
    if (!currentItem) {
      setError('Select a player or item before enabling auto-bid.');
      return;
    }
    const max = parseFloat(autoBidMax);
    if (!Number.isFinite(max) || max <= 0) {
      setError('Enter a valid maximum auto-bid amount.');
      return;
    }
    try {
      const callable = httpsCallable(functions, 'setAutoBid');
      await callable({
        auctionId: id,
        playerId: currentItem.id,
        maxAmount: max,
      });
      addNotification({
        type: 'success',
        title: 'Auto-bid enabled',
        message: `Auto-bid up to ${formatCurrency(max)} has been set for ${currentItem.name}.`,
        link: `/auction/live/${id}`,
      });
    } catch (err) {
      // FIX (Bug 4): Don't suppress auto-bid errors either
      setError(err.message || 'Failed to set auto-bid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const startMs = auction?.startDate ?? auction?.start_time;
  const endMs = auction?.endDate ?? auction?.end_time;
  const elapsedSeconds = startMs != null ? Math.max(0, (now - startMs) / 1000) : null;
  const remainingSeconds = endMs != null ? Math.max(0, (endMs - now) / 1000) : null;
  const elapsedDisplay = elapsedSeconds != null ? formatTimeUnits(elapsedSeconds).text : '--:--';
  const remainingDisplay = remainingSeconds != null ? formatTimeUnits(remainingSeconds).text : '--:--';
  // FIX (Bug 2): Compute per-player lot countdown
  const lotRemainingSeconds = isSportsAuction && lotLastBidAt != null
    ? Math.max(0, (LOT_TIMEOUT_MS - (now - lotLastBidAt)) / 1000)
    : null;
  const lotRemainingDisplay = lotRemainingSeconds != null
    ? formatTimeUnits(Math.round(lotRemainingSeconds)).text
    : null;
  const lotUrgent = lotRemainingSeconds != null && lotRemainingSeconds <= 30;

  const itemLabel = isSportsAuction ? 'players' : 'items';
  const soldCount = items.filter((i) => i.status === 'sold').length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((soldCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="live-auction-page">
        <div className="container">
          <div className="loading">Loading auction...</div>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="live-auction-page">
        <div className="container">
          <div className="error-state card">
            <h2>Auction not found</h2>
            <button onClick={() => navigate('/auctions')} className="btn btn-primary">
              Back to Auctions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-auction-page">
      <div className="container">
        {/* Auction Header */}
        <div className="auction-header-section card">
          <div className="auction-title-area">
            <h1>{auction.title}</h1>
            <span className={`badge badge-${auction.status === 'live' ? 'success' : 'warning'}`}>
              {auction.status === 'live' ? '🔴 Live' : auction.status}
            </span>
            {isSportsAuction && isAuctioneer && (
              <span
                className={`badge badge-${controllerRunning ? 'success' : 'warning'}`}
                title={
                  controllerRunning
                    ? `Controller running${controllerLastTickAt ? ` (last tick: ${new Date(controllerLastTickAt).toLocaleTimeString()})` : ''}`
                    : 'Controller paused'
                }
              >
                {controllerRunning ? 'Controller: ON' : 'Controller: OFF'}
              </span>
            )}
          </div>
          <p>{auction.description}</p>

          {/* Timer + Progress bar (live auction) */}
          {auction.status === 'live' && (
            <div className="live-auction-bar">
              <div className="live-timer-row">
                {isSportsAuction && startMs != null && (
                  <div className="live-timer-block">
                    <span className="live-timer-label">Time elapsed</span>
                    <span className="live-timer-value live-timer-elapsed">{elapsedDisplay}</span>
                  </div>
                )}
                {endMs != null && (
                  <div className="live-timer-block">
                    <span className="live-timer-label">{remainingSeconds !== null && remainingSeconds <= 0 ? 'Ended' : 'Time remaining'}</span>
                    <span className={`live-timer-value live-timer-remaining ${remainingSeconds !== null && remainingSeconds <= 0 ? 'ended' : ''}`}>
                      {remainingSeconds !== null && remainingSeconds <= 0 ? '0:00' : remainingDisplay}
                    </span>
                  </div>
                )}
              </div>
              <div className="live-progress-wrap">
                <div className="live-progress-header">
                  <span className="live-progress-title">Live progress</span>
                  <span className="live-progress-count">
                    {soldCount} / {totalCount} {itemLabel} sold
                  </span>
                </div>
                <div className="live-progress-track">
                  <div
                    className="live-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                    role="progressbar"
                    aria-valuenow={soldCount}
                    aria-valuemin={0}
                    aria-valuemax={totalCount}
                    aria-label={`${soldCount} of ${totalCount} ${itemLabel} sold`}
                  />
                </div>
                {currentItem && (
                  <div className="live-now-bidding">
                    <span className="live-now-label">Now bidding on:</span>
                    <span className="live-now-name">{currentItem.name}</span>
                    {/* FIX (Bug 2): Per-player lot timeout countdown */}
                    {isSportsAuction && lotRemainingDisplay && (
                      <span
                        className={`lot-countdown${lotUrgent ? ' lot-countdown-urgent' : ''}`}
                        title="Time before this lot auto-closes due to inactivity"
                      >
                        ⏱ Lot closes in: <strong>{lotRemainingDisplay}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {auction.auction_type === 'sports_player' && (auction.joinCode || auction.join_code) && (
            <div className="join-code-box">
              <span className="join-code-label">Join code</span>
              <div className="join-code-value-wrap">
                <code className="join-code-value">{auction.joinCode || auction.join_code}</code>
                <button
                  type="button"
                  className="btn btn-outline btn-sm join-code-copy"
                  onClick={() => {
                    const c = auction.joinCode || auction.join_code;
                    navigator.clipboard?.writeText(c);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="auction-content">
          {/* Current Item Section */}
          <div className="current-item-section">
            {currentItem ? (
              <div className="current-item-card card">
                <div className="item-badge">
                  {auction.auction_type === 'sports_player' ? '⚽ Player' : '🛍️ Item'}
                </div>
                
                <h2>{currentItem.name}</h2>
                <p className="item-description">{currentItem.description}</p>
                
                {auction.auction_type === 'sports_player' && currentItem.player_details && (
                  <div className="player-stats">
                    {JSON.parse(currentItem.player_details).role && (
                      <div className="stat-item">
                        <span className="stat-label">Position:</span>
                        <span className="stat-value">
                          {JSON.parse(currentItem.player_details).role}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="price-section">
                  <div className="price-item">
                    <span className="price-label">Base Price</span>
                    <span className="price-value">{formatCurrency(currentItem.base_price)}</span>
                  </div>
                  <div className="price-item current">
                    <span className="price-label">Current Bid</span>
                    <span className="price-value highlight">
                      {formatCurrency(currentItem.current_price || currentItem.base_price)}
                    </span>
                  </div>
                </div>

                {(() => {
                  const auctionCreatorId = auction?.createdBy ?? auction?.creator_id;
                  const isAuctioneer = user && auctionCreatorId && user.uid === auctionCreatorId;
                  return auction.status === 'live' && user && !isAuctioneer && (
                  <form onSubmit={handlePlaceBid} className="bid-form">
                    {error && (
                      <div className="alert alert-error">
                        {error}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Your Bid Amount</label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount"
                        step="100000"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Max Auto-Bid Amount (optional)</label>
                      <div className="auto-bid-row">
                        <input
                          type="number"
                          value={autoBidMax}
                          onChange={(e) => setAutoBidMax(e.target.value)}
                          placeholder="Set maximum auto-bid"
                          step="100000"
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={handleSetAutoBid}
                        >
                          Enable Auto-Bid
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary w-full">
                      Place Bid
                    </button>
                  </form>
                  );
                })()}
              </div>
            ) : (
              <div className="card">
                <p className="text-center">No items in this auction</p>
              </div>
            )}

            {/* Bid History — FIX: scoped to the currently active player/item */}
            <BidHistory
              auctionId={id}
              playerId={currentItem?.id ?? null}
              playerName={currentItem?.name ?? null}
            />
          </div>

          {/* Items List Sidebar */}
          <div className="items-sidebar">
            <div className="items-list card">
              <h3>All Items ({items.length})</h3>
              <div className="items-scroll">
                {items.map(item => {
                  // FIX: For sports auctions, only the auctioneer can change the active lot.
                  // Bidders see a read-only list — clicking does nothing for them.
                  const isClickable = !isSportsAuction || isAuctioneer;
                  const isCurrentLot = currentItem?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={[
                        'item-card',
                        isCurrentLot ? 'active' : '',
                        isSportsAuction && !isAuctioneer ? 'item-card-readonly' : '',
                        isCurrentLot && isSportsAuction ? 'item-card-current-lot' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={isClickable ? () => selectItem(item) : undefined}
                      title={
                        isSportsAuction && !isAuctioneer && !isCurrentLot
                          ? 'The auctioneer controls which player is up for bidding'
                          : undefined
                      }
                    >
                      {isCurrentLot && isSportsAuction && (
                        <span className="current-lot-badge">🎯 On Auction</span>
                      )}
                      <h4>{item.name}</h4>
                      <div className="item-price">
                        {formatCurrency(item.current_price || item.base_price)}
                      </div>
                      <span className={`item-status ${item.status}`}>
                        {item.status === 'available' && isCurrentLot && isSportsAuction
                          ? 'bidding'
                          : item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveAuction;
