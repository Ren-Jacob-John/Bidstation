// ---------------------------------------------------------------------------
// client/src/services/bidService.js
// ---------------------------------------------------------------------------
import {
  ref, push, set, get, update, runTransaction, onValue,
} from 'firebase/database';
import { database, fireAuth } from '../firebase/firebase.config';

export const placeBid = async (auctionId, playerId, bidAmount) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (!auctionId) throw new Error('Auction not found. Please refresh and try again.');
    if (!playerId) throw new Error('Player not found. Please refresh and try again.');

    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const bidderName = userSnapshot.val()?.username || user.email;

    const repRef = ref(database, `sportsAuctions/${auctionId}/representatives/${user.uid}`);
    const repSnap = await get(repRef);
    if (!repSnap.exists()) throw new Error('You must register a team for this sports auction before bidding. Join via the auction code first.');
    const repValue = repSnap.val();
    const teamName = typeof repValue === 'string' ? repValue : repValue?.teamName;

    const auctionRef = ref(database, `auctions/${auctionId}`);
    const auctionSnap = await get(auctionRef);
    const auction = auctionSnap.exists() ? auctionSnap.val() : {};
    if (auction.locked) throw new Error('This auction is locked and no longer accepts bids.');
    const minIncrement = Number(auction.minIncrement) || 100000;

    const playerRef = ref(database, `auctions/${auctionId}/players/${playerId}`);
    const playerSnap = await get(playerRef);
    if (!playerSnap.exists()) throw new Error('Player not found.');

    let newBid = null;
    await runTransaction(playerRef, (player) => {
      if (player === null) throw new Error('Player not found');
      if (player.status && player.status !== 'available') throw new Error('Bidding has ended for this player.');
      const currentBid = player.currentBid || player.basePrice;
      const minAllowed = (currentBid || 0) + minIncrement;
      if (bidAmount < minAllowed) throw new Error(`Bid must be at least ₹${minIncrement.toLocaleString()} higher than current bid of ₹${currentBid.toLocaleString()}`);
      player.currentBid = bidAmount;
      player.currentBidderId = user.uid;
      player.currentBidderName = bidderName;
      if (teamName) player.currentBidderTeamName = teamName;
      player.lastBidAt = Date.now();
      return player;
    });

    const bidsRef = ref(database, `bids/${auctionId}`);
    const newBidRef = push(bidsRef);
    const playerSnapshot = await get(playerRef);
    const playerData = playerSnapshot.val();
    newBid = { id: newBidRef.key, auctionId, playerId, playerName: playerData.name, bidderId: user.uid, bidderName, teamName: teamName || null, amount: bidAmount, timestamp: Date.now(), status: 'active' };
    await set(newBidRef, newBid);

    const allBidsSnap = await get(bidsRef);
    if (allBidsSnap.exists()) {
      const updates = {};
      allBidsSnap.forEach((s) => { const b = s.val(); if (b.playerId === playerId && b.status === 'active' && b.id !== newBid.id) updates[`${s.key}/status`] = 'outbid'; });
      if (Object.keys(updates).length > 0) await update(bidsRef, updates);
    }
    return newBid;
  } catch (error) { console.error('Error placing bid:', error); throw error; }
};

export const placeBidForItem = async (auctionId, itemId, bidAmount) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const userSnapshot = await get(ref(database, `users/${user.uid}`));
    const bidderName = userSnapshot.val()?.username || user.email;
    const auctionSnap = await get(ref(database, `auctions/${auctionId}`));
    const auction = auctionSnap.exists() ? auctionSnap.val() : {};
    if (auction.locked) throw new Error('This auction is locked and no longer accepts bids.');
    const minIncrement = Number(auction.minIncrement) || 100;
    const itemRef = ref(database, `auctions/${auctionId}/items/${itemId}`);
    await runTransaction(itemRef, (item) => {
      if (item === null) throw new Error('Item not found');
      if (item.status && item.status !== 'available') throw new Error('Bidding has ended for this item.');
      const currentBid = item.currentBid ?? item.current_price ?? item.basePrice ?? item.base_price;
      const minAllowed = (currentBid || 0) + minIncrement;
      if (bidAmount < minAllowed) throw new Error(`Bid must be at least ₹${minIncrement.toLocaleString()} higher than current bid of ₹${Number(currentBid).toLocaleString()}`);
      item.currentBid = bidAmount; item.currentBidderId = user.uid; item.currentBidderName = bidderName; item.lastBidAt = Date.now();
      return item;
    });
    const itemSnapshot = await get(itemRef);
    const itemData = itemSnapshot.val();
    const bidsRef = ref(database, `bids/${auctionId}`);
    const newBidRef = push(bidsRef);
    const newBid = { id: newBidRef.key, auctionId, playerId: itemId, playerName: itemData.name, bidderId: user.uid, bidderName, amount: bidAmount, timestamp: Date.now(), status: 'active' };
    await set(newBidRef, newBid);
    const allBidsSnap = await get(bidsRef);
    if (allBidsSnap.exists()) {
      const updates = {};
      allBidsSnap.forEach((s) => { const b = s.val(); if (b.playerId === itemId && b.status === 'active' && b.id !== newBid.id) updates[`${s.key}/status`] = 'outbid'; });
      if (Object.keys(updates).length > 0) await update(bidsRef, updates);
    }
    return newBid;
  } catch (error) { console.error('Error placing bid on item:', error); throw error; }
};

