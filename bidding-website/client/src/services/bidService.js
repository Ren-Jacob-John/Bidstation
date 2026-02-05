// ---------------------------------------------------------------------------
// client/src/services/bidService.js - Firestore Bid Operations
// ---------------------------------------------------------------------------
import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { firestore, fireAuth } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Place a bid on a player
// ---------------------------------------------------------------------------
export const placeBid = async (auctionId, playerId, bidAmount) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get user profile for bidder name
    const userRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    const bidderName = userDoc.data()?.username || user.email;

    // Use transaction to ensure atomic updates
    const bidData = await runTransaction(firestore, async (transaction) => {
      // Get current player data
      const playerRef = doc(firestore, 'auctions', auctionId, 'players', playerId);
      const playerDoc = await transaction.get(playerRef);

      if (!playerDoc.exists()) {
        throw new Error('Player not found');
      }

      const playerData = playerDoc.data();
      const currentBid = playerData.currentBid || playerData.basePrice;

      // Validate bid amount
      if (bidAmount <= currentBid) {
        throw new Error(`Bid must be higher than current bid of ₹${currentBid.toLocaleString()}`);
      }

      // Create bid document
      const bidsRef = collection(firestore, 'auctions', auctionId, 'bids');
      const newBidRef = doc(bidsRef);

      const bid = {
        id: newBidRef.id,
        auctionId,
        playerId,
        playerName: playerData.name,
        bidderId: user.uid,
        bidderName,
        amount: bidAmount,
        timestamp: serverTimestamp(),
        status: 'active', // active, outbid, won, lost
      };

      transaction.set(newBidRef, bid);

      // Update player's current bid
      transaction.update(playerRef, {
        currentBid: bidAmount,
        currentBidderId: user.uid,
        currentBidderName: bidderName,
        lastBidAt: serverTimestamp(),
      });

      // Mark previous bids as outbid
      const previousBidsRef = query(
        collection(firestore, 'auctions', auctionId, 'bids'),
        where('playerId', '==', playerId),
        where('status', '==', 'active')
      );
      const previousBidsSnapshot = await getDocs(previousBidsRef);
      
      previousBidsSnapshot.forEach((doc) => {
        if (doc.id !== newBidRef.id) {
          transaction.update(doc.ref, { status: 'outbid' });
        }
      });

      return bid;
    });

    return bidData;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get all bids for an auction
