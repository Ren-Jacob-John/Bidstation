-- ============================================================================
-- MySQL Schema for Bidstation - Auction Platform
-- ============================================================================
-- Run this with the provided init script or using your MySQL client.
-- Command: node server/db/init.js
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bidstation DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bidstation;

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table - Core user information
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  avatar_url VARCHAR(500) NULL,
  bio TEXT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  role ENUM('user', 'seller', 'admin', 'moderator') NOT NULL DEFAULT 'user',
  email_notifications TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- User sessions for JWT token management
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- CATEGORIES & ITEMS
-- ============================================================================

-- Categories for organizing auctions
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  parent_id INT UNSIGNED NULL,
  icon VARCHAR(100) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_slug (slug),
  INDEX idx_parent_id (parent_id),
  INDEX idx_is_active (is_active),
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- AUCTIONS
-- ============================================================================

-- Auctions table - Main auction information
CREATE TABLE IF NOT EXISTS auctions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  description TEXT NULL,
  short_description VARCHAR(500) NULL,
  category_id INT UNSIGNED NULL,
  
  -- Pricing
  start_price DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  reserve_price DECIMAL(14,2) NULL COMMENT 'Minimum price seller will accept',
  buy_now_price DECIMAL(14,2) NULL COMMENT 'Instant purchase price',
  current_price DECIMAL(14,2) NULL,
  bid_increment DECIMAL(14,2) NOT NULL DEFAULT 1.00 COMMENT 'Minimum bid increment',
  
  -- Timing
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  extended_time INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Seconds added due to last-minute bids',
  
  -- Status
  status ENUM('draft', 'pending', 'active', 'completed', 'cancelled', 'failed') NOT NULL DEFAULT 'draft',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_private TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Private auctions require invite code',
  invite_code VARCHAR(50) NULL COMMENT 'Code for private auctions',
  
  -- Item details
  item_condition ENUM('new', 'like_new', 'good', 'fair', 'poor') NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  
  -- Shipping
  shipping_cost DECIMAL(10,2) NULL,
  shipping_info TEXT NULL,
  location VARCHAR(255) NULL,
  
  -- Ownership
  created_by INT UNSIGNED NOT NULL,
  winner_id INT UNSIGNED NULL,
  
  -- Metadata
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  bid_count INT UNSIGNED NOT NULL DEFAULT 0,
  watch_count INT UNSIGNED NOT NULL DEFAULT 0,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  
  PRIMARY KEY (id),
  INDEX idx_slug (slug),
  INDEX idx_created_by (created_by),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_start_time (start_time),
  INDEX idx_end_time (end_time),
  INDEX idx_is_featured (is_featured),
  INDEX idx_winner_id (winner_id),
  FULLTEXT INDEX ft_search (title, description),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Auction images
CREATE TABLE IF NOT EXISTS auction_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  alt_text VARCHAR(255) NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_auction_id (auction_id),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- BIDS
-- ============================================================================

