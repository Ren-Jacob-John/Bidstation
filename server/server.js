require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Database connection
let db;
async function connectDB() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./bidstation.db', (err) => {
      if (err) {
        console.error('Database connection failed:', err);
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        // Initialize schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        db.exec(schema, (schemaErr) => {
          if (schemaErr) {
            console.error('Schema initialization failed:', schemaErr);
            reject(schemaErr);
          } else {
            console.log('Database schema initialized');
            resolve();
          }
        });
      }
    });
  });
}

// Database helpers
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ insertId: this.lastID, changes: this.changes });
    });
  });
}

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await run(
      'INSERT INTO users (full_name, email, password, email_verified) VALUES (?, ?, ?, 0)',
      [fullName, email, hashedPassword]
    );

    // Generate verification token
    const verificationToken = jwt.sign({ userId: result.insertId }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Verify your email - Bidstation',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
    });

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.email_verified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await run('UPDATE users SET email_verified = 1 WHERE id = ?', [decoded.userId]);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const users = await query('SELECT id, full_name, email FROM users WHERE id = ?', [req.user.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Auction routes
app.post('/auctions', authenticateToken, async (req, res) => {
  try {
    const {
      title, description, shortDescription, categoryId, startPrice,
      reservePrice, buyNowPrice, bidIncrement, startTime, endTime,
      itemCondition, quantity, shippingCost, shippingInfo, location,
      isPrivate, inviteCode
    } = req.body;

    const result = await run(
      `INSERT INTO auctions (
        title, description, short_description, category_id, start_price,
        reserve_price, buy_now_price, bid_increment, start_time, end_time,
        item_condition, quantity, shipping_cost, shipping_info, location,
        is_private, invite_code, seller_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        title, description, shortDescription, categoryId, startPrice,
        reservePrice, buyNowPrice, bidIncrement, startTime, endTime,
        itemCondition, quantity, shippingCost, shippingInfo, location,
        isPrivate ? 1 : 0, inviteCode, req.user.userId
      ]
    );

    // Generate slug
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${result.insertId}`;

    await run('UPDATE auctions SET slug = ? WHERE id = ?', [slug, result.insertId]);

    res.status(201).json({ message: 'Auction created', slug });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/auctions', async (req, res) => {
  try {
    const auctions = await query(
      `SELECT a.*, u.full_name as seller_name FROM auctions a
       JOIN users u ON a.seller_id = u.id
       WHERE a.status = 'active' ORDER BY a.created_at DESC`
    );
    res.json({ auctions });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/auctions/:slug', async (req, res) => {
  try {
    const auctions = await query(
      `SELECT a.*, u.full_name as seller_name FROM auctions a
       JOIN users u ON a.seller_id = u.id
       WHERE a.slug = ?`,
      [req.params.slug]
    );
    if (auctions.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    res.json({ auction: auctions[0] });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO for real-time bidding
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinAuction', (auctionId) => {
    socket.join(auctionId);
    console.log(`User ${socket.id} joined auction ${auctionId}`);
  });

  socket.on('placeBid', async (data, callback) => {
    try {
      const { auctionId, amount, bidder } = data;

      // Get auction
      const auctions = await query('SELECT * FROM auctions WHERE id = ? AND status = "active"', [auctionId]);
      if (auctions.length === 0) {
        return callback({ success: false, message: 'Auction not found' });
      }

      const auction = auctions[0];
      if (amount <= auction.current_bid) {
        return callback({ success: false, message: 'Bid too low' });
      }

      // Update bid
      await run('UPDATE auctions SET current_bid = ?, highest_bidder = ? WHERE id = ?', [amount, bidder, auctionId]);

      // Emit to all in room
      io.to(auctionId).emit('bidUpdate', { auctionId, currentBid: amount, highestBidder: bidder });

      callback({ success: true });
    } catch (error) {
      console.error(error);
      callback({ success: false, message: 'Server error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Catch all handler for production (serve React app)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();