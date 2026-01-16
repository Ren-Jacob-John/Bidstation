/**
 * Database Queries for Bidstation
 * Comprehensive query functions for all database operations
 */

import pool from './index.js';

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(fullName, email, password, role = 'user') {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
    [fullName, email, password, role]
  );
  return result.insertId;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

/**
 * Get user by ID
 */
export async function getUserById(id) {
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

/**
 * Update user profile
 */
export async function updateUser(id, updates) {
  const allowedFields = ['full_name', 'phone', 'avatar_url', 'bio', 'email_notifications'];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return false;

  values.push(id);
  await pool.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return true;
}

/**
 * Update user password
 */
export async function updateUserPassword(id, hashedPassword) {
  await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  return true;
}

/**
 * Verify user email
 */
export async function verifyUserEmail(id) {
  await pool.execute('UPDATE users SET is_verified = 1 WHERE id = ?', [id]);
  return true;
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(id) {
  await pool.execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}

/**
 * Get user statistics
 */
export async function getUserStats(userId) {
  const [rows] = await pool.execute(
    `SELECT 
      (SELECT COUNT(*) FROM auctions WHERE created_by = ?) AS auctions_created,
      (SELECT COUNT(*) FROM auctions WHERE winner_id = ?) AS auctions_won,
      (SELECT COUNT(*) FROM bids WHERE user_id = ?) AS total_bids,
      (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = ?) AS avg_rating,
      (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = ?) AS review_count`,
    [userId, userId, userId, userId, userId]
  );
  return rows[0];
}

// ============================================================================
// EMAIL VERIFICATION QUERIES
// ============================================================================

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(userId, token, expiresAt) {
  const [result] = await pool.execute(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return result.insertId;
}

/**
 * Get email verification token
 */
export async function getEmailVerificationToken(token) {
  const [rows] = await pool.execute(
    'SELECT * FROM email_verification_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
}

/**
 * Mark email verification token as used
 */
export async function markEmailVerificationTokenUsed(tokenId) {
  await pool.execute('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = ?', [tokenId]);
}

// ============================================================================
// PASSWORD RESET QUERIES
// ============================================================================

/**
 * Create password reset token
 */
export async function createPasswordResetToken(userId, token, expiresAt) {
  const [result] = await pool.execute(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [userId, token, expiresAt]
  );
  return result.insertId;
}

/**
 * Get password reset token
 */
export async function getPasswordResetToken(token) {
  const [rows] = await pool.execute(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
    [token]
  );
  return rows[0] || null;
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenUsed(tokenId) {
  await pool.execute('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [tokenId]);
}

// ============================================================================
// SESSION QUERIES
// ============================================================================

/**
 * Create user session
 */
export async function createUserSession(userId, tokenHash, expiresAt, ipAddress = null, userAgent = null) {
  const [result] = await pool.execute(
    'INSERT INTO user_sessions (user_id, token_hash, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
    [userId, tokenHash, expiresAt, ipAddress, userAgent]
  );
  return result.insertId;
}

/**
 * Get user session by token hash
 */
export async function getUserSession(tokenHash) {
  const [rows] = await pool.execute(
    'SELECT * FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  );
  return rows[0] || null;
}

/**
 * Delete user session
 */
export async function deleteUserSession(tokenHash) {
  await pool.execute('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
}

/**
 * Delete all user sessions
 */
export async function deleteAllUserSessions(userId) {
  await pool.execute('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
}

// ============================================================================
// CATEGORY QUERIES
// ============================================================================

/**
 * Get all categories
 */
export async function getAllCategories() {
  const [rows] = await pool.execute(
    'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name'
  );
  return rows;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug) {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE slug = ?', [slug]);
  return rows[0] || null;
}

/**
 * Get category by ID
 */
export async function getCategoryById(id) {
  const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
  return rows[0] || null;
}

// ============================================================================
// AUCTION QUERIES
// ============================================================================

/**
 * Create a new auction
 */
export async function createAuction({
  title,
  slug,
  description,
  short_description,
  category_id,
  start_price,
  reserve_price,
  buy_now_price,
  bid_increment,
  start_time,
  end_time,
  item_condition,
  quantity,
  shipping_cost,
  shipping_info,
  location,
  created_by,
  is_private,
  invite_code,
  status = 'draft'
}) {
  const [result] = await pool.execute(
    `INSERT INTO auctions (
      title, slug, description, short_description, category_id,
      start_price, reserve_price, buy_now_price, current_price, bid_increment,
      start_time, end_time, item_condition, quantity,
      shipping_cost, shipping_info, location, created_by,
      is_private, invite_code, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title, slug, description, short_description, category_id,
      start_price, reserve_price, buy_now_price, start_price, bid_increment || 1.00,
      start_time, end_time, item_condition, quantity || 1,
      shipping_cost, shipping_info, location, created_by,
      is_private ? 1 : 0, invite_code, status
    ]
  );
  return result.insertId;
}

/**
 * Get auction by ID
 */
export async function getAuctionById(id) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name AS seller_name, u.email AS seller_email,
            c.name AS category_name, c.slug AS category_slug
     FROM auctions a
     LEFT JOIN users u ON a.created_by = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Get auction by slug
 */
export async function getAuctionBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name AS seller_name, u.email AS seller_email,
            c.name AS category_name, c.slug AS category_slug
     FROM auctions a
     LEFT JOIN users u ON a.created_by = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.slug = ?`,
    [slug]
  );
  return rows[0] || null;
}

/**
 * List active auctions with pagination
 */
export async function listActiveAuctions(page = 1, limit = 20, filters = {}) {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE a.status = 'active' AND a.end_time > NOW()";
  const params = [];

  if (filters.category_id) {
    whereClause += ' AND a.category_id = ?';
    params.push(filters.category_id);
  }

  if (filters.search) {
    whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters.min_price) {
    whereClause += ' AND a.current_price >= ?';
    params.push(filters.min_price);
  }

  if (filters.max_price) {
    whereClause += ' AND a.current_price <= ?';
    params.push(filters.max_price);
  }

  // Get total count
  const [countResult] = await pool.execute(
    `SELECT COUNT(*) AS total FROM auctions a ${whereClause}`,
    params
  );
  const total = countResult[0].total;

  // Get auctions
  const orderBy = filters.sort === 'ending_soon' ? 'a.end_time ASC' :
                  filters.sort === 'price_low' ? 'a.current_price ASC' :
                  filters.sort === 'price_high' ? 'a.current_price DESC' :
                  filters.sort === 'most_bids' ? 'a.bid_count DESC' :
                  'a.created_at DESC';

  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name AS seller_name,
            c.name AS category_name, c.slug AS category_slug,
            (SELECT image_url FROM auction_images WHERE auction_id = a.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM auctions a
     LEFT JOIN users u ON a.created_by = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    auctions: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * List featured auctions
 */
export async function listFeaturedAuctions(limit = 10) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name AS seller_name,
            c.name AS category_name,
            (SELECT image_url FROM auction_images WHERE auction_id = a.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM auctions a
     LEFT JOIN users u ON a.created_by = u.id
     LEFT JOIN categories c ON a.category_id = c.id
     WHERE a.status = 'active' AND a.is_featured = 1 AND a.end_time > NOW()
     ORDER BY a.end_time ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

/**
 * Get auctions by user (seller)
 */
export async function getAuctionsByUser(userId, status = null) {
  let query = `SELECT a.*, c.name AS category_name,
               (SELECT image_url FROM auction_images WHERE auction_id = a.id AND is_primary = 1 LIMIT 1) AS primary_image
               FROM auctions a
               LEFT JOIN categories c ON a.category_id = c.id
               WHERE a.created_by = ?`;
  const params = [userId];

  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }

  query += ' ORDER BY a.created_at DESC';

  const [rows] = await pool.execute(query, params);
  return rows;
}

/**
 * Update auction
 */
export async function updateAuction(id, updates) {
  const allowedFields = [
    'title', 'slug', 'description', 'short_description', 'category_id',
    'start_price', 'reserve_price', 'buy_now_price', 'bid_increment',
    'start_time', 'end_time', 'item_condition', 'quantity',
    'shipping_cost', 'shipping_info', 'location', 'status',
    'is_featured', 'is_private', 'invite_code'
  ];
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return false;

  values.push(id);
  await pool.execute(
    `UPDATE auctions SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  return true;
}

/**
 * Update auction status
 */
export async function updateAuctionStatus(id, status, winnerId = null) {
  if (winnerId) {
    await pool.execute(
      'UPDATE auctions SET status = ?, winner_id = ?, completed_at = NOW() WHERE id = ?',
      [status, winnerId, id]
    );
  } else {
    await pool.execute('UPDATE auctions SET status = ? WHERE id = ?', [status, id]);
  }
  return true;
}

/**
 * Increment auction view count
 */
export async function incrementAuctionViews(id) {
  await pool.execute('UPDATE auctions SET view_count = view_count + 1 WHERE id = ?', [id]);
}

/**
 * Get auctions ending soon
 */
export async function getAuctionsEndingSoon(minutes = 60, limit = 10) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.full_name AS seller_name,
            (SELECT image_url FROM auction_images WHERE auction_id = a.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM auctions a
     LEFT JOIN users u ON a.created_by = u.id
     WHERE a.status = 'active' AND a.end_time > NOW() AND a.end_time <= DATE_ADD(NOW(), INTERVAL ? MINUTE)
     ORDER BY a.end_time ASC
     LIMIT ?`,
    [minutes, limit]
  );
  return rows;
}

// ============================================================================
// AUCTION IMAGES QUERIES
// ============================================================================

/**
 * Add auction image
 */
export async function addAuctionImage(auctionId, imageUrl, thumbnailUrl = null, altText = null, isPrimary = false, sortOrder = 0) {
  const [result] = await pool.execute(
    'INSERT INTO auction_images (auction_id, image_url, thumbnail_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    [auctionId, imageUrl, thumbnailUrl, altText, isPrimary ? 1 : 0, sortOrder]
  );
  return result.insertId;
}

/**
 * Get auction images
 */
export async function getAuctionImages(auctionId) {
  const [rows] = await pool.execute(
    'SELECT * FROM auction_images WHERE auction_id = ? ORDER BY is_primary DESC, sort_order ASC',
    [auctionId]
  );
  return rows;
}

/**
 * Delete auction image
 */
export async function deleteAuctionImage(imageId) {
  await pool.execute('DELETE FROM auction_images WHERE id = ?', [imageId]);
}

/**
 * Set primary auction image
 */
export async function setPrimaryAuctionImage(auctionId, imageId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute('UPDATE auction_images SET is_primary = 0 WHERE auction_id = ?', [auctionId]);
    await conn.execute('UPDATE auction_images SET is_primary = 1 WHERE id = ? AND auction_id = ?', [imageId, auctionId]);
    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ============================================================================
// BID QUERIES
// ============================================================================

/**
 * Place a bid
 */
export async function placeBid(auctionId, userId, amount, maxBid = null, isAutoBid = false, ipAddress = null) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert bid
    const [bidResult] = await conn.execute(
      'INSERT INTO bids (auction_id, user_id, amount, max_bid, is_auto_bid, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [auctionId, userId, amount, maxBid, isAutoBid ? 1 : 0, ipAddress]
    );

    // Update current price and bid count
    await conn.execute(
      'UPDATE auctions SET current_price = ?, bid_count = bid_count + 1 WHERE id = ?',
      [amount, auctionId]
    );

    // Update previous winning bid
    await conn.execute(
      'UPDATE bids SET is_winning = 0 WHERE auction_id = ? AND is_winning = 1',
      [auctionId]
    );

    // Set this bid as winning
    await conn.execute(
      'UPDATE bids SET is_winning = 1 WHERE id = ?',
      [bidResult.insertId]
    );

    await conn.commit();
    return bidResult.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Get bids for an auction
 */
export async function getAuctionBids(auctionId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT b.*, u.full_name AS bidder_name
     FROM bids b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.auction_id = ?
     ORDER BY b.amount DESC, b.created_at DESC
     LIMIT ?`,
    [auctionId, limit]
  );
  return rows;
}

/**
 * Get highest bid for an auction
 */
export async function getHighestBid(auctionId) {
  const [rows] = await pool.execute(
    `SELECT b.*, u.full_name AS bidder_name
     FROM bids b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.auction_id = ?
     ORDER BY b.amount DESC
     LIMIT 1`,
    [auctionId]
  );
  return rows[0] || null;
}

/**
 * Get user's bids
 */
export async function getUserBids(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT b.*, a.title AS auction_title, a.slug AS auction_slug, a.status AS auction_status,
            a.end_time AS auction_end_time, a.current_price AS auction_current_price
     FROM bids b
     LEFT JOIN auctions a ON b.auction_id = a.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Check if user has bid on auction
 */
export async function hasUserBidOnAuction(userId, auctionId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM bids WHERE user_id = ? AND auction_id = ?',
    [userId, auctionId]
  );
  return rows[0].count > 0;
}

// ============================================================================
// AUTO-BID QUERIES
// ============================================================================

/**
 * Set auto-bid
 */
export async function setAutoBid(auctionId, userId, maxAmount) {
  await pool.execute(
    `INSERT INTO auto_bids (auction_id, user_id, max_amount)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE max_amount = ?, is_active = 1`,
    [auctionId, userId, maxAmount, maxAmount]
  );
  return true;
}

/**
 * Get auto-bid
 */
export async function getAutoBid(auctionId, userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM auto_bids WHERE auction_id = ? AND user_id = ? AND is_active = 1',
    [auctionId, userId]
  );
  return rows[0] || null;
}

/**
 * Get all active auto-bids for an auction
 */
export async function getActiveAutoBids(auctionId) {
  const [rows] = await pool.execute(
    'SELECT * FROM auto_bids WHERE auction_id = ? AND is_active = 1 ORDER BY max_amount DESC',
    [auctionId]
  );
  return rows;
}

/**
 * Deactivate auto-bid
 */
export async function deactivateAutoBid(auctionId, userId) {
  await pool.execute(
    'UPDATE auto_bids SET is_active = 0 WHERE auction_id = ? AND user_id = ?',
    [auctionId, userId]
  );
}

// ============================================================================
// AUCTION PARTICIPANTS QUERIES
// ============================================================================

/**
 * Join auction
 */
export async function joinAuction(auctionId, userId) {
  await pool.execute(
    'INSERT IGNORE INTO auction_participants (auction_id, user_id) VALUES (?, ?)',
    [auctionId, userId]
  );
}

/**
 * Leave auction
 */
export async function leaveAuction(auctionId, userId) {
  await pool.execute(
    "UPDATE auction_participants SET status = 'left', left_at = NOW() WHERE auction_id = ? AND user_id = ?",
    [auctionId, userId]
  );
}

/**
 * Get auction participants
 */
export async function getAuctionParticipants(auctionId) {
  const [rows] = await pool.execute(
    `SELECT ap.*, u.full_name, u.email
     FROM auction_participants ap
     LEFT JOIN users u ON ap.user_id = u.id
     WHERE ap.auction_id = ? AND ap.status = 'joined'
     ORDER BY ap.joined_at ASC`,
    [auctionId]
  );
  return rows;
}

/**
 * Check if user is participant
 */
export async function isUserParticipant(auctionId, userId) {
  const [rows] = await pool.execute(
    "SELECT COUNT(*) AS count FROM auction_participants WHERE auction_id = ? AND user_id = ? AND status = 'joined'",
    [auctionId, userId]
  );
  return rows[0].count > 0;
}

// ============================================================================
// WATCHLIST QUERIES
// ============================================================================

/**
 * Add to watchlist
 */
export async function addToWatchlist(userId, auctionId, notifyOnBid = true, notifyOnEnd = true) {
  await pool.execute(
    `INSERT INTO watchlist (user_id, auction_id, notify_on_bid, notify_on_end)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE notify_on_bid = ?, notify_on_end = ?`,
    [userId, auctionId, notifyOnBid ? 1 : 0, notifyOnEnd ? 1 : 0, notifyOnBid ? 1 : 0, notifyOnEnd ? 1 : 0]
  );

  // Update watch count
  await pool.execute(
    'UPDATE auctions SET watch_count = (SELECT COUNT(*) FROM watchlist WHERE auction_id = ?) WHERE id = ?',
    [auctionId, auctionId]
  );
}

/**
 * Remove from watchlist
 */
export async function removeFromWatchlist(userId, auctionId) {
  await pool.execute('DELETE FROM watchlist WHERE user_id = ? AND auction_id = ?', [userId, auctionId]);

  // Update watch count
  await pool.execute(
    'UPDATE auctions SET watch_count = (SELECT COUNT(*) FROM watchlist WHERE auction_id = ?) WHERE id = ?',
    [auctionId, auctionId]
  );
}

/**
 * Get user's watchlist
 */
export async function getUserWatchlist(userId) {
  const [rows] = await pool.execute(
    `SELECT w.*, a.title, a.slug, a.current_price, a.end_time, a.status,
            (SELECT image_url FROM auction_images WHERE auction_id = a.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM watchlist w
     LEFT JOIN auctions a ON w.auction_id = a.id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Check if auction is in user's watchlist
 */
export async function isInWatchlist(userId, auctionId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM watchlist WHERE user_id = ? AND auction_id = ?',
    [userId, auctionId]
  );
  return rows[0].count > 0;
}

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

/**
 * Create transaction
 */
export async function createTransaction({
  auction_id,
  buyer_id,
  seller_id,
  bid_amount,
  shipping_cost = 0,
  platform_fee = 0
}) {
  const total_amount = parseFloat(bid_amount) + parseFloat(shipping_cost) + parseFloat(platform_fee);
  const [result] = await pool.execute(
    `INSERT INTO transactions (auction_id, buyer_id, seller_id, bid_amount, shipping_cost, platform_fee, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [auction_id, buyer_id, seller_id, bid_amount, shipping_cost, platform_fee, total_amount]
  );
  return result.insertId;
}

/**
 * Get transaction by ID
 */
export async function getTransactionById(id) {
  const [rows] = await pool.execute(
    `SELECT t.*, a.title AS auction_title, a.slug AS auction_slug,
            buyer.full_name AS buyer_name, buyer.email AS buyer_email,
            seller.full_name AS seller_name, seller.email AS seller_email
     FROM transactions t
     LEFT JOIN auctions a ON t.auction_id = a.id
     LEFT JOIN users buyer ON t.buyer_id = buyer.id
     LEFT JOIN users seller ON t.seller_id = seller.id
     WHERE t.id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Get user's transactions (as buyer or seller)
 */
export async function getUserTransactions(userId, role = 'both') {
  let whereClause = '';
  if (role === 'buyer') {
    whereClause = 'WHERE t.buyer_id = ?';
  } else if (role === 'seller') {
    whereClause = 'WHERE t.seller_id = ?';
  } else {
    whereClause = 'WHERE t.buyer_id = ? OR t.seller_id = ?';
  }

  const params = role === 'both' ? [userId, userId] : [userId];

  const [rows] = await pool.execute(
    `SELECT t.*, a.title AS auction_title, a.slug AS auction_slug,
            buyer.full_name AS buyer_name, seller.full_name AS seller_name
     FROM transactions t
     LEFT JOIN auctions a ON t.auction_id = a.id
     LEFT JOIN users buyer ON t.buyer_id = buyer.id
     LEFT JOIN users seller ON t.seller_id = seller.id
     ${whereClause}
     ORDER BY t.created_at DESC`,
    params
  );
  return rows;
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(id, status, additionalData = {}) {
  const updates = ['status = ?'];
  const values = [status];

  if (status === 'paid' && !additionalData.paid_at) {
    updates.push('paid_at = NOW()');
  }
  if (status === 'shipped') {
    updates.push('shipped_at = NOW()');
    if (additionalData.tracking_number) {
      updates.push('tracking_number = ?');
      values.push(additionalData.tracking_number);
    }
  }
  if (status === 'delivered') {
    updates.push('delivered_at = NOW()');
  }
  if (status === 'completed') {
    updates.push('completed_at = NOW()');
  }

  if (additionalData.shipping_address) {
    updates.push('shipping_address = ?');
    values.push(additionalData.shipping_address);
  }
  if (additionalData.payment_method) {
    updates.push('payment_method = ?');
    values.push(additionalData.payment_method);
  }
  if (additionalData.payment_reference) {
    updates.push('payment_reference = ?');
    values.push(additionalData.payment_reference);
  }

  values.push(id);
  await pool.execute(
    `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return true;
}

// ============================================================================
// REVIEW QUERIES
// ============================================================================

/**
 * Create review
 */
export async function createReview({
  transaction_id,
  reviewer_id,
  reviewed_user_id,
  rating,
  title = null,
  comment = null
}) {
  const [result] = await pool.execute(
    'INSERT INTO reviews (transaction_id, reviewer_id, reviewed_user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?, ?)',
    [transaction_id, reviewer_id, reviewed_user_id, rating, title, comment]
  );
  return result.insertId;
}

/**
 * Get reviews for a user
 */
export async function getUserReviews(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT r.*, u.full_name AS reviewer_name
     FROM reviews r
     LEFT JOIN users u ON r.reviewer_id = u.id
     WHERE r.reviewed_user_id = ? AND r.is_visible = 1
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Get user's average rating
 */
export async function getUserAverageRating(userId) {
  const [rows] = await pool.execute(
    'SELECT AVG(rating) AS avg_rating, COUNT(*) AS review_count FROM reviews WHERE reviewed_user_id = ? AND is_visible = 1',
    [userId]
  );
  return rows[0];
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

/**
 * Create notification
 */
export async function createNotification(userId, type, title, message, data = null) {
  const [result] = await pool.execute(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  return result.insertId;
}

/**
 * Get user's notifications
 */
export async function getUserNotifications(userId, unreadOnly = false, limit = 50) {
  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  if (unreadOnly) {
    query += ' AND is_read = 0';
  }
  query += ' ORDER BY created_at DESC LIMIT ?';

  const [rows] = await pool.execute(query, [userId, limit]);
  return rows;
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId) {
  await pool.execute('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE id = ?', [notificationId]);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId) {
  await pool.execute('UPDATE notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0', [userId]);
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId]
  );
  return rows[0].count;
}

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

/**
 * Send message
 */
export async function sendMessage(senderId, receiverId, content, subject = null, auctionId = null) {
  const [result] = await pool.execute(
    'INSERT INTO messages (sender_id, receiver_id, auction_id, subject, content) VALUES (?, ?, ?, ?, ?)',
    [senderId, receiverId, auctionId, subject, content]
  );
  return result.insertId;
}

/**
 * Get user's messages (inbox)
 */
export async function getUserInbox(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT m.*, u.full_name AS sender_name, u.email AS sender_email
     FROM messages m
     LEFT JOIN users u ON m.sender_id = u.id
     WHERE m.receiver_id = ? AND m.deleted_by_receiver = 0
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Get user's sent messages
 */
export async function getUserSentMessages(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT m.*, u.full_name AS receiver_name, u.email AS receiver_email
     FROM messages m
     LEFT JOIN users u ON m.receiver_id = u.id
     WHERE m.sender_id = ? AND m.deleted_by_sender = 0
     ORDER BY m.created_at DESC
     LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Mark message as read
 */
export async function markMessageRead(messageId) {
  await pool.execute('UPDATE messages SET is_read = 1, read_at = NOW() WHERE id = ?', [messageId]);
}

/**
 * Delete message (soft delete)
 */
export async function deleteMessage(messageId, userId, isSender) {
  const field = isSender ? 'deleted_by_sender' : 'deleted_by_receiver';
  await pool.execute(`UPDATE messages SET ${field} = 1 WHERE id = ?`, [messageId]);
}

// ============================================================================
// REPORT QUERIES
// ============================================================================

/**
 * Create report
 */
export async function createReport({
  reporter_id,
  reported_user_id = null,
  reported_auction_id = null,
  reason,
  description = null
}) {
  const [result] = await pool.execute(
    'INSERT INTO reports (reporter_id, reported_user_id, reported_auction_id, reason, description) VALUES (?, ?, ?, ?, ?)',
    [reporter_id, reported_user_id, reported_auction_id, reason, description]
  );
  return result.insertId;
}

/**
 * Get pending reports (for admins)
 */
export async function getPendingReports(limit = 50) {
  const [rows] = await pool.execute(
    `SELECT r.*, 
            reporter.full_name AS reporter_name,
            reported_user.full_name AS reported_user_name,
            a.title AS reported_auction_title
     FROM reports r
     LEFT JOIN users reporter ON r.reporter_id = reporter.id
     LEFT JOIN users reported_user ON r.reported_user_id = reported_user.id
     LEFT JOIN auctions a ON r.reported_auction_id = a.id
     WHERE r.status IN ('pending', 'reviewing')
     ORDER BY r.created_at ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

/**
 * Resolve report
 */
export async function resolveReport(reportId, resolvedBy, status, resolutionNotes = null) {
  await pool.execute(
    'UPDATE reports SET status = ?, resolved_by = ?, resolution_notes = ?, resolved_at = NOW() WHERE id = ?',
    [status, resolvedBy, resolutionNotes, reportId]
  );
}

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

/**
 * Create audit log
 */
export async function createAuditLog({
  user_id = null,
  entity,
  entity_id = null,
  action,
  old_values = null,
  new_values = null,
  ip_address = null,
  user_agent = null
}) {
  const [result] = await pool.execute(
    'INSERT INTO audit_logs (user_id, entity, entity_id, action, old_values, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      user_id,
      entity,
      entity_id,
      action,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      ip_address,
      user_agent
    ]
  );
  return result.insertId;
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(entity, entityId, limit = 100) {
  const [rows] = await pool.execute(
    `SELECT al.*, u.full_name AS user_name
     FROM audit_logs al
     LEFT JOIN users u ON al.user_id = u.id
     WHERE al.entity = ? AND al.entity_id = ?
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [entity, entityId, limit]
  );
  return rows;
}

// ============================================================================
// SETTINGS QUERIES
// ============================================================================

/**
 * Get setting by key
 */
export async function getSetting(key) {
  const [rows] = await pool.execute('SELECT * FROM settings WHERE setting_key = ?', [key]);
  if (!rows[0]) return null;

  const setting = rows[0];
  switch (setting.setting_type) {
    case 'number':
      return parseFloat(setting.setting_value);
    case 'boolean':
      return setting.setting_value === 'true';
    case 'json':
      return JSON.parse(setting.setting_value);
    default:
      return setting.setting_value;
  }
}

/**
 * Get all public settings
 */
export async function getPublicSettings() {
  const [rows] = await pool.execute('SELECT * FROM settings WHERE is_public = 1');
  const settings = {};
  for (const row of rows) {
    switch (row.setting_type) {
      case 'number':
        settings[row.setting_key] = parseFloat(row.setting_value);
        break;
      case 'boolean':
        settings[row.setting_key] = row.setting_value === 'true';
        break;
      case 'json':
        settings[row.setting_key] = JSON.parse(row.setting_value);
        break;
      default:
        settings[row.setting_key] = row.setting_value;
    }
  }
  return settings;
}

/**
 * Update setting
 */
export async function updateSetting(key, value) {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  await pool.execute('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [stringValue, key]);
}

// ============================================================================
// UTILITY QUERIES
// ============================================================================

/**
 * Generate unique slug for auction
 */
export async function generateUniqueSlug(title) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const [rows] = await pool.execute('SELECT COUNT(*) AS count FROM auctions WHERE slug = ?', [slug]);
    if (rows[0].count === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Check database connection
 */
export async function checkConnection() {
  try {
    await pool.execute('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
}

export default {
  // Users
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  updateUserPassword,
  verifyUserEmail,
  updateLastLogin,
  getUserStats,

  // Email verification
  createEmailVerificationToken,
  getEmailVerificationToken,
  markEmailVerificationTokenUsed,

  // Password reset
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,

  // Sessions
  createUserSession,
  getUserSession,
  deleteUserSession,
  deleteAllUserSessions,

  // Categories
  getAllCategories,
  getCategoryBySlug,
  getCategoryById,

  // Auctions
  createAuction,
  getAuctionById,
  getAuctionBySlug,
  listActiveAuctions,
  listFeaturedAuctions,
  getAuctionsByUser,
  updateAuction,
  updateAuctionStatus,
  incrementAuctionViews,
  getAuctionsEndingSoon,

  // Auction images
  addAuctionImage,
  getAuctionImages,
  deleteAuctionImage,
  setPrimaryAuctionImage,

  // Bids
  placeBid,
  getAuctionBids,
  getHighestBid,
  getUserBids,
  hasUserBidOnAuction,

  // Auto-bids
  setAutoBid,
  getAutoBid,
  getActiveAutoBids,
  deactivateAutoBid,

  // Participants
  joinAuction,
  leaveAuction,
  getAuctionParticipants,
  isUserParticipant,

  // Watchlist
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist,
  isInWatchlist,

  // Transactions
  createTransaction,
  getTransactionById,
  getUserTransactions,
  updateTransactionStatus,

  // Reviews
  createReview,
  getUserReviews,
  getUserAverageRating,

  // Notifications
  createNotification,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,

  // Messages
  sendMessage,
  getUserInbox,
  getUserSentMessages,
  markMessageRead,
  deleteMessage,

  // Reports
  createReport,
  getPendingReports,
  resolveReport,

  // Audit logs
  createAuditLog,
  getAuditLogs,

  // Settings
  getSetting,
  getPublicSettings,
  updateSetting,

  // Utilities
  generateUniqueSlug,
  checkConnection
};
