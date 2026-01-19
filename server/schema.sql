-- Bidstation SQLite Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id INTEGER,
  start_price REAL NOT NULL,
  reserve_price REAL,
  buy_now_price REAL,
  current_bid REAL DEFAULT 0,
  bid_increment REAL DEFAULT 1.00,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  item_condition TEXT DEFAULT 'new',
  quantity INTEGER DEFAULT 1,
  shipping_cost REAL,
  shipping_info TEXT,
  location TEXT,
  is_private INTEGER DEFAULT 0,
  invite_code TEXT,
  seller_id INTEGER NOT NULL,
  highest_bidder TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auction_id INTEGER NOT NULL,
  bidder_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  bidder_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (bidder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert some sample categories
INSERT OR IGNORE INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and gadgets'),
('Vehicles', 'Cars, motorcycles, and other vehicles'),
('Real Estate', 'Properties and land'),
('Collectibles', 'Antiques and collectible items'),
('Fashion', 'Clothing and accessories'),
('Sports', 'Sports equipment and memorabilia'),
('Books', 'Books and publications'),
('Other', 'Miscellaneous items');