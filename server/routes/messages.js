const express = require('express');
const mongoose = require('mongoose');
const { verifyJWT } = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// GET /conversations/:id/messages - Fetch messages between current user and another user
router.get('/conversations/:id/messages', verifyJWT, async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const currentUserId = req.userId;
    const { page = 1, limit = 50, status } = req.query;

    // Validate the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent users from messaging themselves
    if (currentUserId === otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot fetch conversation with yourself'
      });
    }

    // Fetch messages using the static method
    const messages = await Message.getConversation(currentUserId, otherUserId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100), // Cap at 100 messages per request
      status
    });

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ],
      deletedAt: null
    });

    // Mark messages from other user as delivered (if they were only 'sent')
    await Message.markAsDelivered(currentUserId, otherUserId);

    res.json({
      success: true,
      message: 'Messages retrieved successfully',
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / parseInt(limit)),
          totalMessages,
          hasNextPage: parseInt(page) * parseInt(limit) < totalMessages,
          hasPreviousPage: parseInt(page) > 1
        },
        conversation: {
          participants: [
            {
              id: currentUserId,
              name: req.user.name,
              isCurrentUser: true
            },
            {
              id: otherUserId,
              name: otherUser.name,
              onlineStatus: otherUser.onlineStatus,
              isCurrentUser: false
            }
          ]
        }
      }
    });

  } catch (error) {
    console.error('Error fetching conversation messages:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error retrieving messages'
    });
  }
});

// POST /conversations/:id/messages - Send a message to another user
router.post('/conversations/:id/messages', verifyJWT, async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const senderId = req.userId;
    const { content, messageType = 'text', replyTo } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Prevent users from messaging themselves
    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Create new message
    const message = new Message({
      senderId,
      receiverId,
      content: content.trim(),
      messageType,
      replyTo: replyTo || null
    });

    await message.save();

    // Populate the message with user details
    await message.populate('senderId', 'name email');
    await message.populate('receiverId', 'name email');
    if (replyTo) {
      await message.populate('replyTo', 'content senderId createdAt');
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error sending message'
    });
  }
});

// PUT /messages/:messageId/read - Mark a specific message as read
router.put('/messages/:messageId/read', verifyJWT, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only the receiver can mark a message as read
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: {
        messageId,
        status: message.status
      }
    });

  } catch (error) {
    console.error('Error marking message as read:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid message ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating message status'
    });
  }
});

// PUT /conversations/:id/read - Mark all messages in conversation as read
router.put('/conversations/:id/read', verifyJWT, async (req, res) => {
  try {
    const { id: senderId } = req.params;
    const receiverId = req.userId;

    const result = await Message.markAsRead(receiverId, senderId);

    res.json({
      success: true,
      message: 'All messages marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking conversation as read:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating conversation status'
    });
  }
});

// GET /conversations - Get all conversations for the current user
router.get('/conversations', verifyJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Aggregate to get the latest message in each conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ],
          deletedAt: null
        }
      },
      {
        $addFields: {
          otherParticipant: {
            $cond: {
              if: { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
              then: '$receiverId',
              else: '$senderId'
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$otherParticipant',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $ne: ['$status', 'read'] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participant'
        }
      },
      {
        $unwind: '$participant'
      },
      {
        $project: {
          participant: {
            _id: 1,
            name: 1,
            email: 1,
            onlineStatus: 1
          },
          lastMessage: {
            content: 1,
            createdAt: 1,
            status: 1,
            senderId: 1
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: {
        conversations,
        totalConversations: conversations.length
      }
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving conversations'
    });
  }
});

module.exports = router;
