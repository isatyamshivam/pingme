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

module.exports = router;