// ---------------------------------------------------------------------------
export const getAuctionBids = async (auctionId, options = {}) => {
  try {
    const bidsRef = collection(firestore, 'auctions', auctionId, 'bids');
    let q = query(bidsRef);

    // Filter by player if specified
    if (options.playerId) {
      q = query(q, where('playerId', '==', options.playerId));
    }

    // Filter by bidder if specified
    if (options.bidderId) {
      q = query(q, where('bidderId', '==', options.bidderId));
    }

    // Filter by status if specified
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }

    // Order by timestamp (newest first)
    q = query(q, orderBy('timestamp', 'desc'));

    // Apply limit if specified
    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    const snapshot = await getDocs(q);
    const bids = [];

    snapshot.forEach((doc) => {
      bids.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
      });
    });

    return bids;
  } catch (error) {
    console.error('Error getting auction bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get bids for a specific player
// ---------------------------------------------------------------------------
export const getPlayerBids = async (auctionId, playerId) => {
  try {
    return await getAuctionBids(auctionId, { playerId });
  } catch (error) {
    console.error('Error getting player bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get all bids by current user
// ---------------------------------------------------------------------------
export const getMyBids = async () => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get all auctions
    const auctionsRef = collection(firestore, 'auctions');
    const auctionsSnapshot = await getDocs(auctionsRef);

    const allBids = [];

    // For each auction, get user's bids
    for (const auctionDoc of auctionsSnapshot.docs) {
      const auctionId = auctionDoc.id;
      const bidsRef = collection(firestore, 'auctions', auctionId, 'bids');
      const q = query(
        bidsRef,
        where('bidderId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      
      const bidsSnapshot = await getDocs(q);
      
      bidsSnapshot.forEach((bidDoc) => {
        allBids.push({
          id: bidDoc.id,
          auctionId,
          auctionTitle: auctionDoc.data().title,
          ...bidDoc.data(),
          timestamp: bidDoc.data().timestamp?.toDate(),
        });
      });
    }

    // Sort all bids by timestamp
    allBids.sort((a, b) => {
      const timeA = a.timestamp?.getTime() || 0;
      const timeB = b.timestamp?.getTime() || 0;
      return timeB - timeA;
    });

    return allBids;
  } catch (error) {
    console.error('Error getting my bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get active bids by current user (bids they're currently winning)
// ---------------------------------------------------------------------------
export const getMyActiveBids = async () => {
  try {
    const allBids = await getMyBids();
    return allBids.filter(bid => bid.status === 'active');
  } catch (error) {
    console.error('Error getting my active bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get winning bids by current user
// ---------------------------------------------------------------------------
export const getMyWinningBids = async () => {
  try {
    const allBids = await getMyBids();
    return allBids.filter(bid => bid.status === 'won');
  } catch (error) {
    console.error('Error getting my winning bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Update bid status (used when auction ends)
// ---------------------------------------------------------------------------
export const updateBidStatus = async (auctionId, bidId, status) => {
  try {
    const bidRef = doc(firestore, 'auctions', auctionId, 'bids', bidId);
    await updateDoc(bidRef, { status });
    return { success: true };
  } catch (error) {
    console.error('Error updating bid status:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Mark winning bids when auction ends
// ---------------------------------------------------------------------------
export const finalizeAuctionBids = async (auctionId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get auction to verify ownership
    const auctionRef = doc(firestore, 'auctions', auctionId);
    const auctionDoc = await getDoc(auctionRef);

    if (!auctionDoc.exists()) {
      throw new Error('Auction not found');
    }
    if (auctionDoc.data().createdBy !== user.uid) {
      throw new Error('Unauthorized: Only auction creator can finalize bids');
    }

    // Get all active bids
    const activeBids = await getAuctionBids(auctionId, { status: 'active' });

    // Mark active bids as won
    const updatePromises = activeBids.map(bid => 
      updateBidStatus(auctionId, bid.id, 'won')
    );

    // Mark all other bids as lost
    const allBids = await getAuctionBids(auctionId);
    const lostBidPromises = allBids
      .filter(bid => bid.status === 'outbid')
      .map(bid => updateBidStatus(auctionId, bid.id, 'lost'));

    await Promise.all([...updatePromises, ...lostBidPromises]);

    return { success: true, winningBids: activeBids.length };
  } catch (error) {
    console.error('Error finalizing auction bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get bid statistics for a user
// ---------------------------------------------------------------------------
export const getUserBidStats = async (userId = null) => {
  try {
    const targetUserId = userId || fireAuth.currentUser?.uid;
    if (!targetUserId) throw new Error('User not authenticated');

    const allBids = userId ? 
      await getAuctionBids(null, { bidderId: userId }) : 
      await getMyBids();

    const stats = {
      totalBids: allBids.length,
      activeBids: allBids.filter(b => b.status === 'active').length,
      wonBids: allBids.filter(b => b.status === 'won').length,
      lostBids: allBids.filter(b => b.status === 'lost').length,
      totalAmountBid: allBids.reduce((sum, bid) => sum + (bid.amount || 0), 0),
      averageBid: allBids.length > 0 ? 
        allBids.reduce((sum, bid) => sum + (bid.amount || 0), 0) / allBids.length : 0,
      winRate: allBids.length > 0 ? 
        (allBids.filter(b => b.status === 'won').length / allBids.length) * 100 : 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting user bid stats:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Check if user has active bid on a player
// ---------------------------------------------------------------------------
export const hasActiveBidOnPlayer = async (auctionId, playerId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) return false;

    const bidsRef = collection(firestore, 'auctions', auctionId, 'bids');
    const q = query(
      bidsRef,
      where('playerId', '==', playerId),
      where('bidderId', '==', user.uid),
      where('status', '==', 'active'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking active bid:', error);
    return false;
  }
};

// ---------------------------------------------------------------------------
// Get highest bid for a player
// ---------------------------------------------------------------------------
export const getHighestBid = async (auctionId, playerId) => {
  try {
    const bids = await getPlayerBids(auctionId, playerId);
    
    if (bids.length === 0) return null;

    return bids.reduce((highest, bid) => 
      bid.amount > (highest?.amount || 0) ? bid : highest
    , bids[0]);
  } catch (error) {
    console.error('Error getting highest bid:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get leaderboard (top bidders by amount or count)
// ---------------------------------------------------------------------------
export const getBidLeaderboard = async (auctionId, sortBy = 'amount') => {
  try {
    const bids = await getAuctionBids(auctionId);

    // Group by bidder
    const bidderStats = {};
    bids.forEach(bid => {
      if (!bidderStats[bid.bidderId]) {
        bidderStats[bid.bidderId] = {
          bidderId: bid.bidderId,
          bidderName: bid.bidderName,
          totalAmount: 0,
          bidCount: 0,
          wonCount: 0,
        };
      }
      bidderStats[bid.bidderId].totalAmount += bid.amount;
      bidderStats[bid.bidderId].bidCount += 1;
      if (bid.status === 'won') {
        bidderStats[bid.bidderId].wonCount += 1;
      }
    });

    // Convert to array and sort
    const leaderboard = Object.values(bidderStats);
    
    if (sortBy === 'amount') {
      leaderboard.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'count') {
      leaderboard.sort((a, b) => b.bidCount - a.bidCount);
    } else if (sortBy === 'won') {
      leaderboard.sort((a, b) => b.wonCount - a.wonCount);
    }

    return leaderboard;
  } catch (error) {
    console.error('Error getting bid leaderboard:', error);
    throw error;
  }
};

export default {
  placeBid,
  getAuctionBids,
  getPlayerBids,
  getMyBids,
  getMyActiveBids,
  getMyWinningBids,
  updateBidStatus,
  finalizeAuctionBids,
  getUserBidStats,
  hasActiveBidOnPlayer,
  getHighestBid,
  getBidLeaderboard,
};
