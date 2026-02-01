const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Log the request for debugging
    console.log(`🔐 Auth check for ${req.method} ${req.path}`);
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token in Authorization header');
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not defined in environment variables!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Verify token
    console.log('🔍 Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token verified successfully for user:', decoded.userId);
    
    req.user = decoded;
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    // Provide specific error messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;