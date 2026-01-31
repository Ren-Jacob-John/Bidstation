const db = require('../config/db');

// Create auction
exports.createAuction = async (req, res) => {
  try {
    console.log('Create auction received body:', JSON.stringify(req.body, null, 2));
    const { title, description, auctionType, sportType, startTime, endTime, teams } = req.body;
    console.log('Parsed values:', { title, description, auctionType, sportType, startTime, endTime, teams });
    
    const creatorId = req.user?.id || null;
    
    // Validate and convert ALL values to ensure no undefined
    const safeTitle = title === undefined ? null : title;
    const safeDescription = description === undefined ? null : description;
    const safeAuctionType = auctionType === undefined ? null : auctionType;
    const safeSportType = sportType === undefined ? null : sportType;
    const safeStartTime = startTime === undefined ? null : startTime;
    const safeEndTime = endTime === undefined ? null : endTime;
    const safeTeams = teams === undefined ? null : JSON.stringify(teams);
    const safeCreatorId = creatorId === undefined ? null : creatorId;
    
    console.log('Safe parameters:', { 
      safeTitle, 
      safeDescription, 
      safeAuctionType, 
      safeSportType, 
      safeStartTime, 
      safeEndTime, 
      safeTeams,
      safeCreatorId
    });
    
    // Additional validation
    if (safeCreatorId === null) {
      console.error('ERROR: creatorId is null/undefined - auth middleware issue');
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    const [result] = await db.execute(
      `INSERT INTO auctions (title, description, auction_type, sport_type, start_time, end_time, creator_id, teams, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [safeTitle, safeDescription, safeAuctionType, safeSportType, safeStartTime, safeEndTime, safeCreatorId, safeTeams]
    );

    res.status(201).json({
      message: 'Auction created successfully',
      auctionId: result.insertId
    });
  } catch (error) {
    console.error('Create auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all auctions
exports.getAllAuctions = async (req, res) => {
  try {
    const [auctions] = await db.execute(
      `SELECT a.*, u.username as creator_name 
       FROM auctions a
       JOIN users u ON a.creator_id = u.id
       ORDER BY a.created_at DESC`
    );

    res.json(auctions);
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get auction by ID
exports.getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [auctions] = await db.execute(
      `SELECT a.*, u.username as creator_name 
       FROM auctions a
       JOIN users u ON a.creator_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (auctions.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json(auctions[0]);
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start auction
exports.startAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the creator
    const [auctions] = await db.execute(
      'SELECT * FROM auctions WHERE id = ? AND creator_id = ?',
      [id, userId]
    );

    if (auctions.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to start this auction' });
    }

    await db.execute(
      'UPDATE auctions SET status = ? WHERE id = ?',
      ['live', id]
    );

    res.json({ message: 'Auction started successfully' });
  } catch (error) {
    console.error('Start auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// End auction
exports.endAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is the creator
    const [auctions] = await db.execute(
      'SELECT * FROM auctions WHERE id = ? AND creator_id = ?',
      [id, userId]
    );

    if (auctions.length === 0) {
      return res.status(403).json({ message: 'Unauthorized to end this auction' });
    }

    await db.execute(
      'UPDATE auctions SET status = ? WHERE id = ?',
      ['completed', id]
    );

    res.json({ message: 'Auction ended successfully' });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add item to auction
exports.addItem = async (req, res) => {
  try {
    const { auctionId, name, description, basePrice, category, imageUrl, playerDetails } = req.body;

    const [result] = await db.execute(
      `INSERT INTO auction_items (auction_id, name, description, base_price, category, image_url, player_details, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
      [auctionId, name, description, basePrice, category, imageUrl, JSON.stringify(playerDetails || null)]
    );

    res.status(201).json({
      message: 'Item added successfully',
      itemId: result.insertId
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get auction items
exports.getAuctionItems = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const [items] = await db.execute(
      'SELECT * FROM auction_items WHERE auction_id = ? ORDER BY id',
      [auctionId]
    );

    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Place bid
exports.placeBid = async (req, res) => {
  try {
    const { itemId, bidAmount, teamName } = req.body;
    const bidderId = req.user.id;

    // Get current item details
    const [items] = await db.execute(
      'SELECT * FROM auction_items WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = items[0];
    const currentPrice = item.current_price || item.base_price;

    if (bidAmount <= currentPrice) {
      return res.status(400).json({ message: 'Bid must be higher than current price' });
    }

    // Insert bid
    await db.execute(
      `INSERT INTO bids (item_id, bidder_id, bid_amount, team_name)
       VALUES (?, ?, ?, ?)`,
      [itemId, bidderId, bidAmount, teamName]
    );

    // Update item current price and bidder
    await db.execute(
      `UPDATE auction_items 
       SET current_price = ?, current_bidder_id = ?
       WHERE id = ?`,
      [bidAmount, bidderId, itemId]
    );

    res.json({ message: 'Bid placed successfully' });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get item bids
exports.getItemBids = async (req, res) => {
  try {
    const { itemId } = req.params;

    const [bids] = await db.execute(
      `SELECT b.*, u.username as bidder_name
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.item_id = ?
       ORDER BY b.bid_amount DESC`,
      [itemId]
    );

    res.json(bids);
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my bids
exports.getMyBids = async (req, res) => {
  try {
    const userId = req.user.id;

    const [bids] = await db.execute(
      `SELECT 
         b.*,
         ai.name as item_name,
         ai.current_price,
         ai.current_bidder_id,
         ai.status as item_status,
         a.title as auction_title,
         a.id as auction_id,
         a.status as auction_status,
         CASE WHEN ai.current_bidder_id = b.bidder_id THEN 1 ELSE 0 END as is_winning
       FROM bids b
       JOIN auction_items ai ON b.item_id = ai.id
       JOIN auctions a ON ai.auction_id = a.id
       WHERE b.bidder_id = ?
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json(bids);
  } catch (error) {
    console.error('Get my bids error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get my auctions
exports.getMyAuctions = async (req, res) => {
  try {
    const userId = req.user.id;

    const [auctions] = await db.execute(
      `SELECT 
         a.*,
         COUNT(DISTINCT ai.id) as item_count,
         COUNT(DISTINCT b.id) as bid_count,
         SUM(CASE WHEN ai.status = 'sold' THEN ai.current_price ELSE 0 END) as total_revenue
       FROM auctions a
       LEFT JOIN auction_items ai ON a.id = ai.auction_id
       LEFT JOIN bids b ON ai.id = b.item_id
       WHERE a.creator_id = ?
       GROUP BY a.id
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json(auctions);
  } catch (error) {
    console.error('Get my auctions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;