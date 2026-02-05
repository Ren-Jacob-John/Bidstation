// ---------------------------------------------------------------------------
// client/src/services/auctionService.js - Firestore Auction Operations
// ---------------------------------------------------------------------------
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { firestore, fireAuth } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Create a new auction
// ---------------------------------------------------------------------------
export const createAuction = async (auctionData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const auction = {
      ...auctionData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      status: 'upcoming', // upcoming, live, completed
      playerCount: auctionData.players?.length || 0,
      totalBudget: auctionData.totalBudget || 0,
      startDate: Timestamp.fromDate(new Date(auctionData.startDate)),
      endDate: Timestamp.fromDate(new Date(auctionData.endDate)),
    };

    const auctionsRef = collection(firestore, 'auctions');
    const docRef = await addDoc(auctionsRef, auction);

    return {
      id: docRef.id,
      ...auction,
    };
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
    const auctionRef = doc(firestore, 'auctions', auctionId);
    const auctionDoc = await getDoc(auctionRef);

    if (!auctionDoc.exists()) {
      throw new Error('Auction not found');
    }

    return {
      id: auctionDoc.id,
      ...auctionDoc.data(),
      startDate: auctionDoc.data().startDate?.toDate(),
      endDate: auctionDoc.data().endDate?.toDate(),
      createdAt: auctionDoc.data().createdAt?.toDate(),
    };
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
    const auctionsRef = collection(firestore, 'auctions');
    let q = query(auctionsRef);

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.sport) {
      q = query(q, where('sport', '==', filters.sport));
    }
    if (filters.createdBy) {
      q = query(q, where('createdBy', '==', filters.createdBy));
    }

    // Order by start date (newest first)
    q = query(q, orderBy('startDate', 'desc'));

    // Apply limit if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const auctions = [];

    snapshot.forEach((doc) => {
      auctions.push({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

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

    const auctionRef = doc(firestore, 'auctions', auctionId);
    
    // Verify ownership
    const auctionDoc = await getDoc(auctionRef);
    if (!auctionDoc.exists()) {
      throw new Error('Auction not found');
    }
    if (auctionDoc.data().createdBy !== user.uid) {
      throw new Error('Unauthorized: You can only update your own auctions');
    }

    // Convert dates if present
    const updateData = { ...updates };
    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(new Date(updates.startDate));
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(new Date(updates.endDate));
    }

    await updateDoc(auctionRef, updateData);

    return {
      id: auctionId,
      ...auctionDoc.data(),
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
// Start an auction (change status to live)
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
// End an auction (change status to completed)
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

    const auctionRef = doc(firestore, 'auctions', auctionId);
    
    // Verify ownership
    const auctionDoc = await getDoc(auctionRef);
    if (!auctionDoc.exists()) {
      throw new Error('Auction not found');
    }
    if (auctionDoc.data().createdBy !== user.uid) {
      throw new Error('Unauthorized: You can only delete your own auctions');
    }

    await deleteDoc(auctionRef);
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

    const auctionRef = doc(firestore, 'auctions', auctionId);
    const playersRef = collection(auctionRef, 'players');

    const player = {
      ...playerData,
      addedAt: serverTimestamp(),
      addedBy: user.uid,
      currentBid: playerData.basePrice,
      status: 'available', // available, sold, unsold
    };

    const docRef = await addDoc(playersRef, player);

    // Update player count in auction
    const auctionDoc = await getDoc(auctionRef);
    const currentCount = auctionDoc.data().playerCount || 0;
    await updateDoc(auctionRef, { playerCount: currentCount + 1 });

    return {
      id: docRef.id,
      ...player,
    };
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
    const playersRef = collection(firestore, 'auctions', auctionId, 'players');
    const snapshot = await getDocs(playersRef);
    const players = [];

    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
        addedAt: doc.data().addedAt?.toDate(),
      });
    });

    return players;
  } catch (error) {
    console.error('Error getting auction players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Search auctions by title or sport
// ---------------------------------------------------------------------------
export const searchAuctions = async (searchTerm) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - for production, use Algolia or similar
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
    const bidsRef = collection(firestore, 'auctions', auctionId, 'bids');
    const bidsSnapshot = await getDocs(bidsRef);

    const totalBids = bidsSnapshot.size;
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
};