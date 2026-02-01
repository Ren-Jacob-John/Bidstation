const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/emailService');

// Register user
exports.register = async (req, res) => {
  try {
    console.log('📥 Registration request received');

    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: 'Please provide username, email, and password' 
      });
    }

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (username, email, password, role, email_verified, verification_token, verification_token_expires) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role || 'bidder', false, verificationToken, verificationExpires]
    );

    console.log('✅ User created with ID:', result.insertId);

    // Send verification email (don't wait for it)
    emailService.sendVerificationEmail(email, username, verificationToken)
      .then(() => console.log('✅ Verification email sent'))
      .catch(err => console.log('⚠️ Email send failed:', err.message));

    // Create token
    const token = jwt.sign(
      { userId: result.insertId, email, role: role || 'bidder' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: {
        id: result.insertId,
        username,
        email,
        role: role || 'bidder',
        emailVerified: false
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find user with valid token
    const [users] = await db.query(
      'SELECT * FROM users WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const user = users[0];

    // Update user as verified
    await db.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [user.id]
    );

    console.log('✅ Email verified for:', user.username);

    res.json({ 
      message: 'Email verified successfully!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      'UPDATE users SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
      [verificationToken, verificationExpires, userId]
    );

    // Send email
    const emailResult = await emailService.sendVerificationEmail(user.email, user.username, verificationToken);

    if (emailResult.success) {
      res.json({ message: 'Verification email sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send verification email' });
    }

  } catch (error) {
    console.error('❌ Resend verification error:', error);
    res.status(500).json({ message: 'Error resending verification email' });
  }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    // Always return success to prevent email enumeration
    if (users.length === 0) {
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [resetToken, resetExpires, user.id]
    );

    // Send reset email
    emailService.sendPasswordResetEmail(user.email, user.username, resetToken)
      .then(() => console.log('✅ Password reset email sent'))
      .catch(err => console.log('⚠️ Email send failed:', err.message));

    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Find user with valid reset token
    const [users] = await db.query(
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    console.log('✅ Password reset for:', user.username);

    // Send confirmation email
    emailService.sendPasswordChangedEmail(user.email, user.username)
      .catch(err => console.log('⚠️ Email send failed:', err.message));

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.email_verified
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, email, role, email_verified, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);

  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;