export const getAuctionBids = async (auctionId, options = {}) => {
  try {
    const snapshot = await get(ref(database, `bids/${auctionId}`));
    if (!snapshot.exists()) return [];
    let bids = [];
    snapshot.forEach((c) => { bids.push({ id: c.key, ...c.val() }); });
    if (options.playerId) bids = bids.filter(b => b.playerId === options.playerId);
    if (options.bidderId) bids = bids.filter(b => b.bidderId === options.bidderId);
    if (options.status) bids = bids.filter(b => b.status === options.status);
    bids.sort((a, b) => b.timestamp - a.timestamp);
    if (options.limit) bids = bids.slice(0, options.limit);
    return bids;
  } catch (error) { console.error('Error getting auction bids:', error); throw error; }
};

export const getPlayerBids = async (auctionId, playerId) => getAuctionBids(auctionId, { playerId });

export const getMyBids = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const snapshot = await get(ref(database, 'bids'));
    if (!snapshot.exists()) return [];
    const allBids = [];
    snapshot.forEach((auctionSnapshot) => {
      const auctionId = auctionSnapshot.key;
      auctionSnapshot.forEach((bidSnapshot) => { const bid = bidSnapshot.val(); if (bid.bidderId === user.uid) allBids.push({ id: bidSnapshot.key, auctionId, ...bid }); });
    });
    allBids.sort((a, b) => b.timestamp - a.timestamp);
    const auctionsSnapshot = await get(ref(database, 'auctions'));
    if (auctionsSnapshot.exists()) {
      const map = {}; auctionsSnapshot.forEach((s) => { map[s.key] = s.val(); });
      allBids.forEach(bid => { const a = map[bid.auctionId]; if (a) bid.auctionTitle = a.title; });
    }
    return allBids;
  } catch (error) { console.error('Error getting my bids:', error); throw error; }
};

export const getMyActiveBids = async () => (await getMyBids()).filter(b => b.status === 'active');
export const getMyWinningBids = async () => (await getMyBids()).filter(b => b.status === 'won');
export const updateBidStatus = async (auctionId, bidId, status) => { await update(ref(database, `bids/${auctionId}/${bidId}`), { status }); return { success: true }; };

export const finalizeAuctionBids = async (auctionId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');
    const auctionSnapshot = await get(ref(database, `auctions/${auctionId}`));
    if (!auctionSnapshot.exists()) throw new Error('Auction not found');
    if (auctionSnapshot.val().createdBy !== user.uid) throw new Error('Unauthorized');
    const bidsSnapshot = await get(ref(database, `bids/${auctionId}`));
    if (!bidsSnapshot.exists()) return { success: true, winningBids: 0 };
    const updates = {}; let winningCount = 0;
    bidsSnapshot.forEach((s) => { const b = s.val(); if (b.status === 'active') { updates[`${s.key}/status`] = 'won'; winningCount++; } else if (b.status === 'outbid') updates[`${s.key}/status`] = 'lost'; });
    await update(ref(database, `bids/${auctionId}`), updates);
    return { success: true, winningBids: winningCount };
  } catch (error) { console.error('Error finalizing auction bids:', error); throw error; }
};

