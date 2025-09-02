# Socket.IO Events Documentation

## Overview

This real-time chat application implements comprehensive Socket.IO events for messaging, user status tracking, and typing indicators with full database integration.

## Connection & Authentication

### Client to Server

#### `authenticate`
Authenticate user with JWT token and establish session.

**Payload:**
```javascript
socket.emit('authenticate', 'jwt-token-here');
```

**Response Events:**
- `authenticated` - Success with user data
- `authentication_error` - Authentication failed

### Server to Client

#### `authenticated`
Sent when user successfully authenticates.

**Payload:**
```javascript
{
  user: {
    _id: "user_id",
    name: "User Name",
    email: "user@example.com",
    onlineStatus: true
  },
  socketId: "socket_id"
}
```

#### `authentication_error`
Sent when authentication fails.

**Payload:**
```javascript
{
  message: "Error description"
}
```

## Messaging Events

### Client to Server

#### `message:send`
Send a new message to another user.

**Payload:**
```javascript
socket.emit('message:send', {
  receiverId: 'user_id',
  content: 'Hello there!',
  messageType: 'text', // 'text', 'image', 'file', 'system'
  replyTo: 'message_id' // optional
});
```

**Features:**
- Saves message to database
- Validates receiver exists
- Prevents self-messaging
- Updates delivery status for online users
- Supports message types and replies

#### `message:read`
Mark message(s) as read.

**Option 1 - Mark specific message:**
```javascript
socket.emit('message:read', {
  messageId: 'message_id'
});
```

**Option 2 - Mark all messages from sender:**
```javascript
socket.emit('message:read', {
  senderId: 'sender_user_id'
});
```

### Server to Client

#### `message:new`
Receive a new message.

**Payload:**
```javascript
{
  _id: "message_id",
  senderId: {
    _id: "sender_id",
    name: "Sender Name",
    email: "sender@example.com"
  },
  receiverId: {
    _id: "receiver_id",
    name: "Receiver Name"
  },
  content: "Message content",
  status: "delivered",
  messageType: "text",
  createdAt: "2025-09-02T...",
  replyTo: null // or message object if reply
}
```

#### `message:sent`
Confirmation that message was sent successfully.

**Payload:** Same as `message:new`

#### `message:error`
Error occurred during message handling.

**Payload:**
```javascript
{
  message: "Error description",
  error: "Detailed error",
  originalData: {} // original request data
}
```

#### `message:read_receipt`
Notification that a message was read.

**Payload:**
```javascript
{
  messageId: "message_id",
  readBy: "reader_user_id",
  readByName: "Reader Name",
  readAt: "2025-09-02T...",
  conversationId: "sender_id-receiver_id"
}
```

#### `conversation:read`
Notification that multiple messages were marked as read.

**Payload:**
```javascript
{
  senderId: "sender_id",
  readBy: "reader_user_id",
  readByName: "Reader Name",
  readAt: "2025-09-02T...",
  messagesCount: 5
}
```

## Typing Indicators

### Client to Server

#### `typing:start`
Indicate user started typing.

**Payload:**
```javascript
socket.emit('typing:start', {
  receiverId: 'user_id'
});
```

#### `typing:stop`
Indicate user stopped typing.

**Payload:**
```javascript
socket.emit('typing:stop', {
  receiverId: 'user_id'
});
```

### Server to Client

#### `typing:start`
Someone started typing to you.

**Payload:**
```javascript
{
  userId: "typer_user_id",
  userName: "Typer Name",
  receiverId: "your_user_id",
  isTyping: true,
  timestamp: "2025-09-02T..."
}
```

#### `typing:stop`
Someone stopped typing to you.

**Payload:**
```javascript
{
  userId: "typer_user_id",
  userName: "Typer Name",
  receiverId: "your_user_id",
  isTyping: false,
  timestamp: "2025-09-02T..."
}
```

## User Status Events

### Client to Server

