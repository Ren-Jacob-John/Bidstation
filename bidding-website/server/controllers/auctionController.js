const db = require('../config/db');

// Create new auction (IPL or Item)
exports.createAuction = async (req, res) => {
  try {
    const { title, description, auctionType, startTime, endTime, teams, basePrice } = req.body;
    const creatorId = req.user.userId;

    const [result] = await db.query(
      'INSERT INTO auctions (title, description, auction_type, start_time, end_time, creator_id, teams, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, auctionType, startTime, endTime, creatorId, JSON.stringify(teams || []), 'pending']
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
    const [auctions] = await db.query(`
      SELECT a.*, u.username as creator_name 
      FROM auctions a 
      LEFT JOIN users u ON a.creator_id = u.id 
      ORDER BY a.created_at DESC
    `);

    res.json({ auctions });
  } catch (error) {
    console.error('Get auctions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get auction by ID
exports.getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [auctions] = await db.query(`
      SELECT a.*, u.username as creator_name 
      FROM auctions a 
      LEFT JOIN users u ON a.creator_id = u.id 
      WHERE a.id = ?
    `, [id]);

    if (auctions.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    res.json({ auction: auctions[0] });
  } catch (error) {
    console.error('Get auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add player/item to auction
exports.addAuctionItem = async (req, res) => {
  try {
    const { auctionId, name, description, basePrice, category, imageUrl, playerDetails } = req.body;

    const [result] = await db.query(
      'INSERT INTO auction_items (auction_id, name, description, base_price, current_price, category, image_url, player_details, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [auctionId, name, description, basePrice, basePrice, category, imageUrl, JSON.stringify(playerDetails || {}), 'available']
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

// Get items for an auction
exports.getAuctionItems = async (req, res) => {
  try {
    const { auctionId } = req.params;

    const [items] = await db.query(
      'SELECT * FROM auction_items WHERE auction_id = ? ORDER BY created_at DESC',
      [auctionId]
    );

    res.json({ items });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Place bid
exports.placeBid = async (req, res) => {
  try {
    const { itemId, bidAmount, teamName } = req.body;
    const bidderId = req.user.userId;

    // Get current item details
    const [items] = await db.query('SELECT * FROM auction_items WHERE id = ?', [itemId]);
    if (items.length === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const item = items[0];

    // Check if bid is higher than current price
    if (bidAmount <= item.current_price) {
      return res.status(400).json({ message: 'Bid must be higher than current price' });
    }

    // Insert bid
    const [bidResult] = await db.query(
      'INSERT INTO bids (item_id, bidder_id, bid_amount, team_name) VALUES (?, ?, ?, ?)',
      [itemId, bidderId, bidAmount, teamName]
    );

    // Update item current price
    await db.query(
      'UPDATE auction_items SET current_price = ?, current_bidder_id = ? WHERE id = ?',
      [bidAmount, bidderId, itemId]
    );

    res.status(201).json({
      message: 'Bid placed successfully',
      bidId: bidResult.insertId
    });
  } catch (error) {
    console.error('Place bid error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get bids for an item
exports.getItemBids = async (req, res) => {
  try {
    const { itemId } = req.params;

    const [bids] = await db.query(`
      SELECT b.*, u.username as bidder_name 
      FROM bids b 
      LEFT JOIN users u ON b.bidder_id = u.id 
      WHERE b.item_id = ? 
      ORDER BY b.created_at DESC
    `, [itemId]);

    res.json({ bids });
  } catch (error) {
    console.error('Get bids error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start auction
exports.startAuction = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query('UPDATE auctions SET status = ? WHERE id = ?', ['live', id]);

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

    await db.query('UPDATE auctions SET status = ? WHERE id = ?', ['completed', id]);

    res.json({ message: 'Auction ended successfully' });
  } catch (error) {
    console.error('End auction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