export const getUserBidStats = async (userId = null) => {
  try {
    const targetUserId = userId || fireAuth.currentUser?.uid;
    if (!targetUserId) throw new Error('User not authenticated');
    const allBids = userId ? [] : await getMyBids();
    if (userId) { const snap = await get(ref(database, 'bids')); if (snap.exists()) snap.forEach((a) => a.forEach((b) => { const bid = b.val(); if (bid.bidderId === userId) allBids.push(bid); })); }
    return { totalBids: allBids.length, activeBids: allBids.filter(b => b.status === 'active').length, wonBids: allBids.filter(b => b.status === 'won').length, lostBids: allBids.filter(b => b.status === 'lost').length, totalAmountBid: allBids.reduce((s, b) => s + (b.amount || 0), 0), averageBid: allBids.length > 0 ? allBids.reduce((s, b) => s + (b.amount || 0), 0) / allBids.length : 0, winRate: allBids.length > 0 ? (allBids.filter(b => b.status === 'won').length / allBids.length) * 100 : 0 };
  } catch (error) { console.error('Error getting user bid stats:', error); throw error; }
};

export const hasActiveBidOnPlayer = async (auctionId, playerId) => { try { const user = fireAuth.currentUser; if (!user) return false; return (await getAuctionBids(auctionId, { playerId, bidderId: user.uid, status: 'active' })).length > 0; } catch { return false; } };
export const getHighestBid = async (auctionId, playerId) => { const bids = await getPlayerBids(auctionId, playerId); if (!bids.length) return null; return bids.reduce((h, b) => b.amount > (h?.amount || 0) ? b : h, bids[0]); };
export const getBidLeaderboard = async (auctionId, sortBy = 'amount') => {
  const bids = await getAuctionBids(auctionId);
  const stats = {};
  bids.forEach(b => { if (!stats[b.bidderId]) stats[b.bidderId] = { bidderId: b.bidderId, bidderName: b.bidderName, totalAmount: 0, bidCount: 0, wonCount: 0 }; stats[b.bidderId].totalAmount += b.amount; stats[b.bidderId].bidCount++; if (b.status === 'won') stats[b.bidderId].wonCount++; });
  const board = Object.values(stats);
  if (sortBy === 'amount') board.sort((a, b) => b.totalAmount - a.totalAmount); else if (sortBy === 'count') board.sort((a, b) => b.bidCount - a.bidCount); else if (sortBy === 'won') board.sort((a, b) => b.wonCount - a.wonCount);
  return board;
};

export const listenToAuctionBids = (auctionId, callback, onError) => {
  const handleError = (err) => { if (typeof onError === 'function') onError(err); else console.error('listenToAuctionBids error:', err); };
  const unsub = onValue(ref(database, `bids/${auctionId}`), (snap) => {
    if (!snap.exists()) { callback([]); return; }
    const all = []; snap.forEach((c) => { all.push({ id: c.key, ...c.val() }); });
    all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    callback(all);
  }, handleError);
  return () => { if (typeof unsub === 'function') unsub(); };
};

// ---------------------------------------------------------------------------
// AUTO-BID
// ---------------------------------------------------------------------------

/**
 * Enable auto-bid: writes maxAmount + active:true to autoBids/{auctionId}/{entityId}/{uid}
 */
export const setAutoBid = async (auctionId, entityId, maxAmount) => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const max = Number(maxAmount);
  if (!Number.isFinite(max) || max <= 0) throw new Error('Invalid auto-bid amount');
  await set(ref(database, `autoBids/${auctionId}/${entityId}/${user.uid}`), { maxAmount: max, active: true, createdAt: Date.now() });
  return { success: true };
};

/**
 * Disable auto-bid: sets active:false
 */
export const cancelAutoBid = async (auctionId, entityId) => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('User not authenticated');
  await update(ref(database, `autoBids/${auctionId}/${entityId}/${user.uid}`), { active: false });
  return { success: true };
};

/**
 * Real-time listener — tells the UI whether auto-bid is enabled for the current
 * user on a specific entity (player or item). Calls back { active, maxAmount } or null.
 * Returns cleanup function.
 */
export const listenToMyAutoBid = (auctionId, entityId, callback) => {
  const user = fireAuth.currentUser;
  if (!user) { callback(null); return () => {}; }
  const unsub = onValue(ref(database, `autoBids/${auctionId}/${entityId}/${user.uid}`), (snap) => {
    if (!snap.exists()) { callback(null); return; }
    const v = snap.val();
    callback({ active: v.active === true, maxAmount: Number(v.maxAmount) || 0 });
  });
  return () => { if (typeof unsub === 'function') unsub(); };
};

/**
 * Auto-bid engine.
 * Works for both sports (isSports=true, players path) and item auctions (isSports=false).
 * Safe to call from any user's tab — uses runTransaction to avoid duplicate bids.
 * Recursively chains if the person who just got outbid also has auto-bid set.
 */
