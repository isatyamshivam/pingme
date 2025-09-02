const express = require('express');
const { verifyJWT, optionalJWT } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /users - Fetch all users except passwords
router.get('/users', async (req, res) => {
  try {
    // Fetch all users and exclude passwordHash field
    // Using select() to explicitly exclude sensitive fields
    const users = await User.find({})
      .select('-passwordHash -__v') // Exclude password hash and version key
      .sort({ name: 1 }); // Sort by name alphabetically

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        count: users.length
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving users'
    });
  }
});

// GET /users/online - Fetch only online users (requires authentication)
router.get('/users/online', verifyJWT, async (req, res) => {
  try {
    const onlineUsers = await User.find(
      { onlineStatus: true, _id: { $ne: req.userId } }, // Exclude current user
      '-passwordHash -__v' // Exclude sensitive fields
    ).sort({ name: 1 });

    res.json({
      success: true,
      message: 'Online users retrieved successfully',
      data: {
        users: onlineUsers,
        count: onlineUsers.length
      }
    });
  } catch (error) {
    console.error('Online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving online users'
    });
  }
});

// GET /users/:id - Get specific user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-passwordHash -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Error fetching user by ID:', error);
    
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error retrieving user'
    });
  }
});

// GET /profile - Get current user's profile (requires authentication)
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user.toJSON()
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving profile'
    });
  }
});

// PUT /profile - Update current user's profile (requires authentication)
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and cannot be empty'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

module.exports = router;
