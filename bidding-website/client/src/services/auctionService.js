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
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase.config';

// Helper to get Firestore timestamp
const getTimestamp = () => serverTimestamp();

export const auctionService = {
  /**
   * Create a new auction
   */
  async createAuction(auctionData) {
    const auctionsRef = collection(firestore, 'auctions');
    
    const docRef = await addDoc(auctionsRef, {
      ...auctionData,
      createdBy: auctionData.createdBy || auctionData.ownerId,
      status: 'pending',
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    });
    
    return { auctionId: docRef.id };
  },

  /**
   * Get all auctions
   */
  async getAllAuctions() {
    const auctionsRef = collection(firestore, 'auctions');
    const q = query(
      auctionsRef, 
      where('status', 'in', ['pending', 'live']),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Get auction by ID
   */
  async getAuctionById(id) {
    const auctionRef = doc(firestore, 'auctions', id);
    const auctionSnap = await getDoc(auctionRef);
    
    if (!auctionSnap.exists()) {
      throw new Error('Auction not found');
    }
    
    return { auction: { id: auctionSnap.id, ...auctionSnap.data() } };
  },

  /**
   * Start an auction
   */
  async startAuction(id) {
    const auctionRef = doc(firestore, 'auctions', id);
    await updateDoc(auctionRef, {
      status: 'live',
      startedAt: getTimestamp(),
      updatedAt: getTimestamp()
    });
    
    return { success: true };
  },

  /**
   * End an auction
   */
  async endAuction(id) {
    const auctionRef = doc(firestore, 'auctions', id);
    await updateDoc(auctionRef, {
      status: 'completed',
      endedAt: getTimestamp(),
      updatedAt: getTimestamp()
    });
    
    return { success: true };
  },

  /**
   * Add an item to an auction
   */
  async addAuctionItem(itemData) {
    const itemsRef = collection(firestore, 'auctionItems');
    
    const docRef = await addDoc(itemsRef, {
      ...itemData,
      auctionId: itemData.auctionId,
      status: 'available',
      currentBid: 0,
      bidCount: 0,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp()
    });
    
    // Update auction's item count
    const auctionRef = doc(firestore, 'auctions', itemData.auctionId);
    await updateDoc(auctionRef, {
      itemCount: increment(1),
      updatedAt: getTimestamp()
    });
    
    return { itemId: docRef.id };
  },

  /**
   * Get items for an auction
   */
  async getAuctionItems(auctionId) {
    const itemsRef = collection(firestore, 'auctionItems');
    const q = query(
      itemsRef,
      where('auctionId', '==', auctionId),
      orderBy('createdAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Place a bid on an item
   */
  async placeBid(bidData) {
    const { itemId, auctionId, bidderId, bidderName, bidAmount, teamId, teamName } = bidData;
    
    // Add bid to bids collection
    const bidsRef = collection(firestore, 'bids');
    const bidRef = await addDoc(bidsRef, {
      itemId,
      auctionId,
      bidderId,
      bidderName,
      bidAmount,
      teamId: teamId || null,
      teamName: teamName || null,
      isWinning: false,
      createdAt: getTimestamp()
    });
    
    // Update item with new bid
    const itemRef = doc(firestore, 'auctionItems', itemId);
    await updateDoc(itemRef, {
      currentBid: bidAmount,
      bidCount: increment(1),
      highestBidderId: bidderId,
      highestBidderName: bidderName,
      updatedAt: getTimestamp()
    });
    
    // Add bid to auction's bids array
    const auctionRef = doc(firestore, 'auctions', auctionId);
    await updateDoc(auctionRef, {
      lastBidAmount: bidAmount,
      bidCount: increment(1),
      updatedAt: getTimestamp()
    });
    
    return { bidId: bidRef.id };
  },

  /**
   * Get bids for an item
   */
  async getItemBids(itemId) {
    const bidsRef = collection(firestore, 'bids');
    const q = query(
      bidsRef,
      where('itemId', '==', itemId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Get auctions created by a user
   */
  async getUserAuctions(userId) {
    const auctionsRef = collection(firestore, 'auctions');
    const q = query(
      auctionsRef,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Get bids placed by a user
   */
  async getUserBids(userId) {
    const bidsRef = collection(firestore, 'bids');
    const q = query(
      bidsRef,
      where('bidderId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Get live auctions
   */
  async getLiveAuctions() {
    const auctionsRef = collection(firestore, 'auctions');
    const q = query(
      auctionsRef,
      where('status', '==', 'live'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  /**
   * Join an auction as a participant
   */
  async joinAuction(auctionId, userId, teamName) {
    const auctionRef = doc(firestore, 'auctions', auctionId);
    await updateDoc(auctionRef, {
      participants: arrayUnion({ userId, teamName }),
      updatedAt: getTimestamp()
    });
    
    return { success: true };
  },

  /**
   * Leave an auction
   */
  async leaveAuction(auctionId, userId) {
    const auctionRef = doc(firestore, 'auctions', auctionId);
    await updateDoc(auctionRef, {
      participants: arrayRemove({ userId }),
      updatedAt: getTimestamp()
    });
    
    return { success: true };
  }
};

export default auctionService;
