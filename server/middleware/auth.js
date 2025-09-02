const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Middleware to verify JWT tokens and attach user information to req.user
 * Extracts token from Authorization header and validates it
 * Attaches the full user object to req.user and userId to req.user.id
 */
const verifyJWT = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please provide a valid JWT token in Authorization header'
      });
    }

    // Get token without 'Bearer ' prefix
    const token = authHeader.substring(7);
    
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Extract userId from the decoded token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token structure - userId not found'
      });
    }
    
    // Fetch user from database to ensure user still exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found - token may be for a deleted user'
      });
    }

    // Attach user information to request object
    req.user = user;
    req.userId = userId; // Also attach userId directly for convenience
    
    // Continue to next middleware/route handler
    next();

  } catch (error) {
    console.error('JWT verification error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format or signature'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet'
      });
    }

    // Handle database connection errors
    if (error.name === 'CastError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID in token'
      });
    }

    // Generic server error
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Optional middleware - verifies JWT but doesn't fail if token is missing
 * Useful for routes that work for both authenticated and non-authenticated users
 */
const optionalJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without user info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
        req.userId = userId;
      }
    }
    
    next();

  } catch (error) {
    // For optional auth, we don't return errors, just continue without user
    console.log('Optional JWT verification failed:', error.message);
    req.user = null;
    req.userId = null;
    next();
  }
};

module.exports = {
  verifyJWT,
  optionalJWT,
  // Export the main function as default for backward compatibility
  authenticateToken: verifyJWT
};
