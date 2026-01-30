-- Create Database
CREATE DATABASE IF NOT EXISTS bidding_platform;
USE bidding_platform;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'auctioneer', 'bidder') DEFAULT 'bidder',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Auctions Table
CREATE TABLE IF NOT EXISTS auctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  auction_type ENUM('ipl_player', 'item') NOT NULL,
  start_time DATETIME,
  end_time DATETIME,
  creator_id INT,
  teams JSON,
  status ENUM('pending', 'live', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Auction Items Table (Players or Items)
CREATE TABLE IF NOT EXISTS auction_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price DECIMAL(15, 2) NOT NULL,
  current_price DECIMAL(15, 2) NOT NULL,
  current_bidder_id INT,
  category VARCHAR(100),
  image_url VARCHAR(500),
  player_details JSON,
  status ENUM('available', 'sold', 'unsold') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (current_bidder_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Bids Table
CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  bidder_id INT NOT NULL,
  bid_amount DECIMAL(15, 2) NOT NULL,
  team_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES auction_items(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_auction_status ON auctions(status);
CREATE INDEX idx_auction_type ON auctions(auction_type);
CREATE INDEX idx_item_auction ON auction_items(auction_id);
CREATE INDEX idx_item_status ON auction_items(status);
CREATE INDEX idx_bid_item ON bids(item_id);
CREATE INDEX idx_bid_bidder ON bids(bidder_id);
