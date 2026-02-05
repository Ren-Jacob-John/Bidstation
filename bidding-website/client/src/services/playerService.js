// ---------------------------------------------------------------------------
// client/src/services/playerService.js - Firestore Player Operations
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
  serverTimestamp
} from 'firebase/firestore';
import { firestore, fireAuth } from '../firebase/firebase.config';

// ---------------------------------------------------------------------------
// Create a new player in the catalogue
// ---------------------------------------------------------------------------
export const createPlayer = async (playerData) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const player = {
      ...playerData,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      status: 'available', // available, in_auction, sold
    };

    const playersRef = collection(firestore, 'players');
    const docRef = await addDoc(playersRef, player);

    return {
      id: docRef.id,
      ...player,
    };
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get a single player by ID
// ---------------------------------------------------------------------------
export const getPlayer = async (playerId) => {
  try {
    const playerRef = doc(firestore, 'players', playerId);
    const playerDoc = await getDoc(playerRef);

    if (!playerDoc.exists()) {
      throw new Error('Player not found');
    }

    return {
      id: playerDoc.id,
      ...playerDoc.data(),
      createdAt: playerDoc.data().createdAt?.toDate(),
    };
  } catch (error) {
    console.error('Error getting player:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get all players (with optional filters)
// ---------------------------------------------------------------------------
export const getAllPlayers = async (filters = {}) => {
  try {
    const playersRef = collection(firestore, 'players');
    let q = query(playersRef);

    // Apply filters
    if (filters.sport) {
      q = query(q, where('sport', '==', filters.sport));
    }
    if (filters.role) {
      q = query(q, where('role', '==', filters.role));
    }
    if (filters.nationality) {
      q = query(q, where('nationality', '==', filters.nationality));
    }
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Order by name
    q = query(q, orderBy('name', 'asc'));

    // Apply limit if specified
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    const players = [];

    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      });
    });

    return players;
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get players by sport
// ---------------------------------------------------------------------------
export const getPlayersBySport = async (sport) => {
  try {
    return await getAllPlayers({ sport });
  } catch (error) {
    console.error('Error getting players by sport:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get players by role
// ---------------------------------------------------------------------------
export const getPlayersByRole = async (role, sport = null) => {
  try {
    const filters = { role };
    if (sport) filters.sport = sport;
    return await getAllPlayers(filters);
  } catch (error) {
    console.error('Error getting players by role:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Update a player
// ---------------------------------------------------------------------------
export const updatePlayer = async (playerId, updates) => {
  try {
    const playerRef = doc(firestore, 'players', playerId);
    
    // Check if player exists
    const playerDoc = await getDoc(playerRef);
    if (!playerDoc.exists()) {
      throw new Error('Player not found');
    }

    await updateDoc(playerRef, updates);

    return {
      id: playerId,
      ...playerDoc.data(),
      ...updates,
    };
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Delete a player
// ---------------------------------------------------------------------------
export const deletePlayer = async (playerId) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const playerRef = doc(firestore, 'players', playerId);
    
    // Check if player exists
    const playerDoc = await getDoc(playerRef);
    if (!playerDoc.exists()) {
      throw new Error('Player not found');
    }

    // Only creator can delete (or implement admin check)
    if (playerDoc.data().createdBy !== user.uid) {
      throw new Error('Unauthorized: You can only delete your own players');
    }

    await deleteDoc(playerRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting player:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Search players by name
// ---------------------------------------------------------------------------
export const searchPlayers = async (searchTerm, filters = {}) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a simple implementation - for production, use Algolia or similar
    const allPlayers = await getAllPlayers(filters);
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return allPlayers.filter((player) => {
      return player.name?.toLowerCase().includes(lowerSearchTerm);
    });
  } catch (error) {
    console.error('Error searching players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get available players (not in auction, not sold)
// ---------------------------------------------------------------------------
export const getAvailablePlayers = async (sport = null) => {
  try {
    const filters = { status: 'available' };
    if (sport) filters.sport = sport;
    return await getAllPlayers(filters);
  } catch (error) {
    console.error('Error getting available players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Player role definitions by sport
// ---------------------------------------------------------------------------
export const getPlayerRolesBySport = (sport) => {
  const roles = {
    IPL: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'],
    PKL: ['Raider', 'Defender', 'All-Rounder'],
    ISL: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
    HIL: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'],
    PBL: ['Singles', 'Doubles', 'Mixed Doubles'],
    UTT: ['Singles', 'Doubles'],
    PVL: ['Outside Hitter', 'Middle Blocker', 'Setter', 'Libero'],
    IBL: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    PWL: ['Freestyle', 'Greco-Roman', 'Women\'s Wrestling'],
  };

  return roles[sport] || ['Player'];
};

// ---------------------------------------------------------------------------
// Get all supported sports
// ---------------------------------------------------------------------------
export const getSupportedSports = () => {
  return [
    { id: 'IPL', name: 'Indian Premier League', icon: '🏏' },
    { id: 'PKL', name: 'Pro Kabaddi League', icon: '🤼' },
    { id: 'ISL', name: 'Indian Super League', icon: '⚽' },
    { id: 'HIL', name: 'Hockey India League', icon: '🏑' },
    { id: 'PBL', name: 'Premier Badminton League', icon: '🏸' },
    { id: 'UTT', name: 'Ultimate Table Tennis', icon: '🏓' },
    { id: 'PVL', name: 'Pro Volleyball League', icon: '🏐' },
    { id: 'IBL', name: 'Indian Basketball League', icon: '🏀' },
    { id: 'PWL', name: 'Pro Wrestling League', icon: '🤼‍♂️' },
  ];
};

// ---------------------------------------------------------------------------
// Get default player stats template by sport
// ---------------------------------------------------------------------------
export const getDefaultStatsBySport = (sport) => {
  const statsTemplates = {
    IPL: {
      matches: 0,
      runs: 0,
      wickets: 0,
      catches: 0,
      average: 0,
      strikeRate: 0,
      economy: 0,
    },
    PKL: {
      matches: 0,
      raids: 0,
      tackles: 0,
      points: 0,
      successfulRaids: 0,
      successfulTackles: 0,
    },
    ISL: {
      matches: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      yellowCards: 0,
      redCards: 0,
    },
    HIL: {
      matches: 0,
      goals: 0,
      assists: 0,
      saves: 0,
      penaltyCorners: 0,
    },
    PBL: {
      matches: 0,
      wins: 0,
      losses: 0,
      ranking: null,
    },
    UTT: {
      matches: 0,
      wins: 0,
      losses: 0,
      ranking: null,
    },
    PVL: {
      matches: 0,
      points: 0,
      spikes: 0,
      blocks: 0,
      aces: 0,
    },
    IBL: {
      matches: 0,
      points: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
    },
    PWL: {
      matches: 0,
      wins: 0,
      losses: 0,
      points: 0,
      weightCategory: '',
    },
  };

  return statsTemplates[sport] || { matches: 0, points: 0 };
};

// ---------------------------------------------------------------------------
// Bulk import players
// ---------------------------------------------------------------------------
export const bulkImportPlayers = async (playersArray) => {
  try {
    const user = fireAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const promises = playersArray.map(async (playerData) => {
      const player = {
        ...playerData,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        status: 'available',
      };

      const playersRef = collection(firestore, 'players');
      const docRef = await addDoc(playersRef, player);

      return {
        id: docRef.id,
        ...player,
      };
    });

    const results = await Promise.all(promises);
    return {
      success: true,
      count: results.length,
      players: results,
    };
  } catch (error) {
    console.error('Error bulk importing players:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Get player statistics summary
// ---------------------------------------------------------------------------
export const getPlayerCatalogueStats = async () => {
  try {
    const players = await getAllPlayers();
    
    const stats = {
      total: players.length,
      available: players.filter(p => p.status === 'available').length,
      inAuction: players.filter(p => p.status === 'in_auction').length,
      sold: players.filter(p => p.status === 'sold').length,
      bySport: {},
      byRole: {},
      byNationality: {},
    };

    // Count by sport
    players.forEach(player => {
      stats.bySport[player.sport] = (stats.bySport[player.sport] || 0) + 1;
      stats.byRole[player.role] = (stats.byRole[player.role] || 0) + 1;
      stats.byNationality[player.nationality] = (stats.byNationality[player.nationality] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting player catalogue stats:', error);
    throw error;
  }
};

// ---------------------------------------------------------------------------
// Generate sample players for testing
// ---------------------------------------------------------------------------
export const generateSamplePlayers = (sport, count = 10) => {
  const roles = getPlayerRolesBySport(sport);
  const nationalities = ['India', 'Australia', 'England', 'South Africa', 'New Zealand'];
  const samplePlayers = [];

  for (let i = 1; i <= count; i++) {
    samplePlayers.push({
      name: `${sport} Player ${i}`,
      sport,
      role: roles[Math.floor(Math.random() * roles.length)],
      nationality: nationalities[Math.floor(Math.random() * nationalities.length)],
      basePrice: Math.floor(Math.random() * 10000000) + 1000000, // 1M to 11M
      imageUrl: '',
      stats: getDefaultStatsBySport(sport),
      bio: `Professional ${sport} player with ${i} years of experience`,
    });
  }

  return samplePlayers;
};

export default {
  createPlayer,
  getPlayer,
  getAllPlayers,
  getPlayersBySport,
  getPlayersByRole,
  updatePlayer,
  deletePlayer,
  searchPlayers,
  getAvailablePlayers,
  getPlayerRolesBySport,
  getSupportedSports,
  getDefaultStatsBySport,
  bulkImportPlayers,
  getPlayerCatalogueStats,
  generateSamplePlayers,
};
