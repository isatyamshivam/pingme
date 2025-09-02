const express = require('express');
const { verifyJWT, optionalJWT } = require('../middleware/auth');

const router = express.Router();

// Example 1: Protected route using verifyJWT middleware
router.get('/protected', verifyJWT, (req, res) => {
  // After verifyJWT middleware runs successfully:
  // - req.user contains the full user object from database
  // - req.userId contains the user's ID (string)
  
  res.json({
    message: 'This is a protected route',
    user: {
      id: req.userId,           // User ID extracted from JWT
      name: req.user.name,      // Full user object from database
      email: req.user.email,
      onlineStatus: req.user.onlineStatus
    }
  });
});

// Example 2: Multiple middleware functions
router.post('/admin-only', verifyJWT, (req, res, next) => {
  // Additional authorization check after JWT verification
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
}, (req, res) => {
  res.json({
    message: 'Admin-only content',
    adminUser: req.user.name
  });
});

// Example 3: Using req.userId for database operations
router.get('/my-data', verifyJWT, async (req, res) => {
  try {
    // Use req.userId for database queries
    const userPosts = await Post.find({ authorId: req.userId });
    const userComments = await Comment.find({ authorId: req.userId });
    
    res.json({
      success: true,
      data: {
        posts: userPosts,
        comments: userComments,
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// Example 4: Optional authentication
router.get('/public-with-user-context', optionalJWT, (req, res) => {
  // This route works for both authenticated and non-authenticated users
  const response = {
    message: 'Public content with optional user context',
    isAuthenticated: !!req.user,
    user: req.user ? {
      id: req.userId,
      name: req.user.name
    } : null
  };
  
  res.json(response);
});

// Example 5: Conditional logic based on authentication
router.get('/content', optionalJWT, (req, res) => {
  let content;
  
  if (req.user) {
    // Authenticated user gets personalized content
    content = {
      type: 'personalized',
      welcomeMessage: `Welcome back, ${req.user.name}!`,
      userId: req.userId,
      personalizedData: 'Premium content here...'
    };
  } else {
    // Non-authenticated user gets generic content
    content = {
      type: 'generic',
      welcomeMessage: 'Welcome, guest!',
      genericData: 'Public content here...'
    };
  }
  
  res.json({
    success: true,
    data: content
  });
});

// Example 6: Error handling with meaningful messages
router.get('/user-specific-action', verifyJWT, async (req, res) => {
  try {
    // The middleware has already verified the token and attached user info
    console.log(`User ${req.userId} (${req.user.name}) is performing an action`);
    
    // Perform some user-specific operation
    const result = await performUserAction(req.userId);
    
    res.json({
      success: true,
      message: 'Action completed successfully',
      data: result,
      performedBy: {
        userId: req.userId,
        userName: req.user.name
      }
    });
  } catch (error) {
    console.error(`Error for user ${req.userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform action'
    });
  }
});

// Dummy function for example
async function performUserAction(userId) {
  return { action: 'completed', userId };
}

module.exports = router;
