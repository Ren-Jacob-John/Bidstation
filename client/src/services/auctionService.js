// ---------------------------------------------------------------------------
// client/src/services/auctionService.js - Realtime Database Auction Operations
// ---------------------------------------------------------------------------
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  runTransaction
} from 'firebase/database';
import { database, fireAuth } from '../firebase/firebase.config';
import { generateJoinCode } from '../utils/helpers';

// ---------------------------------------------------------------------------
// Generate a unique join code for sports auctions (not already in DB)
// ---------------------------------------------------------------------------
async function generateUniqueJoinCode(maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateJoinCode(8);
    const joinCodeRef = ref(database, `joinCodes/${code}`);
    const snapshot = await get(joinCodeRef);
    if (!snapshot.exists()) return code;
  }
  throw new Error('Could not generate a unique join code. Please try again.');
}

// ---------------------------------------------------------------------------
// Create a new auction
// ---------------------------------------------------------------------------
export const createAuction = async (auctionData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const auctionsRef = ref(database, 'auctions');
    const newAuctionRef = push(auctionsRef);

    const isSportsAuction = (auctionData.auctionType || (auctionData.sport ? 'sports_player' : 'item')) === 'sports_player';
    let joinCode = null;
    if (isSportsAuction) {
      joinCode = await generateUniqueJoinCode();
      const joinCodeRef = ref(database, `joinCodes/${joinCode}`);
      await set(joinCodeRef, newAuctionRef.key);
    }

    const startTime = new Date(auctionData.startDate).getTime();
    const endTime = new Date(auctionData.endDate).getTime();
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
      throw new Error('Invalid start or end date. Please provide valid dates.');
    }

    const auction = {
      id: newAuctionRef.key,
      ...auctionData,
      auctionType: auctionData.auctionType || (auctionData.sport ? 'sports_player' : 'item'),
      category: auctionData.category || auctionData.sport || '',
      createdBy: user.uid,
      createdAt: Date.now(),
      status: 'upcoming',
      playerCount: auctionData.players?.length || 0,
      itemCount: auctionData.itemCount ?? 0,
      totalBudget: Number(auctionData.totalBudget) || 0,
      reservePrice: Number(auctionData.reservePrice) || 0,
      minIncrement: Number(auctionData.minIncrement) || (auctionData.auctionType === 'item' ? 100 : 100000),
      buyNowPrice: Number(auctionData.buyNowPrice) || 0,
      antiSnipingWindowMs: Number(auctionData.antiSnipingWindowMs) || 0,
      locked: false,
      startDate: startTime,
      endDate: endTime,
      ...(joinCode && { joinCode }),
    };

    const auctionForFirebase = Object.fromEntries(
      Object.entries(auction).filter(([, v]) => v !== undefined)
    );

    await set(newAuctionRef, auctionForFirebase);
    return auction;
  } catch (error) {
    console.error('Error creating auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get a single auction by ID
// ---------------------------------------------------------------------------
export const getAuction = async (auctionId) => {
  try {
    const auctionRef = ref(database, `auctions/${auctionId}`);
    const snapshot = await get(auctionRef);

    if (!snapshot.exists()) {
      throw new Error('Auction not found');
    }

    const data = snapshot.val();
    return {
      ...data,
      creator_id: data.createdBy,
      start_time: data.startDate,
      end_time: data.endDate,
      auction_type: data.auctionType || (data.sport ? 'sports_player' : 'item'),
      status: data.status === 'upcoming' ? 'pending' : data.status,
    };
  } catch (error) {
    console.error('Error getting auction:', error);
    throw error;
  }
};

export const getAuctionById = getAuction;

// ---------------------------------------------------------------------------
// Get auction by join code (sports auctions only)
// ---------------------------------------------------------------------------
export const getAuctionByJoinCode = async (code) => {
  if (!code || typeof code !== 'string') throw new Error('Invalid join code');
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Invalid join code');

  const joinCodeRef = ref(database, `joinCodes/${normalized}`);
  const snapshot = await get(joinCodeRef);
  if (!snapshot.exists()) {
    throw new Error('Auction not found for this code');
  }
  const auctionId = snapshot.val();
  const auction = await getAuction(auctionId);
  if (auction.auction_type !== 'sports_player') {
    throw new Error('Join codes are only valid for sports auctions');
  }
  return { ...auction, id: auctionId };
};

// ---------------------------------------------------------------------------
// Get all auctions (with optional filters)
// ---------------------------------------------------------------------------
export const getAllAuctions = async (filters = {}) => {
  try {
    const auctionsRef = ref(database, 'auctions');
    const snapshot = await get(auctionsRef);

    if (!snapshot.exists()) {
      return [];
    }

    let auctions = [];
    snapshot.forEach((childSnapshot) => {
      auctions.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    if (filters.status) {
      auctions = auctions.filter(a => a.status === filters.status);
    }
    if (filters.sport) {
      auctions = auctions.filter(a => a.sport === filters.sport);
    }
    if (filters.createdBy) {
      auctions = auctions.filter(a => a.createdBy === filters.createdBy);
    }

    auctions.sort((a, b) => b.startDate - a.startDate);

    if (filters.limit) {
      auctions = auctions.slice(0, filters.limit);
    }

    return auctions;
  } catch (error) {
    console.error('Error getting auctions:', error);
    throw error;
  }
};

export const getMyAuctions = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return await getAllAuctions({ createdBy: user.uid });
  } catch (error) {
    console.error('Error getting my auctions:', error);
    throw error;
  }
};

export const getLiveAuctions = async () => {
  try {
    return await getAllAuctions({ status: 'live' });
  } catch (error) {
    console.error('Error getting live auctions:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Update an auction
// ---------------------------------------------------------------------------
export const updateAuction = async (auctionId, updates) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const auctionRef = ref(database, `auctions/${auctionId}`);
    const snapshot = await get(auctionRef);

    if (!snapshot.exists()) {
      throw new Error('Auction not found');
    }

    const auction = snapshot.val();

    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const isAdmin = userSnapshot.exists() && userSnapshot.val().role === 'admin';

    if (auction.createdBy !== user.uid && !isAdmin) {
      throw new Error('Unauthorized: You can only update your own auctions');
    }

    const updateData = { ...updates };
    if (updates.startDate) {
      updateData.startDate = new Date(updates.startDate).getTime();
    }
    if (updates.endDate) {
      updateData.endDate = new Date(updates.endDate).getTime();
    }

    await update(auctionRef, updateData);

    return {
      id: auctionId,
      ...auction,
      ...updateData,
    };
  } catch (error) {
    console.error('Error updating auction:', error);
    throw error;
  }
};

export const updateAuctionStatus = async (auctionId, status) => {
  try {
    return await updateAuction(auctionId, { status });
  } catch (error) {
    console.error('Error updating auction status:', error);
    throw error;
  }
};

export const startAuction = async (auctionId) => {
  try {
    return await updateAuctionStatus(auctionId, 'live');
  } catch (error) {
    console.error('Error starting auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// End an auction and mark all players/items as sold or unsold
// ---------------------------------------------------------------------------
export const endAuction = async (auctionId) => {
  try {
    const auctionRef = ref(database, `auctions/${auctionId}`);
    const auctionSnap = await get(auctionRef);
    if (!auctionSnap.exists()) throw new Error('Auction not found');
    const auction = auctionSnap.val();
    const isSports = (auction.auctionType || (auction.sport ? 'sports_player' : 'item')) === 'sports_player';

    if (isSports) {
      const playersRef = ref(database, `auctions/${auctionId}/players`);
      const playersSnap = await get(playersRef);
      if (playersSnap.exists()) {
        const updates = {};
        playersSnap.forEach((snap) => {
          const p = snap.val();
          const status = (p.currentBidderId != null && p.currentBidderId !== '') ? 'sold' : 'unsold';
          updates[`auctions/${auctionId}/players/${snap.key}/status`] = status;
        });
        if (Object.keys(updates).length > 0) {
          const dbRef = ref(database);
          await update(dbRef, updates);
        }
      }
    } else {
      const itemsRef = ref(database, `auctions/${auctionId}/items`);
      const itemsSnap = await get(itemsRef);
      if (itemsSnap.exists()) {
        const updates = {};
        itemsSnap.forEach((snap) => {
          const v = snap.val();
          const status = (v.currentBidderId != null && v.currentBidderId !== '') ? 'sold' : 'unsold';
          updates[`auctions/${auctionId}/items/${snap.key}/status`] = status;
        });
        if (Object.keys(updates).length > 0) {
          const dbRef = ref(database);
          await update(dbRef, updates);
        }
      }
    }

    // ── FEATURE 2: Share winner & auctioneer contact details ─────────────
    try {
      await shareWinnerAndAuctioneerContact(auctionId, isSports);
    } catch (contactError) {
      console.error('Error sharing contact details for auction:', contactError);
    }

    return await updateAuctionStatus(auctionId, 'completed');
  } catch (error) {
    console.error('Error ending auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// ── FEATURE 2: Share winner & auctioneer contact details after auction end ──
//
// Strategy:
//   • For ITEM auctions  → the "winner" is whoever has the highest 'won' bid.
//   • For SPORTS auctions → there may be many winners (one per player sold).
//     We store one entry per winner under sharedContacts/{winnerUserId}.
//     Each winner sees only the auctioneer's contact; the auctioneer sees all
//     winners under auctions/{id}/sharedContacts.
// ---------------------------------------------------------------------------
const shareWinnerAndAuctioneerContact = async (auctionId, isSports) => {
  const auctionRef = ref(database, `auctions/${auctionId}`);
  const auctionSnap = await get(auctionRef);
  if (!auctionSnap.exists()) return;

  const auction = auctionSnap.val();
  const auctioneerUserId = auction.createdBy;
  if (!auctioneerUserId) return;

  // Fetch auctioneer contact once
  const auctioneerContactSnap = await get(ref(database, `users/${auctioneerUserId}/contactDetails`));
  const auctioneerContact = auctioneerContactSnap.exists() ? auctioneerContactSnap.val() : null;

  const sharedContactsRef = ref(database, `auctions/${auctionId}/sharedContacts`);

  if (isSports) {
    // ── Sports auction: collect all unique winners from sold players ────────
    const playersSnap = await get(ref(database, `auctions/${auctionId}/players`));
    if (!playersSnap.exists()) return;

    // Build a map: winnerUserId → { teamName, players: [] }
    const winnersMap = {};
    playersSnap.forEach((child) => {
      const p = child.val();
      if (!p || p.status !== 'sold' || !p.currentBidderId) return;
      const uid = p.currentBidderId;
      if (!winnersMap[uid]) {
        winnersMap[uid] = {
          userId: uid,
          teamName: p.currentBidderTeamName || p.currentBidderName || null,
          players: [],
        };
      }
      winnersMap[uid].players.push({
        playerId: child.key,
        playerName: p.name || null,
        soldPrice: p.currentBid || p.soldPrice || 0,
      });
    });

    if (Object.keys(winnersMap).length === 0) return;

    // Fetch winner contacts and build the shared contacts payload
    const winnersPayload = {};
    await Promise.all(
      Object.values(winnersMap).map(async (winner) => {
        const winnerContactSnap = await get(
          ref(database, `users/${winner.userId}/contactDetails`)
        );
        const winnerContact = winnerContactSnap.exists() ? winnerContactSnap.val() : null;

        winnersPayload[winner.userId] = {
          userId: winner.userId,
          teamName: winner.teamName,
          players: winner.players,
          winnerContact: winnerContact || null,
          auctioneerContact: auctioneerContact || null,
          auctioneerUserId,
          sharedAt: Date.now(),
        };
      })
    );

    await set(sharedContactsRef, {
      type: 'sports',
      auctioneerUserId,
      auctioneerContact: auctioneerContact || null,
      winners: winnersPayload,
      sharedAt: Date.now(),
    });

  } else {
    // ── Item auction: single highest winner from 'won' bids ─────────────────
    const bidsRef = ref(database, `bids/${auctionId}`);
    const bidsSnap = await get(bidsRef);
    if (!bidsSnap.exists()) return;

    let topWinningBid = null;
    bidsSnap.forEach((child) => {
      const bid = child.val();
      if (bid.status === 'won') {
        if (!topWinningBid || (bid.amount || 0) > (topWinningBid.amount || 0)) {
          topWinningBid = bid;
        }
      }
    });

    if (!topWinningBid) return;

    const winnerUserId = topWinningBid.bidderId;
    if (!winnerUserId) return;

    const winnerContactSnap = await get(ref(database, `users/${winnerUserId}/contactDetails`));
    const winnerContact = winnerContactSnap.exists() ? winnerContactSnap.val() : null;

    await set(sharedContactsRef, {
      type: 'item',
      winnerUserId,
      auctioneerUserId,
      winnerContact: winnerContact || null,
      auctioneerContact: auctioneerContact || null,
      sharedAt: Date.now(),
    });
  }

  const flagRef = ref(database, `auctions/${auctionId}/winnerContactShared`);
  await set(flagRef, true);
};

// ---------------------------------------------------------------------------
// Register a team for a sports auction
// ---------------------------------------------------------------------------
export const registerTeamForSportsAuction = async (auctionId, teamName) => {
  const user = fireAuth.currentUser;
  if (!user) throw new Error('User not authenticated');
  const trimmedName = (teamName || '').trim();
  if (!trimmedName) throw new Error('Team name is required');

  let representativeName = user.displayName || user.email || '';
  try {
    const userRef = ref(database, `users/${user.uid}`);
    const userSnap = await get(userRef);
    if (userSnap.exists()) {
      const profile = userSnap.val();
      representativeName = profile.username || profile.name || representativeName;
    }
  } catch (profileError) {
    console.error('Error loading user profile for team registration:', profileError);
  }

  const sportsAuctionRef = ref(database, `sportsAuctions/${auctionId}`);

  await runTransaction(sportsAuctionRef, (data) => {
    const next = data || {};
    next.teams = next.teams || {};
    next.representatives = next.representatives || {};

    const existingTeamForUser = next.representatives[user.uid];
    if (existingTeamForUser && existingTeamForUser !== trimmedName) {
      throw new Error('You are already representing a team in this auction.');
    }

    const teamEntry = next.teams[trimmedName];
    if (teamEntry && teamEntry.representativeUserId !== user.uid) {
      throw new Error('Team name already taken.');
    }

    next.teams[trimmedName] = {
      representativeUserId: user.uid,
      representativeName,
    };
    next.representatives[user.uid] = trimmedName;

    return next;
  });

  const auctionTeamsRef = ref(database, `auctions/${auctionId}/teams`);
  const teamsSnap = await get(auctionTeamsRef);
  let teamsList = [];
  if (teamsSnap.exists()) {
    const value = teamsSnap.val();
    if (Array.isArray(value)) {
      teamsList = value;
    } else if (typeof value === 'string') {
      try {
        teamsList = JSON.parse(value || '[]');
      } catch {
        teamsList = [];
      }
    }
  }
  if (!teamsList.includes(trimmedName)) {
    teamsList.push(trimmedName);
    await set(auctionTeamsRef, teamsList);
  }

  return { teamName: trimmedName };
};

// ---------------------------------------------------------------------------
// Get teams and their representatives for a sports auction
// ---------------------------------------------------------------------------
export const getSportsAuctionTeams = async (auctionId) => {
  try {
    const teamsRef = ref(database, `sportsAuctions/${auctionId}/teams`);
    const snap = await get(teamsRef);

    if (!snap.exists()) {
      return [];
    }

    const teams = [];
    snap.forEach((child) => {
      const value = child.val() || {};
      teams.push({
        name: child.key,
        representativeUserId: value.representativeUserId || null,
        representativeName: value.representativeName || null,
      });
    });

    return teams;
  } catch (error) {
    console.error('Error getting sports auction teams:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get the current user's team name for a sports auction (or null if none)
// ---------------------------------------------------------------------------
export const getUserTeamForSportsAuction = async (auctionId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) return null;

    const repRef = ref(database, `sportsAuctions/${auctionId}/representatives/${user.uid}`);
    const snap = await get(repRef);

    if (!snap.exists()) {
      return null;
    }

    const value = snap.val();
    const teamName = typeof value === 'string' ? value.trim() : '';
    return teamName || null;
  } catch (error) {
    console.error('Error getting user team for sports auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Delete an auction
// ---------------------------------------------------------------------------
export const deleteAuction = async (auctionId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const auctionRef = ref(database, `auctions/${auctionId}`);
    const snapshot = await get(auctionRef);

    if (!snapshot.exists()) {
      throw new Error('Auction not found');
    }

    const auction = snapshot.val();

    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const isAdmin = userSnapshot.exists() && userSnapshot.val().role === 'admin';

    if (auction.createdBy !== user.uid && !isAdmin) {
      throw new Error('Unauthorized: You can only delete your own auctions');
    }

    await remove(auctionRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Add player to auction
// ---------------------------------------------------------------------------
export const addPlayerToAuction = async (auctionId, playerData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const playersRef = ref(database, `auctions/${auctionId}/players`);
    const newPlayerRef = push(playersRef);

    const player = {
      id: newPlayerRef.key,
      ...playerData,
      addedAt: Date.now(),
      addedBy: user.uid,
      currentBid: playerData.basePrice,
      status: 'available',
    };

    await set(newPlayerRef, player);

    const auctionRef = ref(database, `auctions/${auctionId}`);
    const auctionSnapshot = await get(auctionRef);
    const currentCount = auctionSnapshot.val()?.playerCount || 0;
    await update(auctionRef, { playerCount: currentCount + 1 });

    return player;
  } catch (error) {
    console.error('Error adding player to auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get players in an auction
// ---------------------------------------------------------------------------
export const getAuctionPlayers = async (auctionId) => {
  try {
    const playersRef = ref(database, `auctions/${auctionId}/players`);
    const snapshot = await get(playersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const players = [];
    snapshot.forEach((childSnapshot) => {
      players.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    return players;
  } catch (error) {
    console.error('Error getting auction players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get items in an auction (item auctions) or map players to item shape (sports)
// ---------------------------------------------------------------------------
export const getAuctionItems = async (auctionId, options = {}) => {
  try {
    const { auctionType } = options;

    if (auctionType === 'sports_player') {
      const players = await getAuctionPlayers(auctionId);
      return players.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.role ? `Role: ${p.role}` : '',
        base_price: p.basePrice,
        current_price: p.currentBid ?? p.basePrice,
        status: p.status || 'available',
        current_bidder_name: p.currentBidderName || null,
        soldToTeamName: p.soldToTeamName || null,
        player_details: JSON.stringify({
          role: p.role,
          age: p.age,
          nationality: p.nationality,
        }),
      }));
    }

    const itemsRef = ref(database, `auctions/${auctionId}/items`);
    const itemsSnap = await get(itemsRef);

    if (itemsSnap.exists()) {
      const items = [];
      itemsSnap.forEach((childSnapshot) => {
        const v = childSnapshot.val();
        items.push({
          id: childSnapshot.key,
          name: v.name,
          description: v.description || '',
          base_price: v.basePrice ?? v.base_price,
          current_price: v.currentBid ?? v.current_price ?? v.basePrice ?? v.base_price,
          status: v.status || 'available',
          current_bidder_name: v.currentBidderName || null,
          category: v.category,
          imageUrl: v.imageUrl,
          condition: v.condition,
        });
      });
      return items;
    }

    const players = await getAuctionPlayers(auctionId);
    return players.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.role ? `Role: ${p.role}` : '',
      base_price: p.basePrice,
      current_price: p.currentBid ?? p.basePrice,
      status: p.status || 'available',
      current_bidder_name: p.currentBidderName || null,
      soldToTeamName: p.soldToTeamName || null,
      player_details: JSON.stringify({
        role: p.role,
        age: p.age,
        nationality: p.nationality,
      }),
    }));
  } catch (error) {
    console.error('Error getting auction items:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Add item to an item auction
// ---------------------------------------------------------------------------
export const addItemToAuction = async (auctionId, itemData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const itemsRef = ref(database, `auctions/${auctionId}/items`);
    const newItemRef = push(itemsRef);

    const basePriceNum = Number(itemData.basePrice ?? itemData.base_price) || 0;
    const item = {
      id: newItemRef.key,
      name: itemData.name || '',
      description: itemData.description || '',
      basePrice: basePriceNum,
      base_price: basePriceNum,
      currentBid: basePriceNum,
      current_price: basePriceNum,
      category: itemData.category || '',
      condition: itemData.condition || '',
      imageUrl: itemData.imageUrl || '',
      status: 'available',
      addedAt: Date.now(),
      addedBy: user.uid,
    };

    await set(newItemRef, item);

    const auctionRef = ref(database, `auctions/${auctionId}`);
    const auctionSnapshot = await get(auctionRef);
    const currentCount = auctionSnapshot.val()?.itemCount ?? auctionSnapshot.val()?.playerCount ?? 0;
    await update(auctionRef, { itemCount: currentCount + 1 });

    return item;
  } catch (error) {
    console.error('Error adding item to auction:', error);
    throw error;
  }
};

export const addItem = async (payload) => {
  const { auctionId, name, description, basePrice, base_price, category, imageUrl, playerDetails, condition } = payload;
  const price = basePrice ?? base_price;
  if (payload.playerDetails && (payload.playerDetails.role || payload.playerDetails.age || payload.playerDetails.nationality)) {
    return addPlayerToAuction(auctionId, {
      name,
      role: payload.playerDetails.role || 'Player',
      basePrice: price,
      nationality: payload.playerDetails.nationality || '',
      imageUrl: imageUrl || '',
      stats: {},
    });
  }
  return addItemToAuction(auctionId, {
    name,
    description: description || '',
    basePrice: price,
    category: category || '',
    imageUrl: imageUrl || '',
    condition: condition || '',
  });
};

// ---------------------------------------------------------------------------
// Search auctions
// ---------------------------------------------------------------------------
export const searchAuctions = async (searchTerm) => {
  try {
    const allAuctions = await getAllAuctions();
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allAuctions.filter((auction) => {
      return (
        auction.title?.toLowerCase().includes(lowerSearchTerm) ||
        auction.sport?.toLowerCase().includes(lowerSearchTerm) ||
        auction.description?.toLowerCase().includes(lowerSearchTerm)
      );
    });
  } catch (error) {
    console.error('Error searching auctions:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get auction statistics
// ---------------------------------------------------------------------------
export const getAuctionStats = async (auctionId) => {
  try {
    const auction = await getAuction(auctionId);
    const players = await getAuctionPlayers(auctionId);

    const bidsRef = ref(database, `bids/${auctionId}`);
    const bidsSnapshot = await get(bidsRef);

    let totalBids = 0;
    if (bidsSnapshot.exists()) {
      bidsSnapshot.forEach(() => totalBids++);
    }

    const soldPlayers = players.filter(p => p.status === 'sold').length;
    const unsoldPlayers = players.filter(p => p.status === 'unsold').length;
    const totalRevenue = players
      .filter(p => p.status === 'sold')
      .reduce((sum, p) => sum + (p.currentBid || 0), 0);

    return {
      totalPlayers: players.length,
      soldPlayers,
      unsoldPlayers,
      totalBids,
      totalRevenue,
      averageBidPerPlayer: totalBids > 0 ? totalBids / players.length : 0,
    };
  } catch (error) {
    console.error('Error getting auction stats:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Listen to auction updates (real-time)
// ---------------------------------------------------------------------------
export const listenToAuction = (auctionId, callback) => {
  const auctionRef = ref(database, `auctions/${auctionId}`);
  const unsubscribe = onValue(auctionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  return unsubscribe;
};

export default {
  createAuction,
  getAuction,
  getAuctionById,
  getAuctionByJoinCode,
  getAllAuctions,
  getMyAuctions,
  getLiveAuctions,
  updateAuction,
  updateAuctionStatus,
  startAuction,
  endAuction,
  deleteAuction,
  addPlayerToAuction,
  addItemToAuction,
  addItem,
  getAuctionPlayers,
  getAuctionItems,
  searchAuctions,
  getAuctionStats,
  listenToAuction,
  registerTeamForSportsAuction,
  getSportsAuctionTeams,
  getUserTeamForSportsAuction,
};