-- Bids table - All bids placed on auctions
CREATE TABLE IF NOT EXISTS bids (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  max_bid DECIMAL(14,2) NULL COMMENT 'Auto-bid maximum amount',
  is_auto_bid TINYINT(1) NOT NULL DEFAULT 0,
  is_winning TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_amount (amount),
  INDEX idx_created_at (created_at),
  INDEX idx_is_winning (is_winning),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Auto-bid settings for users on specific auctions
CREATE TABLE IF NOT EXISTS auto_bids (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  max_amount DECIMAL(14,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_auto_bid (auction_id, user_id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- AUCTION PARTICIPANTS & WATCHLIST
-- ============================================================================

-- Auction participants (users who joined an auction)
CREATE TABLE IF NOT EXISTS auction_participants (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('joined', 'left', 'banned') NOT NULL DEFAULT 'joined',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY unique_participant (auction_id, user_id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Watchlist - Users watching auctions
CREATE TABLE IF NOT EXISTS watchlist (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  auction_id INT UNSIGNED NOT NULL,
  notify_on_bid TINYINT(1) NOT NULL DEFAULT 1,
  notify_on_end TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_watch (user_id, auction_id),
  INDEX idx_user_id (user_id),
  INDEX idx_auction_id (auction_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- TRANSACTIONS & PAYMENTS
-- ============================================================================

-- Transactions for completed auctions
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  auction_id INT UNSIGNED NOT NULL,
  buyer_id INT UNSIGNED NOT NULL,
  seller_id INT UNSIGNED NOT NULL,
  
  -- Amounts
  bid_amount DECIMAL(14,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(14,2) NOT NULL,
  
  -- Status
  status ENUM('pending', 'paid', 'shipped', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled') NOT NULL DEFAULT 'pending',
  
  -- Payment info
  payment_method VARCHAR(50) NULL,
  payment_reference VARCHAR(255) NULL,
  paid_at DATETIME NULL,
  
  -- Shipping info
  shipping_address TEXT NULL,
  tracking_number VARCHAR(100) NULL,
  shipped_at DATETIME NULL,
  delivered_at DATETIME NULL,
  
  -- Notes
  buyer_notes TEXT NULL,
  seller_notes TEXT NULL,
  
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  
  PRIMARY KEY (id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_seller_id (seller_id),
  INDEX idx_status (status),
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- REVIEWS & RATINGS
-- ============================================================================

-- User reviews after transactions
CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  transaction_id INT UNSIGNED NOT NULL,
  reviewer_id INT UNSIGNED NOT NULL,
  reviewed_user_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NULL,
  comment TEXT NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_review (transaction_id, reviewer_id),
  INDEX idx_reviewed_user_id (reviewed_user_id),
  INDEX idx_rating (rating),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- User notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('bid_placed', 'bid_outbid', 'auction_won', 'auction_lost', 'auction_ending', 'auction_ended', 'payment_received', 'item_shipped', 'review_received', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL COMMENT 'Additional data like auction_id, bid_id, etc.',
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- MESSAGES
-- ============================================================================

-- Direct messages between users
CREATE TABLE IF NOT EXISTS messages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_id INT UNSIGNED NOT NULL,
  receiver_id INT UNSIGNED NOT NULL,
  auction_id INT UNSIGNED NULL COMMENT 'Optional: related auction',
  subject VARCHAR(255) NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  read_at DATETIME NULL,
  deleted_by_sender TINYINT(1) NOT NULL DEFAULT 0,
  deleted_by_receiver TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_auction_id (auction_id),
  INDEX idx_is_read (is_read),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- REPORTS & MODERATION
-- ============================================================================

-- Reports for auctions or users
CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reporter_id INT UNSIGNED NOT NULL,
  reported_user_id INT UNSIGNED NULL,
  reported_auction_id INT UNSIGNED NULL,
  reason ENUM('spam', 'fraud', 'inappropriate', 'counterfeit', 'other') NOT NULL,
  description TEXT NULL,
  status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  resolved_by INT UNSIGNED NULL,
  resolution_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  PRIMARY KEY (id),
  INDEX idx_reporter_id (reporter_id),
  INDEX idx_reported_user_id (reported_user_id),
  INDEX idx_reported_auction_id (reported_auction_id),
  INDEX idx_status (status),
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_auction_id) REFERENCES auctions(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- AUDIT LOGS
-- ============================================================================

-- Audit logs for tracking important actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id INT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id),
  INDEX idx_entity (entity, entity_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================================
-- SETTINGS & CONFIGURATION
-- ============================================================================

-- System settings
CREATE TABLE IF NOT EXISTS settings (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NULL,
  setting_type ENUM('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  description VARCHAR(500) NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default categories
INSERT IGNORE INTO categories (name, slug, description, sort_order) VALUES
('Electronics', 'electronics', 'Electronic devices and gadgets', 1),
('Fashion', 'fashion', 'Clothing, shoes, and accessories', 2),
('Home & Garden', 'home-garden', 'Home decor and garden items', 3),
('Sports', 'sports', 'Sports equipment and memorabilia', 4),
('Art & Collectibles', 'art-collectibles', 'Art pieces and collectible items', 5),
('Vehicles', 'vehicles', 'Cars, motorcycles, and other vehicles', 6),
('Jewelry & Watches', 'jewelry-watches', 'Fine jewelry and luxury watches', 7),
('Books & Media', 'books-media', 'Books, movies, music, and games', 8),
('Antiques', 'antiques', 'Antique and vintage items', 9),
('Other', 'other', 'Miscellaneous items', 100);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('platform_name', 'Bidstation', 'string', 'Name of the platform', 1),
('platform_fee_percentage', '5', 'number', 'Platform fee percentage on sales', 0),
('min_bid_increment', '1.00', 'number', 'Default minimum bid increment', 1),
('auction_extension_seconds', '120', 'number', 'Seconds to extend auction on last-minute bid', 0),
('max_images_per_auction', '10', 'number', 'Maximum images allowed per auction', 1),
('enable_auto_bid', 'true', 'boolean', 'Enable auto-bidding feature', 1),
('enable_buy_now', 'true', 'boolean', 'Enable buy now feature', 1),
('enable_private_auctions', 'true', 'boolean', 'Enable private auctions', 1);

-- ============================================================================
-- VIEWS (Optional - for common queries)
-- ============================================================================

-- View for active auctions with seller info
CREATE OR REPLACE VIEW v_active_auctions AS
SELECT 
  a.*,
  u.full_name AS seller_name,
  u.email AS seller_email,
  c.name AS category_name,
  c.slug AS category_slug,
  (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) AS total_bids,
  (SELECT COUNT(*) FROM watchlist WHERE auction_id = a.id) AS total_watchers
FROM auctions a
LEFT JOIN users u ON a.created_by = u.id
LEFT JOIN categories c ON a.category_id = c.id
WHERE a.status = 'active' AND a.end_time > NOW();

-- View for user statistics
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.role,
  u.created_at,
  (SELECT COUNT(*) FROM auctions WHERE created_by = u.id) AS auctions_created,
  (SELECT COUNT(*) FROM auctions WHERE winner_id = u.id) AS auctions_won,
  (SELECT COUNT(*) FROM bids WHERE user_id = u.id) AS total_bids,
  (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id) AS avg_rating,
  (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = u.id) AS review_count
FROM users u;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
