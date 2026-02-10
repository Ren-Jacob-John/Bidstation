// ---------------------------------------------------------------------------
// client/src/services/bidService.js - Realtime Database Bid Operations
// ---------------------------------------------------------------------------
import { 
  ref, 
  push,
  set,
  get,
  update,
  query,
  orderByChild,
  equalTo,
  runTransaction,
  onValue,
  off
} from 'firebase/database';
import { database, fireAuth } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Place a bid on a player (with transaction for atomicity)
// ---------------------------------------------------------------------------
export const placeBid = async (auctionId, playerId, bidAmount) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Get user profile for bidder name
    const userRef = ref(database, `users/${user.uid}`);
    const userSnapshot = await get(userRef);
    const bidderName = userSnapshot.val()?.username || user.email;

    // Use transaction to ensure atomic updates
    const playerRef = ref(database, `auctions/${auctionId}/players/${playerId}`);
    
    let newBid = null;

    await runTransaction(playerRef, (player) => {
      if (player === null) {
        throw new Error('Player not found');
      }

      const currentBid = player.currentBid || player.basePrice;

      // Validate bid amount
      if (bidAmount <= currentBid) {
        throw new Error(`Bid must be higher than current bid of ₹${currentBid.toLocaleString()}`);
      }

      // Update player data
      player.currentBid = bidAmount;
      player.currentBidderId = user.uid;
      player.currentBidderName = bidderName;
      player.lastBidAt = Date.now();

      return player;
    });

    // Create bid record
    const bidsRef = ref(database, `bids/${auctionId}`);
    const newBidRef = push(bidsRef);

    const playerSnapshot = await get(playerRef);
    const playerData = playerSnapshot.val();

    newBid = {
      id: newBidRef.key,
      auctionId,
      playerId,
      playerName: playerData.name,
      bidderId: user.uid,
      bidderName,
      amount: bidAmount,
      timestamp: Date.now(),
      status: 'active',
    };

    await set(newBidRef, newBid);

    // Mark previous active bids for this player as outbid
    const allBidsRef = ref(database, `bids/${auctionId}`);
    const allBidsSnapshot = await get(allBidsRef);

    if (allBidsSnapshot.exists()) {
      const updates = {};
      allBidsSnapshot.forEach((bidSnapshot) => {
        const bid = bidSnapshot.val();
        if (bid.playerId === playerId && bid.status === 'active' && bid.id !== newBid.id) {
          updates[`${bidSnapshot.key}/status`] = 'outbid';
        }
      });

      if (Object.keys(updates).length > 0) {
        await update(allBidsRef, updates);
      }
    }

    return newBid;
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
    const bidsRef = ref(database, `bids/${auctionId}`);
    const snapshot = await get(bidsRef);

    if (!snapshot.exists()) {
      return [];
    }

    let bids = [];
    snapshot.forEach((childSnapshot) => {
      bids.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    // Apply filters
    if (options.playerId) {
      bids = bids.filter(b => b.playerId === options.playerId);
    }
    if (options.bidderId) {
      bids = bids.filter(b => b.bidderId === options.bidderId);
    }
    if (options.status) {
      bids = bids.filter(b => b.status === options.status);
    }

    // Sort by timestamp (newest first)
    bids.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (options.limit) {
      bids = bids.slice(0, options.limit);
    }

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

    const allBidsRef = ref(database, 'bids');
    const snapshot = await get(allBidsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const allBids = [];

    snapshot.forEach((auctionSnapshot) => {
      const auctionId = auctionSnapshot.key;
      
      auctionSnapshot.forEach((bidSnapshot) => {
        const bid = bidSnapshot.val();
        if (bid.bidderId === user.uid) {
          allBids.push({
            id: bidSnapshot.key,
            auctionId,
            ...bid,
          });
        }
      });
    });

    // Sort by timestamp (newest first)
    allBids.sort((a, b) => b.timestamp - a.timestamp);

    // Get auction titles
    const auctionsRef = ref(database, 'auctions');
    const auctionsSnapshot = await get(auctionsRef);
    
    if (auctionsSnapshot.exists()) {
      allBids.forEach(bid => {
        const auction = auctionsSnapshot.child(bid.auctionId).val();
        if (auction) {
          bid.auctionTitle = auction.title;
        }
      });
    }

    return allBids;
  } catch (error) {
    console.error('Error getting my bids:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get active bids by current user
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
// Update bid status
// ---------------------------------------------------------------------------
export const updateBidStatus = async (auctionId, bidId, status) => {
  try {
    const bidRef = ref(database, `bids/${auctionId}/${bidId}`);
    await update(bidRef, { status });
    return { success: true };
  } catch (error) {
    console.error('Error updating bid status:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Finalize auction bids
// ---------------------------------------------------------------------------
export const finalizeAuctionBids = async (auctionId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // Verify ownership
    const auctionRef = ref(database, `auctions/${auctionId}`);
    const auctionSnapshot = await get(auctionRef);

    if (!auctionSnapshot.exists()) {
      throw new Error('Auction not found');
    }

    const auction = auctionSnapshot.val();
    if (auction.createdBy !== user.uid) {
      throw new Error('Unauthorized: Only auction creator can finalize bids');
    }

    // Get all bids
    const bidsRef = ref(database, `bids/${auctionId}`);
    const bidsSnapshot = await get(bidsRef);

    if (!bidsSnapshot.exists()) {
      return { success: true, winningBids: 0 };
    }

    const updates = {};
    let winningCount = 0;

    bidsSnapshot.forEach((bidSnapshot) => {
      const bid = bidSnapshot.val();
      if (bid.status === 'active') {
        updates[`${bidSnapshot.key}/status`] = 'won';
        winningCount++;
      } else if (bid.status === 'outbid') {
        updates[`${bidSnapshot.key}/status`] = 'lost';
      }
    });

    await update(bidsRef, updates);

    return { success: true, winningBids: winningCount };
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

    const allBids = userId ? [] : await getMyBids();
    
    // If getting stats for another user, fetch their bids
    if (userId) {
      const allBidsRef = ref(database, 'bids');
      const snapshot = await get(allBidsRef);

      if (snapshot.exists()) {
        snapshot.forEach((auctionSnapshot) => {
          auctionSnapshot.forEach((bidSnapshot) => {
            const bid = bidSnapshot.val();
            if (bid.bidderId === userId) {
              allBids.push(bid);
            }
          });
        });
      }
    }

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

    const bids = await getAuctionBids(auctionId, { 
      playerId,
      bidderId: user.uid,
      status: 'active'
    });

    return bids.length > 0;
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
// Get leaderboard
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

// ---------------------------------------------------------------------------
// Listen to auction bids (real-time)
// ---------------------------------------------------------------------------
export const listenToAuctionBids = (auctionId, callback) => {
  const bidsRef = ref(database, `bids/${auctionId}`);
  
  const unsubscribe = onValue(bidsRef, (snapshot) => {
    const bids = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        bids.push({
          id: childSnapshot.key,
          ...childSnapshot.val(),
        });
      });
    }
    callback(bids);
  });

  return () => off(bidsRef);
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
  listenToAuctionBids,
};