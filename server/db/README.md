# Bidstation Database Documentation

This document provides comprehensive documentation for the Bidstation MySQL database schema, including table structures, relationships, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Database Schema](#database-schema)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [Table Descriptions](#table-descriptions)
6. [Query Functions](#query-functions)
7. [Best Practices](#best-practices)

---

## Overview

The Bidstation database is designed to support a full-featured online auction platform with the following capabilities:

- **User Management**: Registration, authentication, profiles, and roles
- **Auction Management**: Create, manage, and track auctions
- **Bidding System**: Real-time bidding with auto-bid support
- **Transactions**: Payment tracking and order management
- **Reviews & Ratings**: User feedback system
- **Notifications**: Real-time user notifications
- **Messaging**: Direct communication between users
- **Moderation**: Report and audit systems

### Technology Stack

- **Database**: MySQL 8.0+
- **Character Set**: utf8mb4 (full Unicode support)
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB (for transaction support)

---

## Setup Instructions

### Prerequisites

1. MySQL 8.0 or higher installed
2. Node.js 18+ installed
3. npm or yarn package manager

### Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bidstation
DB_CONNECTION_LIMIT=10
```

### Initialize Database

Run the initialization script to create the database and tables:

```bash
# Basic initialization
node server/db/init.js

# Force reset (drops existing database)
node server/db/init.js --force

# Initialize with sample data
node server/db/init.js --seed

# Force reset with sample data
node server/db/init.js --force --seed
```

### Verify Installation

```bash
# Connect to MySQL and check tables
mysql -u root -p bidstation -e "SHOW TABLES;"
```

---

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User accounts and profiles |
| `email_verification_tokens` | Email verification tokens |
| `password_reset_tokens` | Password reset tokens |
| `user_sessions` | Active user sessions |
| `categories` | Auction categories |
| `auctions` | Auction listings |
| `auction_images` | Images for auctions |
| `bids` | Bid history |
| `auto_bids` | Automatic bidding settings |
| `auction_participants` | Users participating in auctions |
| `watchlist` | User watchlist items |
| `transactions` | Completed auction transactions |
| `reviews` | User reviews and ratings |
| `notifications` | User notifications |
| `messages` | Direct messages |
| `reports` | User/auction reports |
| `audit_logs` | System audit trail |
| `settings` | System configuration |

---

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   categories    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ full_name       │       │ name            │
│ email           │       │ slug            │
│ password        │       │ parent_id (FK)  │
│ role            │       └────────┬────────┘
│ is_verified     │                │
└────────┬────────┘                │
         │                         │
         │    ┌────────────────────┴───────────────────┐
         │    │                                        │
         ▼    ▼                                        │
┌─────────────────┐       ┌─────────────────┐         │
│    auctions     │       │  auction_images │         │
├─────────────────┤       ├─────────────────┤         │
│ id (PK)         │◄──────│ auction_id (FK) │         │
│ title           │       │ image_url       │         │
│ created_by (FK) │───────│ is_primary      │         │
│ category_id (FK)│───────┴─────────────────┘         │
│ winner_id (FK)  │                                   │
│ status          │                                   │
└────────┬────────┘                                   │
         │                                            │
         │    ┌───────────────────────────────────────┘
         │    │
         ▼    ▼
┌─────────────────┐       ┌─────────────────┐
│      bids       │       │   auto_bids     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ auction_id (FK) │       │ auction_id (FK) │
│ user_id (FK)    │       │ user_id (FK)    │
│ amount          │       │ max_amount      │
│ is_winning      │       │ is_active       │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  transactions   │       │    reviews      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ transaction_id  │
│ auction_id (FK) │       │ reviewer_id     │
│ buyer_id (FK)   │       │ reviewed_user_id│
│ seller_id (FK)  │       │ rating          │
│ total_amount    │       │ comment         │
│ status          │       └─────────────────┘
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  notifications  │       │    messages     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ sender_id (FK)  │
│ type            │       │ receiver_id (FK)│
│ title           │       │ auction_id (FK) │
│ message         │       │ content         │
│ is_read         │       │ is_read         │
└─────────────────┘       └─────────────────┘
```

---

## Table Descriptions

### Users & Authentication

#### `users`
Stores user account information and profiles.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| full_name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | Unique email address |
| password | VARCHAR(255) | Hashed password |
| phone | VARCHAR(20) | Phone number (optional) |
| avatar_url | VARCHAR(500) | Profile picture URL |
| bio | TEXT | User biography |
| is_verified | TINYINT(1) | Email verification status |
| is_active | TINYINT(1) | Account active status |
| role | ENUM | user, seller, admin, moderator |
| email_notifications | TINYINT(1) | Email notification preference |
| created_at | DATETIME | Account creation timestamp |
| updated_at | DATETIME | Last update timestamp |
| last_login_at | DATETIME | Last login timestamp |

#### `email_verification_tokens`
Stores tokens for email verification.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | Foreign key to users |
| token | VARCHAR(255) | Unique verification token |
| expires_at | DATETIME | Token expiration time |
| used_at | DATETIME | When token was used |

#### `password_reset_tokens`
Stores tokens for password reset requests.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | Foreign key to users |
| token | VARCHAR(255) | Unique reset token |
| expires_at | DATETIME | Token expiration time |
| used_at | DATETIME | When token was used |

#### `user_sessions`
Tracks active user sessions for JWT management.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | Foreign key to users |
| token_hash | VARCHAR(255) | Hashed JWT token |
| ip_address | VARCHAR(45) | Client IP address |
| user_agent | VARCHAR(500) | Browser user agent |
| expires_at | DATETIME | Session expiration |

### Categories

#### `categories`
Hierarchical category structure for organizing auctions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| name | VARCHAR(100) | Category name |
| slug | VARCHAR(100) | URL-friendly slug |
| description | TEXT | Category description |
| parent_id | INT UNSIGNED | Parent category (self-reference) |
| icon | VARCHAR(100) | Icon identifier |
| is_active | TINYINT(1) | Active status |
| sort_order | INT | Display order |

### Auctions

#### `auctions`
Main auction listings table.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| title | VARCHAR(255) | Auction title |
| slug | VARCHAR(300) | Unique URL slug |
| description | TEXT | Full description |
| short_description | VARCHAR(500) | Brief description |
| category_id | INT UNSIGNED | Foreign key to categories |
| start_price | DECIMAL(14,2) | Starting bid price |
| reserve_price | DECIMAL(14,2) | Minimum acceptable price |
| buy_now_price | DECIMAL(14,2) | Instant purchase price |
| current_price | DECIMAL(14,2) | Current highest bid |
| bid_increment | DECIMAL(14,2) | Minimum bid increment |
| start_time | DATETIME | Auction start time |
| end_time | DATETIME | Auction end time |
| extended_time | INT UNSIGNED | Seconds added for sniping protection |
| status | ENUM | draft, pending, active, completed, cancelled, failed |
| is_featured | TINYINT(1) | Featured auction flag |
| is_private | TINYINT(1) | Private auction flag |
| invite_code | VARCHAR(50) | Code for private auctions |
| item_condition | ENUM | new, like_new, good, fair, poor |
| quantity | INT UNSIGNED | Number of items |
| shipping_cost | DECIMAL(10,2) | Shipping cost |
| shipping_info | TEXT | Shipping details |
| location | VARCHAR(255) | Item location |
| created_by | INT UNSIGNED | Seller user ID |
| winner_id | INT UNSIGNED | Winning bidder ID |
| view_count | INT UNSIGNED | Number of views |
| bid_count | INT UNSIGNED | Number of bids |
| watch_count | INT UNSIGNED | Number of watchers |

#### `auction_images`
Images associated with auctions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| image_url | VARCHAR(500) | Full image URL |
| thumbnail_url | VARCHAR(500) | Thumbnail URL |
| alt_text | VARCHAR(255) | Image alt text |
| is_primary | TINYINT(1) | Primary image flag |
| sort_order | INT | Display order |

### Bidding

#### `bids`
All bids placed on auctions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| user_id | INT UNSIGNED | Foreign key to users |
| amount | DECIMAL(14,2) | Bid amount |
| max_bid | DECIMAL(14,2) | Auto-bid maximum |
| is_auto_bid | TINYINT(1) | Auto-bid flag |
| is_winning | TINYINT(1) | Current winning bid |
| ip_address | VARCHAR(45) | Bidder IP address |
| created_at | DATETIME | Bid timestamp |

#### `auto_bids`
Automatic bidding configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| user_id | INT UNSIGNED | Foreign key to users |
| max_amount | DECIMAL(14,2) | Maximum auto-bid amount |
| is_active | TINYINT(1) | Active status |

### Participation & Watchlist

#### `auction_participants`
Users who have joined an auction.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| user_id | INT UNSIGNED | Foreign key to users |
| status | ENUM | joined, left, banned |
| joined_at | DATETIME | Join timestamp |
| left_at | DATETIME | Leave timestamp |

#### `watchlist`
User watchlist for tracking auctions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | Foreign key to users |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| notify_on_bid | TINYINT(1) | Notify on new bids |
| notify_on_end | TINYINT(1) | Notify when ending |

### Transactions & Reviews

#### `transactions`
Completed auction transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| auction_id | INT UNSIGNED | Foreign key to auctions |
| buyer_id | INT UNSIGNED | Buyer user ID |
| seller_id | INT UNSIGNED | Seller user ID |
| bid_amount | DECIMAL(14,2) | Winning bid amount |
| shipping_cost | DECIMAL(10,2) | Shipping cost |
| platform_fee | DECIMAL(10,2) | Platform fee |
| total_amount | DECIMAL(14,2) | Total transaction amount |
| status | ENUM | pending, paid, shipped, delivered, completed, disputed, refunded, cancelled |
| payment_method | VARCHAR(50) | Payment method used |
| payment_reference | VARCHAR(255) | Payment reference ID |
| shipping_address | TEXT | Delivery address |
| tracking_number | VARCHAR(100) | Shipping tracking number |

#### `reviews`
User reviews after transactions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| transaction_id | INT UNSIGNED | Foreign key to transactions |
| reviewer_id | INT UNSIGNED | Reviewer user ID |
| reviewed_user_id | INT UNSIGNED | Reviewed user ID |
| rating | TINYINT | Rating 1-5 |
| title | VARCHAR(255) | Review title |
| comment | TEXT | Review content |
| is_visible | TINYINT(1) | Visibility flag |

### Communication

#### `notifications`
User notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | Foreign key to users |
| type | ENUM | Notification type |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification content |
| data | JSON | Additional data |
| is_read | TINYINT(1) | Read status |
| read_at | DATETIME | Read timestamp |

Notification types: `bid_placed`, `bid_outbid`, `auction_won`, `auction_lost`, `auction_ending`, `auction_ended`, `payment_received`, `item_shipped`, `review_received`, `system`

#### `messages`
Direct messages between users.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| sender_id | INT UNSIGNED | Sender user ID |
| receiver_id | INT UNSIGNED | Receiver user ID |
| auction_id | INT UNSIGNED | Related auction (optional) |
| subject | VARCHAR(255) | Message subject |
| content | TEXT | Message content |
| is_read | TINYINT(1) | Read status |
| deleted_by_sender | TINYINT(1) | Sender deleted flag |
| deleted_by_receiver | TINYINT(1) | Receiver deleted flag |

### Moderation & Audit

#### `reports`
User and auction reports.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| reporter_id | INT UNSIGNED | Reporter user ID |
| reported_user_id | INT UNSIGNED | Reported user ID |
| reported_auction_id | INT UNSIGNED | Reported auction ID |
| reason | ENUM | spam, fraud, inappropriate, counterfeit, other |
| description | TEXT | Report details |
| status | ENUM | pending, reviewing, resolved, dismissed |
| resolved_by | INT UNSIGNED | Moderator user ID |
| resolution_notes | TEXT | Resolution notes |

#### `audit_logs`
System audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| user_id | INT UNSIGNED | User who performed action |
| entity | VARCHAR(100) | Entity type (user, auction, etc.) |
| entity_id | INT UNSIGNED | Entity ID |
| action | VARCHAR(100) | Action performed |
| old_values | JSON | Previous values |
| new_values | JSON | New values |
| ip_address | VARCHAR(45) | Client IP |
| user_agent | VARCHAR(500) | Browser user agent |

### Configuration

#### `settings`
System configuration settings.

| Column | Type | Description |
|--------|------|-------------|
| id | INT UNSIGNED | Primary key |
| setting_key | VARCHAR(100) | Unique setting key |
| setting_value | TEXT | Setting value |
| setting_type | ENUM | string, number, boolean, json |
| description | VARCHAR(500) | Setting description |
| is_public | TINYINT(1) | Public visibility |

---

## Query Functions

The `queries.js` file provides a comprehensive set of functions for database operations. Here are the main categories:

### User Operations

```javascript
import { createUser, getUserByEmail, getUserById, updateUser } from './queries.js';

// Create a new user
const userId = await createUser('John Doe', 'john@example.com', hashedPassword, 'user');

// Get user by email
const user = await getUserByEmail('john@example.com');

// Update user profile
await updateUser(userId, { full_name: 'John Smith', phone: '123-456-7890' });
```

### Auction Operations

```javascript
import { createAuction, getAuctionById, listActiveAuctions, updateAuction } from './queries.js';

// Create auction
const auctionId = await createAuction({
  title: 'Vintage Watch',
  slug: 'vintage-watch',
  description: 'Beautiful vintage watch',
  start_price: 100.00,
  start_time: new Date(),
  end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  created_by: userId
});

// List active auctions with pagination
const { auctions, pagination } = await listActiveAuctions(1, 20, {
  category_id: 1,
  search: 'watch',
  sort: 'ending_soon'
});
```

### Bidding Operations

```javascript
import { placeBid, getAuctionBids, getHighestBid, setAutoBid } from './queries.js';

// Place a bid
const bidId = await placeBid(auctionId, userId, 150.00);

// Get auction bids
const bids = await getAuctionBids(auctionId);

// Set up auto-bidding
await setAutoBid(auctionId, userId, 500.00);
```

### Watchlist Operations

```javascript
import { addToWatchlist, removeFromWatchlist, getUserWatchlist } from './queries.js';

// Add to watchlist
await addToWatchlist(userId, auctionId);

// Get user's watchlist
const watchlist = await getUserWatchlist(userId);
```

### Transaction Operations

```javascript
import { createTransaction, updateTransactionStatus, getUserTransactions } from './queries.js';

// Create transaction after auction ends
const transactionId = await createTransaction({
  auction_id: auctionId,
  buyer_id: winnerId,
  seller_id: sellerId,
  bid_amount: 500.00,
  shipping_cost: 15.00,
  platform_fee: 25.00
});

// Update transaction status
await updateTransactionStatus(transactionId, 'shipped', {
  tracking_number: 'TRACK123456'
});
```

### Notification Operations

```javascript
import { createNotification, getUserNotifications, markNotificationRead } from './queries.js';

// Create notification
await createNotification(
  userId,
  'auction_won',
  'You won the auction!',
  'Congratulations! You won the Vintage Watch auction.',
  { auction_id: auctionId }
);

// Get unread notifications
const notifications = await getUserNotifications(userId, true);
```

---

## Best Practices

### Security

1. **Never store plain text passwords** - Always use bcrypt or similar hashing
2. **Use parameterized queries** - All query functions use prepared statements
3. **Validate input** - Validate all user input before database operations
4. **Limit query results** - Always use pagination for list queries

### Performance

1. **Use indexes** - The schema includes indexes on frequently queried columns
2. **Connection pooling** - The pool is configured with appropriate limits
3. **Avoid N+1 queries** - Use JOINs when fetching related data
4. **Cache frequently accessed data** - Consider Redis for session data

### Transactions

```javascript
import { transaction } from './index.js';

// Use transactions for multi-step operations
await transaction(async (conn) => {
  await conn.execute('INSERT INTO bids ...', [...]);
  await conn.execute('UPDATE auctions ...', [...]);
  // If any query fails, all changes are rolled back
});
```

### Error Handling

```javascript
try {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    // Handle duplicate entry
  }
  // Log and handle other errors
}
```

---

## Maintenance

### Backup

```bash
# Full backup
mysqldump -u root -p bidstation > backup.sql

# Backup specific tables
mysqldump -u root -p bidstation users auctions bids > partial_backup.sql
```

### Restore

```bash
mysql -u root -p bidstation < backup.sql
```

### Clean Up Old Data

```sql
-- Delete old audit logs (older than 90 days)
DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Delete expired tokens
DELETE FROM email_verification_tokens WHERE expires_at < NOW();
DELETE FROM password_reset_tokens WHERE expires_at < NOW();

-- Delete old sessions
DELETE FROM user_sessions WHERE expires_at < NOW();
```

---

## Support

For issues or questions about the database schema, please refer to:

- Project documentation
- MySQL 8.0 documentation
- Node.js mysql2 documentation

---

*Last updated: January 2026*
