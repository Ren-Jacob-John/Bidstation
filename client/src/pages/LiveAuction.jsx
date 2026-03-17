import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
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
  const LOT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const [lotLastBidAt, setLotLastBidAt] = useState(null);

  // ── FEATURE 1: Player auto-advance notification state ──────────────────────
  const [playerTransition, setPlayerTransition] = useState(null); // { prevName, nextName }
  const prevCurrentItemIdRef = useRef(null);

  // ── FEATURE 2: Shared contact details state ────────────────────────────────
  const [sharedContacts, setSharedContacts] = useState(null);
  const [sharedContactsLoading, setSharedContactsLoading] = useState(false);

  // ── FEATURE 3: Team roster state ──────────────────────────────────────────
  const [showTeamRoster, setShowTeamRoster] = useState(false);

  // ── AUTO-BID STATE ──────────────────────────────────────────────────────────
  // { active: bool, maxAmount: number } | null  — real-time from Firebase
  const [autoBidState, setAutoBidState] = useState(null);
  const [autoBidInput, setAutoBidInput] = useState('');
  const [autoBidLoading, setAutoBidLoading] = useState(false);
  const [justOutbid, setJustOutbid] = useState(false);
  const currentItemRef = useRef(null);
  const autoBidListenerCleanupRef = useRef(null);
  useEffect(() => { currentItemRef.current = currentItem; }, [currentItem]);

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

  // Real-time auction updates
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

  // Real-time items/players updates
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
            soldToTeamName: p.soldToTeamName || null,
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

      if (mapped.length === 0) {
        setCurrentItem(null);
        return;
      }

      if (isSportsAuction) {
        const currentId = auction?.currentPlayerId;
        const current = currentId ? mapped.find((it) => it.id === currentId) : null;
        setCurrentItem(current || null);
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

  // ── FEATURE 1: Detect player change and show transition toast ────────────
  useEffect(() => {
    if (!isSportsAuction || !auction?.currentPlayerId) return;

    const prevId = prevCurrentItemIdRef.current;
    const nextId = auction.currentPlayerId;

    if (prevId && prevId !== nextId) {
      // Find names from items list
      const prevPlayer = items.find((it) => it.id === prevId);
      const nextPlayer = items.find((it) => it.id === nextId);
      if (nextPlayer) {
        setPlayerTransition({
          prevName: prevPlayer?.name || 'Previous player',
          nextName: nextPlayer.name,
        });
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => setPlayerTransition(null), 5000);
        return () => clearTimeout(timer);
      }
    }
    prevCurrentItemIdRef.current = nextId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auction?.currentPlayerId, isSportsAuction]);

  // Keep prevCurrentItemIdRef in sync on first load
  useEffect(() => {
    if (auction?.currentPlayerId && !prevCurrentItemIdRef.current) {
      prevCurrentItemIdRef.current = auction.currentPlayerId;
    }
  }, [auction?.currentPlayerId]);

  // ── FEATURE 2: Load shared contacts when auction is completed ─────────────
  useEffect(() => {
    if (!auction || auction.status !== 'completed') {
      setSharedContacts(null);
      return;
    }

    const loadContacts = async () => {
      setSharedContactsLoading(true);
      try {
        const contactsRef = ref(database, `auctions/${id}/sharedContacts`);
        const snap = await get(contactsRef);
        if (snap.exists()) {
          setSharedContacts(snap.val());
        }
      } catch (err) {
        console.error('Error loading shared contacts:', err);
      } finally {
        setSharedContactsLoading(false);
      }
    };

    loadContacts();
  }, [auction?.status, id]);

  // ── AUTO-BID: Real-time per-entity listener ──────────────────────────────
  // Re-attaches whenever the viewed entity changes so the button reflects the
  // correct enabled/disabled state for exactly this player or item.
  useEffect(() => {
    if (typeof autoBidListenerCleanupRef.current === 'function') {
      autoBidListenerCleanupRef.current();
      autoBidListenerCleanupRef.current = null;
    }
    if (!currentItem?.id || !user || isAuctioneer) {
      setAutoBidState(null);
      return;
    }
    const cleanup = bidService.listenToMyAutoBid(id, currentItem.id, (state) => {
      setAutoBidState(state);
    });
    autoBidListenerCleanupRef.current = cleanup;
    return () => {
      if (typeof autoBidListenerCleanupRef.current === 'function') {
        autoBidListenerCleanupRef.current();
        autoBidListenerCleanupRef.current = null;
      }
    };
  }, [currentItem?.id, user, id, isAuctioneer]);

  // ── AUTO-BID: Outbid watcher — fires counter-bid from THIS user's tab ─────
  // Every bidder watches the items/players node. When their auto-bid is active
  // and they detect they've been outbid, they immediately trigger runAutoBidCheck.
  useEffect(() => {
    if (!id || !user || isAuctioneer || !auction) return;
    if (auction.status !== 'live') return;
    const auctionType = auction?.auction_type || auction?.auctionType;
    const isItemAuction = auctionType === 'item';
    const path = isItemAuction ? `auctions/${id}/items` : `auctions/${id}/players`;
    const unsub = onValue(ref(database, path), async (snap) => {
      if (!snap.exists()) return;
      snap.forEach(async (child) => {
        const entity = child.val();
        if (!entity) return;
        if (entity.status && entity.status !== 'available') return;
        const entityId = child.key;
        const leaderId = entity.currentBidderId;
        if (leaderId === user.uid) return; // we're already leading
        const autoBidSnap = await get(ref(database, `autoBids/${id}/${entityId}/${user.uid}`)).catch(() => null);
        if (!autoBidSnap || !autoBidSnap.exists()) return;
        const cfg = autoBidSnap.val();
        if (!cfg || cfg.active === false) return;
        const currentBid = Number(entity.currentBid ?? entity.current_price ?? entity.basePrice ?? entity.base_price ?? 0);
        const maxAmt = Number(cfg.maxAmount || 0);
        const minIncrement = Number(auction.minIncrement) || (isItemAuction ? 100 : 100000);
        if (currentBid + minIncrement <= maxAmt) {
          if (currentItemRef.current?.id === entityId) {
            setJustOutbid(true);
            setTimeout(() => setJustOutbid(false), 3000);
          }
          await bidService.runAutoBidCheck(id, entityId, currentBid, leaderId || '', !isItemAuction);
        }
      });
    });
    return () => { if (typeof unsub === 'function') unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.uid, isAuctioneer, auction?.status, auction?.auction_type, auction?.auctionType]);

  // ── AUTO-BID: Enable handler ────────────────────────────────────────────────
  const handleEnableAutoBid = async () => {
    setError('');
    if (!currentItem) { setError('Select a player or item first.'); return; }
    const max = parseFloat(autoBidInput);
    if (!Number.isFinite(max) || max <= 0) { setError('Enter a valid maximum auto-bid amount.'); return; }
    const currentPrice = currentItem.current_price ?? currentItem.currentBid ?? currentItem.base_price ?? currentItem.basePrice ?? 0;
    if (max <= currentPrice) { setError('Max auto-bid must be higher than the current price.'); return; }
    setAutoBidLoading(true);
    try {
      await bidService.setAutoBid(id, currentItem.id, max);
      setAutoBidInput('');
      addNotification({ type: 'success', title: '🤖 Auto-bid enabled', message: `Auto-bid up to ${formatCurrency(max)} is active for ${currentItem.name}.`, link: `/auction/live/${id}` });
      // Immediately fire a check — maybe we should already be bidding
      const leaderId = currentItem.currentBidderId;
      if (leaderId !== user?.uid) {
        const auctionType = auction?.auction_type || auction?.auctionType;
        setTimeout(() => bidService.runAutoBidCheck(id, currentItem.id, Number(currentPrice), leaderId || '', auctionType !== 'item'), 400);
      }
    } catch (err) {
      setError(err.message || 'Failed to enable auto-bid');
    } finally { setAutoBidLoading(false); }
  };

  // ── AUTO-BID: Disable handler ───────────────────────────────────────────────
  const handleDisableAutoBid = async () => {
    setError('');
    if (!currentItem) return;
    setAutoBidLoading(true);
    try {
      await bidService.cancelAutoBid(id, currentItem.id);
      addNotification({ type: 'info', title: '🤖 Auto-bid disabled', message: `Auto-bid for ${currentItem.name} has been turned off.`, link: `/auction/live/${id}` });
    } catch (err) {
      setError(err.message || 'Failed to disable auto-bid');
    } finally { setAutoBidLoading(false); }
  };

  // Auctioneer-side sports lot controller
  useEffect(() => {
    if (!id || !auction || !isSportsAuction) return;
    if (auction.status !== 'live' || auction.locked) return;
    if (!isAuctioneer) return;

    const inactivityMs = 5 * 60 * 1000;
    let stopped = false;
    setControllerRunning(true);

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

        // Mark bids for this player
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

        // ── FEATURE 1: Pick next player and announce transition ─────────────
        const next = await pickRandomAvailable();
        if (!next) {
          await update(auctionRef, { status: 'completed', locked: true, currentPlayerId: null });
          return;
        }
        await update(auctionRef, {
          currentPlayerId: next.id,
          currentLotStartedAt: Date.now(),
          currentLotLastBidAt: Date.now(),
          // Store previous player name for transition announcement
          lastClosedPlayerName: p.name || null,
          lastClosedPlayerStatus: soldToId ? 'sold' : 'unsold',
          lastClosedPlayerSoldTo: soldToTeam || soldToName || null,
          lastClosedPlayerSoldPrice: soldPrice || null,
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

  // Timer tick
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

      addNotification({
        type: 'success',
        title: 'Bid placed successfully',
        message: `Your bid of ${formatCurrency(amount)} on ${currentItem.name} is now leading.`,
        link: `/auction/live/${id}`,
      });

      if (!isItemAuction) {
        setTimeout(() => {
          bidService.runAutoBidCheck(id, currentItem.id, amount, user?.uid, true);
        }, 800);
      } else {
        setTimeout(() => {
          bidService.runAutoBidCheck(id, currentItem.id, amount, user?.uid, false);
        }, 800);
      }
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    }
  };

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
      await bidService.setAutoBid(id, currentItem.id, max);
      setAutoBidMax('');
      addNotification({
        type: 'success',
        title: 'Auto-bid enabled',
        message: `Auto-bid up to ${formatCurrency(max)} set for ${currentItem.name}.`,
        link: `/auction/live/${id}`,
      });
    } catch (err) {
      setError(err.message || 'Failed to set auto-bid');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const startMs = auction?.startDate ?? auction?.start_time;
  const endMs = auction?.endDate ?? auction?.end_time;
  const elapsedSeconds = startMs != null ? Math.max(0, (now - startMs) / 1000) : null;
  const remainingSeconds = endMs != null ? Math.max(0, (endMs - now) / 1000) : null;
  const elapsedDisplay = elapsedSeconds != null ? formatTimeUnits(elapsedSeconds).text : '--:--';
  const remainingDisplay = remainingSeconds != null ? formatTimeUnits(remainingSeconds).text : '--:--';
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

  // ── FEATURE 3: Build team roster from sold players ────────────────────────
  const teamRoster = useMemo(() => {
    if (!isSportsAuction) return {};
    const roster = {};
    items.forEach((item) => {
      if (item.status === 'sold' && item.soldToTeamName) {
        if (!roster[item.soldToTeamName]) roster[item.soldToTeamName] = [];
        roster[item.soldToTeamName].push(item);
      }
    });
    return roster;
  }, [items, isSportsAuction]);

  // ── FEATURE 2: Check if current user is a relevant party for contacts ─────
  const isWinner = sharedContacts && sharedContacts.winnerUserId === user?.uid;
  const isAuctioneerForContacts = sharedContacts && sharedContacts.auctioneerUserId === user?.uid;
  const canSeeContacts = isWinner || isAuctioneerForContacts;

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

        {/* ── FEATURE 1: Player transition toast ─────────────────────────── */}
        {playerTransition && (
          <div className="player-transition-toast" role="status" aria-live="polite">
            <div className="player-transition-inner">
              <span className="player-transition-icon">🔄</span>
              <div className="player-transition-text">
                <strong>Next Player Up!</strong>
                <span>
                  {playerTransition.prevName} → <span className="player-transition-next">{playerTransition.nextName}</span>
                </span>
              </div>
              <button
                className="player-transition-close"
                onClick={() => setPlayerTransition(null)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

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

          {/* Timer + Progress bar */}
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

        {/* ── FEATURE 2: Shared contact details (completed auction) ──────── */}
        {auction.status === 'completed' && (
          <div className="shared-contacts-section card">
            {sharedContactsLoading ? (
              <p className="shared-contacts-loading">Loading contact details…</p>
            ) : canSeeContacts && sharedContacts ? (
              <>
                <h3 className="shared-contacts-title">📬 Contact Details</h3>
                <p className="shared-contacts-subtitle">
                  Shared between winner and auctioneer to complete this transaction.
                </p>
                <div className="shared-contacts-grid">
                  {/* Show winner's contact to the auctioneer */}
                  {isAuctioneerForContacts && sharedContacts.winnerContact && (
                    <div className="shared-contact-card shared-contact-winner">
                      <div className="shared-contact-role">🏆 Winner's Contact</div>
                      <ContactFields contact={sharedContacts.winnerContact} />
                    </div>
                  )}
                  {/* Show auctioneer's contact to the winner */}
                  {isWinner && sharedContacts.auctioneerContact && (
                    <div className="shared-contact-card shared-contact-auctioneer">
                      <div className="shared-contact-role">🎙️ Auctioneer's Contact</div>
                      <ContactFields contact={sharedContacts.auctioneerContact} />
                    </div>
                  )}
                  {/* Fallback if contact details not filled */}
                  {((isAuctioneerForContacts && !sharedContacts.winnerContact) ||
                    (isWinner && !sharedContacts.auctioneerContact)) && (
                    <p className="shared-contacts-missing">
                      Contact details not available — the other party has not filled in their profile contact details.
                    </p>
                  )}
                </div>
              </>
            ) : auction.status === 'completed' && !sharedContactsLoading && !canSeeContacts ? (
              <p className="shared-contacts-na">
                This auction has ended. Contact details are only visible to the winner and the auctioneer.
              </p>
            ) : null}
          </div>
        )}

        {/* ── FEATURE 3: Team Roster (sports auction, completed or live) ─── */}
        {isSportsAuction && Object.keys(teamRoster).length > 0 && (
          <div className="team-roster-section card">
            <div className="team-roster-header">
              <h3>🏟️ Team Rosters</h3>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowTeamRoster((v) => !v)}
              >
                {showTeamRoster ? 'Hide Rosters' : 'Show Rosters'}
              </button>
            </div>
            {showTeamRoster && (
              <div className="team-roster-grid">
                {Object.entries(teamRoster).map(([teamName, players]) => (
                  <div key={teamName} className="team-roster-card">
                    <div className="team-roster-name">{teamName}</div>
                    <div className="team-roster-count">{players.length} player{players.length !== 1 ? 's' : ''}</div>
                    <ul className="team-roster-list">
                      {players.map((p) => {
                        const details = (() => {
                          try { return p.player_details ? JSON.parse(p.player_details) : {}; } catch { return {}; }
                        })();
                        return (
                          <li key={p.id} className="team-roster-player">
                            <span className="roster-player-name">{p.name}</span>
                            {details.role && (
                              <span className="roster-player-role">{details.role}</span>
                            )}
                            <span className="roster-player-price">{formatCurrency(p.current_price || p.base_price)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
                  const isAuc = user && auctionCreatorId && user.uid === auctionCreatorId;
                  return auction.status === 'live' && user && !isAuc && (
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

                      {/* ── AUTO-BID PANEL ── */}
                      <div className={`autobid-panel${autoBidState?.active ? ' autobid-panel-active' : ''}`}>
                        <div className="autobid-header">
                          <div className="autobid-title-row">
                            <span className="autobid-icon">🤖</span>
                            <span className="autobid-title">Auto-Bid</span>
                            <span className={`autobid-status-badge${autoBidState?.active ? ' autobid-status-on' : ' autobid-status-off'}`}>
                              {autoBidState?.active ? 'ON' : 'OFF'}
                            </span>
                          </div>
                          {autoBidState?.active && autoBidState?.maxAmount && (
                            <span className="autobid-limit-display">
                              Max: {formatCurrency(autoBidState.maxAmount)}
                            </span>
                          )}
                        </div>

                        {autoBidState?.active ? (
                          <div className="autobid-enabled-body">
                            {justOutbid && (
                              <div className="alert alert-warning autobid-outbid-alert">
                                ⚡ You were outbid — auto-bid is countering!
                              </div>
                            )}
                            <p className="autobid-enabled-desc">
                              Auto-bid is active. We&apos;ll automatically outbid any competitor up to your limit of{' '}
                              <strong>{formatCurrency(autoBidState.maxAmount)}</strong>.
                            </p>
                            <button
                              type="button"
                              className="btn btn-danger w-full"
                              onClick={handleDisableAutoBid}
                              disabled={autoBidLoading}
                            >
                              {autoBidLoading ? 'Disabling…' : '🛑 Disable Auto-Bid'}
                            </button>
                          </div>
                        ) : (
                          <div className="autobid-setup-body">
                            <p className="autobid-setup-desc">
                              Set a maximum and we&apos;ll bid for you automatically when outbid.
                            </p>
                            <div className="autobid-input-row">
                              <input
                                type="number"
                                value={autoBidInput}
                                onChange={(e) => setAutoBidInput(e.target.value)}
                                placeholder="Max auto-bid amount"
                                step="100000"
                                min="0"
                              />
                              <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleEnableAutoBid}
                                disabled={autoBidLoading || !autoBidInput}
                              >
                                {autoBidLoading ? 'Enabling…' : '✅ Enable'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* ── END AUTO-BID PANEL ── */}

                      <button type="submit" className="btn btn-primary w-full">
                        Place Bid
                      </button>
                    </form>
                  );
                })()}
              </div>
            ) : auction.status === 'completed' ? (
              <div className="card">
                <p className="text-center">🏁 Auction has ended.</p>
              </div>
            ) : (
              <div className="card">
                <p className="text-center">No items in this auction</p>
              </div>
            )}

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
                      {/* Show team name for sold players */}
                      {isSportsAuction && item.status === 'sold' && item.soldToTeamName && (
                        <div className="item-sold-team">✅ {item.soldToTeamName}</div>
                      )}
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

// ── Helper component for contact fields ──────────────────────────────────────
const ContactFields = ({ contact }) => {
  if (!contact || typeof contact !== 'object') return <p className="no-contact">No details provided.</p>;

  const fields = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Address', key: 'address' },
  ];

  return (
    <dl className="contact-fields">
      {fields.map(({ label, key }) =>
        contact[key] ? (
          <div key={key} className="contact-field-row">
            <dt>{label}</dt>
            <dd>{contact[key]}</dd>
          </div>
        ) : null
      )}
    </dl>
  );
};

export default LiveAuction;