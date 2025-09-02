const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes and models
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public directory

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/realtime_chat_app';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Routes
app.use('/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', messageRoutes);

// Enhanced Socket.IO connection with comprehensive messaging and user tracking
io.on('connection', async (socket) => {
	console.log('A user connected:', socket.id);
	
	// Handle user authentication via socket
	socket.on('authenticate', async (token) => {
		try {
			const jwt = require('jsonwebtoken');
			const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
			
			const decoded = jwt.verify(token, JWT_SECRET);
			const user = await User.findById(decoded.userId);
			
			if (user) {
				socket.userId = user._id.toString();
				socket.userName = user.name;
				socket.userEmail = user.email;
				
				// Update user's online status and socket ID
				await user.setOnlineStatus(true, socket.id);
				
				// Join user to their personal room for direct messaging
				socket.join(`user_${socket.userId}`);
				
				socket.emit('authenticated', { 
					user: user.toJSON(),
					socketId: socket.id
				});
				
				// Broadcast to all users that this user is now online
				socket.broadcast.emit('user:online', { 
					userId: user._id, 
					name: user.name,
					onlineStatus: true
				});
				
				console.log(`User ${user.name} (${user._id}) authenticated and online`);
			} else {
				socket.emit('authentication_error', { message: 'User not found' });
			}
		} catch (error) {
			console.error('Socket authentication error:', error);
			socket.emit('authentication_error', { message: 'Invalid token' });
		}
	});
	
	// Handle sending messages
	socket.on('message:send', async (data) => {
		if (!socket.userId) {
			socket.emit('error', { message: 'Not authenticated' });
			return;
		}

		try {
			const { receiverId, content, messageType = 'text', replyTo } = data;
			
			// Validation
			if (!receiverId || !content || content.trim().length === 0) {
				socket.emit('message:error', { 
					message: 'Receiver ID and content are required',
					originalData: data
				});
				return;
			}

			// Prevent self-messaging
			if (socket.userId === receiverId) {
				socket.emit('message:error', { 
					message: 'Cannot send message to yourself',
					originalData: data
				});
				return;
			}

			// Verify receiver exists
			const receiver = await User.findById(receiverId);
			if (!receiver) {
				socket.emit('message:error', { 
					message: 'Receiver not found',
					originalData: data
				});
				return;
			}
			
			// Create and save message to database
			const message = new Message({
				senderId: socket.userId,
				receiverId,
				content: content.trim(),
				messageType,
				replyTo: replyTo || null,
				status: 'sent'
			});
			
			await message.save();
			
			// Populate message with user details
			await message.populate('senderId', 'name email onlineStatus');
			await message.populate('receiverId', 'name email onlineStatus');
			if (replyTo) {
				await message.populate('replyTo', 'content senderId createdAt');
			}

			const messageData = {
				...message.toJSON(),
				timestamp: message.createdAt
			};
			
			// Check if receiver is online and update status accordingly
			if (receiver.onlineStatus && receiver.socketId) {
				// Mark as delivered since receiver is online
				message.status = 'delivered';
				await message.save();
				messageData.status = 'delivered';
				
				// Send to receiver via their personal room
				io.to(`user_${receiverId}`).emit('message:new', messageData);
				
				console.log(`Message delivered to online user: ${receiver.name}`);
			} else {
				console.log(`Message saved for offline user: ${receiver.name}`);
			}
			
			// Confirm to sender
			socket.emit('message:sent', messageData);
			
		} catch (error) {
			console.error('Error handling message:send:', error);
			socket.emit('message:error', {
				message: 'Failed to send message',
				error: error.message,
				originalData: data
			});
		}
	});
	
	// Handle message read status updates
	socket.on('message:read', async (data) => {
		if (!socket.userId) {
			socket.emit('error', { message: 'Not authenticated' });
			return;
		}

		try {
			const { messageId, senderId } = data;
			
			if (!messageId) {
				socket.emit('message:error', { message: 'Message ID is required' });
				return;
			}

			// Option 1: Mark specific message as read
			if (messageId) {
				const message = await Message.findById(messageId);
				
				if (!message) {
					socket.emit('message:error', { message: 'Message not found' });
					return;
				}
				
				// Only receiver can mark message as read
				if (message.receiverId.toString() !== socket.userId) {
					socket.emit('message:error', { message: 'Unauthorized to mark this message as read' });
					return;
				}
				
				if (message.status !== 'read') {
					message.status = 'read';
					await message.save();
				}

				const readData = {
					messageId,
					readBy: socket.userId,
					readByName: socket.userName,
					readAt: new Date(),
					conversationId: `${message.senderId}-${message.receiverId}`
				};

				// Notify sender that message was read
				io.to(`user_${message.senderId}`).emit('message:read_receipt', readData);
				
				// Confirm to reader
				socket.emit('message:read_success', readData);
			}
			
			// Option 2: Mark all messages from sender as read
			if (senderId && !messageId) {
				const result = await Message.updateMany(
					{
						senderId: senderId,
						receiverId: socket.userId,
						status: { $in: ['sent', 'delivered'] }
					},
					{
						status: 'read'
					}
				);

				const readData = {
					senderId,
					readBy: socket.userId,
					readByName: socket.userName,
					readAt: new Date(),
					messagesCount: result.modifiedCount
				};

				// Notify sender
				io.to(`user_${senderId}`).emit('conversation:read', readData);
				
				// Confirm to reader
				socket.emit('conversation:read_success', readData);
			}
			
		} catch (error) {
			console.error('Error handling message:read:', error);
			socket.emit('message:error', {
				message: 'Failed to mark message as read',
				error: error.message
			});
		}
	});
	
	// Handle typing start
	socket.on('typing:start', async (data) => {
		if (!socket.userId) {
			socket.emit('error', { message: 'Not authenticated' });
			return;
		}

		try {
			const { receiverId } = data;
			
			if (!receiverId) {
				socket.emit('typing:error', { message: 'Receiver ID is required' });
				return;
			}

			const typingData = {
				userId: socket.userId,
				userName: socket.userName,
				receiverId,
				isTyping: true,
				timestamp: new Date()
			};

			// Send typing indicator to specific receiver
			io.to(`user_${receiverId}`).emit('typing:start', typingData);
			
			console.log(`${socket.userName} started typing to user ${receiverId}`);
			
		} catch (error) {
			console.error('Error handling typing:start:', error);
			socket.emit('typing:error', { message: 'Failed to send typing indicator' });
		}
	});
	
	// Handle typing stop
	socket.on('typing:stop', async (data) => {
		if (!socket.userId) {
			socket.emit('error', { message: 'Not authenticated' });
			return;
		}

		try {
			const { receiverId } = data;
			
			if (!receiverId) {
				socket.emit('typing:error', { message: 'Receiver ID is required' });
				return;
			}

			const typingData = {
				userId: socket.userId,
				userName: socket.userName,
				receiverId,
				isTyping: false,
				timestamp: new Date()
			};

			// Send stop typing indicator to specific receiver
			io.to(`user_${receiverId}`).emit('typing:stop', typingData);
			
			console.log(`${socket.userName} stopped typing to user ${receiverId}`);
			
		} catch (error) {
			console.error('Error handling typing:stop:', error);
			socket.emit('typing:error', { message: 'Failed to send typing indicator' });
		}
	});

	// Handle manual online status update
	socket.on('status:online', async () => {
		if (socket.userId) {
			try {
				const user = await User.findById(socket.userId);
				if (user) {
					await user.setOnlineStatus(true, socket.id);
					socket.broadcast.emit('user:online', {
						userId: socket.userId,
						name: socket.userName,
						onlineStatus: true
					});
				}
			} catch (error) {
				console.error('Error updating online status:', error);
			}
		}
	});

	// Handle manual offline status update
	socket.on('status:offline', async () => {
		if (socket.userId) {
			try {
				const user = await User.findById(socket.userId);
				if (user) {
					await user.setOnlineStatus(false);
					socket.broadcast.emit('user:offline', {
						userId: socket.userId,
						name: socket.userName,
						onlineStatus: false,
						lastSeen: new Date()
					});
				}
			} catch (error) {
				console.error('Error updating offline status:', error);
			}
		}
	});

	// Get online users list
	socket.on('users:get_online', async () => {
		try {
			const onlineUsers = await User.find(
				{ onlineStatus: true },
				'name email onlineStatus lastSeen socketId'
			).sort({ name: 1 });

			socket.emit('users:online_list', {
				users: onlineUsers.map(user => ({
					id: user._id,
					name: user.name,
					email: user.email,
					onlineStatus: user.onlineStatus,
					isCurrentUser: user._id.toString() === socket.userId
				})),
				count: onlineUsers.length,
				timestamp: new Date()
			});
		} catch (error) {
			console.error('Error fetching online users:', error);
			socket.emit('error', { message: 'Failed to fetch online users' });
		}
	});
	
	// Handle user disconnect
	socket.on('disconnect', async (reason) => {
		console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
		
		if (socket.userId) {
			try {
				const user = await User.findById(socket.userId);
				if (user) {
					// Set user offline
					await user.setOnlineStatus(false);
					
					// Notify other users
					socket.broadcast.emit('user:offline', { 
						userId: socket.userId, 
						name: socket.userName,
						onlineStatus: false,
						lastSeen: new Date(),
						reason: 'disconnected'
					});
					
					console.log(`User ${socket.userName} (${socket.userId}) went offline`);
				}
			} catch (error) {
				console.error('Error updating user status on disconnect:', error);
			}
		}
	});

	// Handle connection errors
	socket.on('error', (error) => {
		console.error('Socket error:', error);
	});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
