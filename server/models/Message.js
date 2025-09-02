const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required'],
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message content cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['sent', 'delivered', 'read'],
      message: 'Status must be one of: sent, delivered, read'
    },
    default: 'sent',
    index: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  editedAt: {
    type: Date,
    default: null
  },
  deletedAt: {
    type: Date,
    default: null
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Compound indexes for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for conversation participants (sorted for consistent conversation ID)
messageSchema.virtual('conversationId').get(function() {
  const participants = [this.senderId.toString(), this.receiverId.toString()].sort();
  return participants.join('-');
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
  const { page = 1, limit = 50, status } = options;
  const skip = (page - 1) * limit;
  
  let query = {
    $or: [
      { senderId: userId1, receiverId: userId2 },
      { senderId: userId2, receiverId: userId1 }
    ],
    deletedAt: null // Exclude deleted messages
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('senderId', 'name email onlineStatus')
    .populate('receiverId', 'name email onlineStatus')
    .populate('replyTo', 'content senderId createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark messages as delivered
messageSchema.statics.markAsDelivered = function(receiverId, senderId) {
  return this.updateMany(
    {
      senderId: senderId,
      receiverId: receiverId,
      status: 'sent'
    },
    {
      status: 'delivered'
    }
  );
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(receiverId, senderId) {
  return this.updateMany(
    {
      senderId: senderId,
      receiverId: receiverId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      status: 'read'
    }
  );
};

// Instance method to mark single message as read
messageSchema.methods.markAsRead = function() {
  if (this.status !== 'read') {
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to soft delete message
messageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  return this.save();
};

// Pre-save middleware to validate sender and receiver are different
messageSchema.pre('save', function(next) {
  if (this.senderId.equals(this.receiverId)) {
    const error = new Error('Sender and receiver cannot be the same user');
    return next(error);
  }
  next();
});

// Transform output to include virtual fields
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);
