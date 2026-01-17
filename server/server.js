import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { createServer } from 'http';
import { Server as IOServer } from 'socket.io';

const app = express();
const port = 3000;

// In-memory user store (replace with database in production)
const users = [];

// JWT secret (use env variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware

app.use(express.json())
app.use(cors())

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes
app.get('/', (req, res)=> res.send('Server is Live'))

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: users.length + 1,
      fullName,
      email,
      password: hashedPassword,
      isVerified: false,
      createdAt: new Date()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, isVerified: user.isVerified }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(user => user.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, fullName: user.fullName, email: user.email, isVerified: user.isVerified }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    isVerified: user.isVerified
  });
});

app.post('/auth/logout', authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Placeholder routes for other auth functions
app.get('/auth/verify-email', (req, res) => {
  res.json({ message: 'Email verification not implemented yet' });
});

app.post('/auth/resend-verification', (req, res) => {
  res.json({ message: 'Resend verification not implemented yet' });
});

app.post('/auth/forgot-password', (req, res) => {
  res.json({ message: 'Forgot password not implemented yet' });
});

app.post('/auth/reset-password', (req, res) => {
  res.json({ message: 'Reset password not implemented yet' });
});

app.put('/auth/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Update profile not implemented yet' });
});

app.post('/auth/change-password', authenticateToken, (req, res) => {
  res.json({ message: 'Change password not implemented yet' });
});

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);

const io = new IOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Simple in-memory auction state for a single demo auction
const auction = {
  id: 'auction1',
  name: 'Sample Auction',
  description: 'This is a sample auction for demonstration.',
  startingPrice: 50,
  currentBid: 120,
  highestBidder: null,
  // set demo end time 5 minutes from server start
  endTime: Date.now() + 5 * 60 * 1000
};

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

  // Send current auction state when a client joins
  socket.on('joinAuction', (auctionId) => {
    if (auctionId !== auction.id) return;
    socket.emit('auctionState', {
      id: auction.id,
      name: auction.name,
      description: auction.description,
      startingPrice: auction.startingPrice,
      currentBid: auction.currentBid,
      highestBidder: auction.highestBidder,
      timeRemaining: Math.max(0, Math.floor((auction.endTime - Date.now()) / 1000))
    });
  });

  // Handle bid placement
  socket.on('placeBid', (data, ack) => {
    // data: { auctionId, amount, bidder }
    const { auctionId, amount, bidder } = data || {};
    if (auctionId !== auction.id) {
      return ack && ack({ success: false, message: 'Auction not found' });
    }

    const numericAmount = Number(amount) || 0;
    if (numericAmount <= auction.currentBid) {
      return ack && ack({ success: false, message: 'Bid must be higher than current bid' });
    }

    // Update auction
    auction.currentBid = numericAmount;
    auction.highestBidder = bidder || 'Anonymous';

    // Broadcast new bid to all clients
    io.emit('bidUpdate', {
      auctionId: auction.id,
      currentBid: auction.currentBid,
      highestBidder: auction.highestBidder
    });

    return ack && ack({ success: true });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

// Timer to broadcast time remaining every second
const timerInterval = setInterval(() => {
  const remaining = Math.max(0, Math.floor((auction.endTime - Date.now()) / 1000));
  io.emit('timeUpdate', { auctionId: auction.id, timeRemaining: remaining });
  if (remaining <= 0) {
    io.emit('auctionEnded', { auctionId: auction.id });
    clearInterval(timerInterval);
  }
}, 1000);

httpServer.listen(port, ()=> console.log(`Server Listening at http://localhost:${port}`));