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
  off
} from 'firebase/database';
import { database, fireAuth } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Create a new auction
// ---------------------------------------------------------------------------
export const createAuction = async (auctionData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const auctionsRef = ref(database, 'auctions');
    const newAuctionRef = push(auctionsRef);

    const auction = {
      id: newAuctionRef.key,
      ...auctionData,
      createdBy: user.uid,
      createdAt: Date.now(),
      status: 'upcoming',
      playerCount: auctionData.players?.length || 0,
      totalBudget: auctionData.totalBudget || 0,
      startDate: new Date(auctionData.startDate).getTime(),
      endDate: new Date(auctionData.endDate).getTime(),
    };

    await set(newAuctionRef, auction);
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

    return snapshot.val();
  } catch (error) {
    console.error('Error getting auction:', error);
    throw error;
  }
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

    // Apply client-side filters
    if (filters.status) {
      auctions = auctions.filter(a => a.status === filters.status);
    }
    if (filters.sport) {
      auctions = auctions.filter(a => a.sport === filters.sport);
    }
    if (filters.createdBy) {
      auctions = auctions.filter(a => a.createdBy === filters.createdBy);
    }

    // Sort by start date (newest first)
    auctions.sort((a, b) => b.startDate - a.startDate);

    // Apply limit
    if (filters.limit) {
      auctions = auctions.slice(0, filters.limit);
    }

    return auctions;
  } catch (error) {
    console.error('Error getting auctions:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get auctions created by current user
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Get live auctions
// ---------------------------------------------------------------------------
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
    if (auction.createdBy !== user.uid) {
      throw new Error('Unauthorized: You can only update your own auctions');
    }

    // Convert dates if present
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

// ---------------------------------------------------------------------------
// Update auction status
// ---------------------------------------------------------------------------
export const updateAuctionStatus = async (auctionId, status) => {
  try {
    return await updateAuction(auctionId, { status });
  } catch (error) {
    console.error('Error updating auction status:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Start an auction
// ---------------------------------------------------------------------------
export const startAuction = async (auctionId) => {
  try {
    return await updateAuctionStatus(auctionId, 'live');
  } catch (error) {
    console.error('Error starting auction:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// End an auction
// ---------------------------------------------------------------------------
export const endAuction = async (auctionId) => {
  try {
    return await updateAuctionStatus(auctionId, 'completed');
  } catch (error) {
    console.error('Error ending auction:', error);
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
    if (auction.createdBy !== user.uid) {
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

    // Update player count in auction
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

  // Return unsubscribe function
  return () => off(auctionRef);
};

export default {
  createAuction,
  getAuction,
  getAllAuctions,
  getMyAuctions,
  getLiveAuctions,
  updateAuction,
  updateAuctionStatus,
  startAuction,
  endAuction,
  deleteAuction,
  addPlayerToAuction,
  getAuctionPlayers,
  searchAuctions,
  getAuctionStats,
  listenToAuction,
};