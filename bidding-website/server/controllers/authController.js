const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register user
exports.register = async (req, res) => {
  try {
    console.log('📥 Registration request received');
    console.log('Request body:', { 
      username: req.body.username, 
      email: req.body.email, 
      role: req.body.role 
    });

    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ 
        message: 'Please provide username, email, and password' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: Invalid email format');
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Validation failed: Password too short');
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user exists
    console.log('🔍 Checking if user already exists...');
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length > 0) {
      console.log('❌ User already exists with this email');
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    console.log('🔒 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    // Insert user
    console.log('💾 Inserting user into database...');
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role || 'bidder']
    );

    console.log('✅ User created successfully with ID:', result.insertId);

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ 
        message: 'Server configuration error. Please contact administrator.' 
      });
    }

    // Create token
    console.log('🎫 Creating JWT token...');
    const token = jwt.sign(
      { userId: result.insertId, email, role: role || 'bidder' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token created successfully');

    const responseData = {
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: role || 'bidder'
      }
    };

    console.log('✅ Sending success response');
    res.status(201).json(responseData);

  } catch (error) {
    console.error('❌ Registration error occurred:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.sqlMessage || error.message);
    console.error('Full error:', error);
    
    // Send detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      message: 'Server error during registration',
      ...(isDevelopment && { 
        error: error.message,
        code: error.code,
        details: error.sqlMessage 
      })
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('📥 Login request received');
    console.log('Email:', req.body.email);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ 
        message: 'Please provide email and password' 
      });
    }

    // Find user
    console.log('🔍 Looking up user in database...');
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ User not found with email:', email);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    console.log('✅ User found:', user.username);

    // Check password
    console.log('🔒 Verifying password...');
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    console.log('✅ Password verified');

    // Create token
    console.log('🎫 Creating JWT token...');
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ JWT token created');

    const responseData = {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };

    console.log('✅ Sending success response');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Login error occurred:', error.message);
    console.error('Full error:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      message: 'Server error during login',
      ...(isDevelopment && { error: error.message })
    });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    console.log('📥 Get current user request');
    console.log('User ID from token:', req.user.userId);

    const [users] = await db.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      console.log('❌ User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', users[0].username);
    res.json(users[0]);

  } catch (error) {
    console.error('❌ Get user error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;