export const runAutoBidCheck = async (
  auctionId, entityId, currentBidAmount, currentBidderId, isSports = true, depth = 0
) => {
  if (depth > 20) { console.warn('[AutoBid] Chain depth limit reached.'); return; }
  try {
    const auctionSnap = await get(ref(database, `auctions/${auctionId}`));
    if (!auctionSnap.exists()) return;
    const auction = auctionSnap.val();
    if (auction.locked || auction.status !== 'live') return;
    const minIncrement = Number(auction.minIncrement) || (isSports ? 100000 : 100);
    const entityPath = isSports
      ? `auctions/${auctionId}/players/${entityId}`
      : `auctions/${auctionId}/items/${entityId}`;
    const entitySnap = await get(ref(database, entityPath));
    if (!entitySnap.exists()) return;
    const entity = entitySnap.val();
    if (entity.status && entity.status !== 'available') return;

    const autoBidsSnap = await get(ref(database, `autoBids/${auctionId}/${entityId}`));
    if (!autoBidsSnap.exists()) return;

    const nextAmount = currentBidAmount + minIncrement;
    let best = null;
    autoBidsSnap.forEach((child) => {
      const cfg = child.val(); const uid = child.key;
      if (!cfg || cfg.active === false) return;
      if (uid === currentBidderId) return;
      const maxAmt = Number(cfg.maxAmount || 0);
      if (!Number.isFinite(maxAmt) || maxAmt < nextAmount) return;
      if (!best || maxAmt > best.maxAmount) best = { uid, maxAmount: maxAmt };
    });
    if (!best) return;

    let autoBidderName = 'Auto-bidder';
    try { const s = await get(ref(database, `users/${best.uid}`)); if (s.exists()) autoBidderName = s.val().username || s.val().displayName || autoBidderName; } catch (_) {}

    let autoBidderTeamName = null;
    if (isSports) {
      try { const s = await get(ref(database, `sportsAuctions/${auctionId}/representatives/${best.uid}`)); if (s.exists()) { const v = s.val(); autoBidderTeamName = typeof v === 'string' ? v : (v && v.teamName) || null; } } catch (_) {}
    }

    const entityRef = ref(database, entityPath);
    let placed = false;
    await runTransaction(entityRef, (current) => {
      if (!current) return current;
      if (current.status && current.status !== 'available') return current;
      const liveBid = Number(current.currentBid || current.basePrice || current.base_price || 0);
      if (current.currentBidderId === best.uid) return current; // already leading
      if (liveBid >= nextAmount) return current;               // already outbid by someone else
      current.currentBid = nextAmount;
      current.currentBidderId = best.uid;
      current.currentBidderName = autoBidderName;
      if (isSports && autoBidderTeamName) current.currentBidderTeamName = autoBidderTeamName;
      current.lastBidAt = Date.now();
      placed = true;
      return current;
    });
    if (!placed) return;

    const bidsRef = ref(database, `bids/${auctionId}`);
    const allBidsSnap = await get(bidsRef);
    if (allBidsSnap.exists()) {
      const outbidUpdates = {};
      allBidsSnap.forEach((c) => { const b = c.val(); if (b && b.playerId === entityId && b.status === 'active') outbidUpdates[`${c.key}/status`] = 'outbid'; });
      if (Object.keys(outbidUpdates).length > 0) await update(bidsRef, outbidUpdates);
    }

    const newBidRef = push(bidsRef);
    await set(newBidRef, { id: newBidRef.key, auctionId, playerId: entityId, playerName: entity.name || null, bidderId: best.uid, bidderName: autoBidderName, teamName: autoBidderTeamName || null, amount: nextAmount, timestamp: Date.now(), status: 'active', autoBid: true });
    console.log(`[AutoBid] depth=${depth} ₹${nextAmount.toLocaleString()} for "${autoBidderName}" on "${entity.name || entityId}"`);

    // Chain — check if the outbid user also has auto-bid
    setTimeout(() => { runAutoBidCheck(auctionId, entityId, nextAmount, best.uid, isSports, depth + 1); }, 600);
  } catch (err) { console.error('[AutoBid] runAutoBidCheck error:', err); }
};

export default {
  placeBid, placeBidForItem, getAuctionBids, getPlayerBids, getMyBids,
  getMyActiveBids, getMyWinningBids, updateBidStatus, finalizeAuctionBids,
  getUserBidStats, hasActiveBidOnPlayer, getHighestBid, getBidLeaderboard,
  listenToAuctionBids, setAutoBid, cancelAutoBid, listenToMyAutoBid, runAutoBidCheck,
};