#### `status:online`
Manually set status to online.

**Payload:**
```javascript
socket.emit('status:online');
```

#### `status:offline`
Manually set status to offline.

**Payload:**
```javascript
socket.emit('status:offline');
```

#### `users:get_online`
Request list of online users.

**Payload:**
```javascript
socket.emit('users:get_online');
```

### Server to Client

#### `user:online`
User came online.

**Payload:**
```javascript
{
  userId: "user_id",
  name: "User Name",
  onlineStatus: true
}
```

#### `user:offline`
User went offline.

**Payload:**
```javascript
{
  userId: "user_id",
  name: "User Name",
  onlineStatus: false,
  lastSeen: "2025-09-02T...",
  reason: "disconnected"
}
```

#### `users:online_list`
List of currently online users.

**Payload:**
```javascript
{
  users: [
    {
      id: "user_id",
      name: "User Name",
      email: "user@example.com",
      onlineStatus: true,
      isCurrentUser: false
    }
  ],
  count: 5,
  timestamp: "2025-09-02T..."
}
```

## Error Handling

### `error`
General error event.

**Payload:**
```javascript
{
  message: "Error description"
}
```

### `typing:error`
Typing-related error.

**Payload:**
```javascript
{
  message: "Error description"
}
```

## Complete Client Implementation Example

```javascript
// Initialize connection
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', 'your-jwt-token');

// Listen for authentication
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user.name);
  currentUser = data.user;
  
  // Get online users
  socket.emit('users:get_online');
});

// Handle incoming messages
socket.on('message:new', (message) => {
  displayMessage(message);
  
  // Auto-mark as read if chat is open
  if (isCurrentChatWith(message.senderId._id)) {
    socket.emit('message:read', { messageId: message._id });
  }
});

// Send a message
function sendMessage(receiverId, content) {
  socket.emit('message:send', {
    receiverId,
    content,
    messageType: 'text'
  });
}

// Handle typing
let typingTimeout;
function handleTyping(receiverId) {
  socket.emit('typing:start', { receiverId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing:stop', { receiverId });
  }, 3000);
}

// Listen for typing indicators
socket.on('typing:start', (data) => {
  showTypingIndicator(data.userName);
});

socket.on('typing:stop', (data) => {
  hideTypingIndicator(data.userName);
});

// Handle user status changes
socket.on('user:online', (data) => {
  updateUserStatus(data.userId, true);
});

socket.on('user:offline', (data) => {
  updateUserStatus(data.userId, false, data.lastSeen);
});

// Handle read receipts
socket.on('message:read_receipt', (data) => {
  markMessageAsRead(data.messageId);
});

// Error handling
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});
```

## Features Summary

### ✅ **Implemented Features:**

1. **Real-time Messaging**
   - Send/receive messages instantly
   - Database persistence
   - Message status tracking (sent/delivered/read)
   - Support for different message types
   - Reply functionality

2. **User Status Tracking**
   - Online/offline status
   - Real-time status updates
   - Last seen timestamps
   - Socket ID tracking for direct messaging

3. **Typing Indicators**
   - Start/stop typing events
   - Per-conversation typing status
   - Automatic timeout handling

4. **Message Status Management**
   - Mark individual messages as read
   - Mark entire conversations as read
   - Read receipts with timestamps
   - Delivery confirmations

5. **Error Handling**
   - Comprehensive error events
   - Validation and authentication checks
   - Graceful disconnect handling

6. **Security**
   - JWT authentication required
   - User validation for all operations
   - Prevention of self-messaging
   - Room-based message delivery

### 🧪 **Testing**

Use the included `socket-test.html` file to test all Socket.IO events interactively:

1. Start your server: `npm start`
2. Open `http://localhost:3000/socket-test.html`
3. Enter JWT token and connect
4. Test all messaging and status features

The system provides a complete real-time messaging experience with persistent storage and comprehensive event handling!
