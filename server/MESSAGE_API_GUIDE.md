# Message API Testing Guide

## Message Model Features

The Message model includes the following fields:
- **senderId**: ObjectId reference to User (required)
- **receiverId**: ObjectId reference to User (required) 
- **content**: String message content (required, max 2000 chars)
- **status**: Enum ['sent', 'delivered', 'read'] (default: 'sent')
- **messageType**: Enum ['text', 'image', 'file', 'system'] (default: 'text')
- **createdAt/updatedAt**: Automatic timestamps
- **editedAt**: Date when message was edited
- **deletedAt**: Date when message was soft deleted
- **replyTo**: ObjectId reference to another Message

## API Endpoints

### 1. Get Conversation Messages
```bash
GET /api/conversations/:userId/messages
Authorization: Bearer <jwt-token>
Query Parameters:
  - page (default: 1)
  - limit (default: 50, max: 100)
  - status (optional: 'sent', 'delivered', 'read')
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/conversations/USER_ID/messages?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Send Message
```bash
POST /api/conversations/:userId/messages
Authorization: Bearer <jwt-token>
Body: {
  "content": "Hello there!",
  "messageType": "text",
  "replyTo": "MESSAGE_ID" (optional)
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/conversations/USER_ID/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello! How are you?"}'
```

### 3. Mark Message as Read
```bash
PUT /api/messages/:messageId/read
Authorization: Bearer <jwt-token>
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/messages/MESSAGE_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Mark All Messages in Conversation as Read
```bash
PUT /api/conversations/:userId/read
Authorization: Bearer <jwt-token>
```

**Example:**
```bash
curl -X PUT http://localhost:3000/api/conversations/USER_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get All Conversations
```bash
GET /api/conversations
Authorization: Bearer <jwt-token>
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Socket.IO Events

### Client to Server Events

#### Send Message
```javascript
socket.emit('send_message', {
  receiverId: 'USER_ID',
  content: 'Hello!',
  messageType: 'text',
  replyTo: 'MESSAGE_ID' // optional
});
```

#### Mark Message as Read
```javascript
socket.emit('mark_message_read', {
  messageId: 'MESSAGE_ID'
});
```

#### Typing Indicators
```javascript
// Start typing
socket.emit('typing_start', {
  receiverId: 'USER_ID'
});

// Stop typing
socket.emit('typing_stop', {
  receiverId: 'USER_ID'
});
```

### Server to Client Events

#### Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log('New message:', data);
  // data includes: senderId, receiverId, content, status, timestamp, etc.
});
```

#### Message Sent Confirmation
```javascript
socket.on('message_sent', (data) => {
  console.log('Message sent successfully:', data);
});
```

#### Message Read Notification
```javascript
socket.on('message_read', (data) => {
  console.log('Message was read:', data);
  // data includes: messageId, readBy, readAt
});
```

#### Typing Indicators
```javascript
socket.on('user_typing', (data) => {
  console.log(`${data.userName} is typing...`);
});

socket.on('user_stopped_typing', (data) => {
  console.log(`${data.userName} stopped typing`);
});
```

#### Error Handling
```javascript
socket.on('message_error', (data) => {
  console.error('Message error:', data.error);
});
```

## Complete Test Workflow

### 1. Register two users
```bash
# User 1
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# User 2  
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"password123"}'
```

### 2. Login both users and save their tokens and user IDs

### 3. Send message from Alice to Bob
```bash
curl -X POST http://localhost:3000/api/conversations/BOB_USER_ID/messages \
  -H "Authorization: Bearer ALICE_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hi Bob! How are you?"}'
```

### 4. Get conversation from Bob's perspective
```bash
curl -X GET http://localhost:3000/api/conversations/ALICE_USER_ID/messages \
  -H "Authorization: Bearer BOB_JWT_TOKEN"
```

### 5. Mark message as read from Bob
```bash
curl -X PUT http://localhost:3000/api/conversations/ALICE_USER_ID/read \
  -H "Authorization: Bearer BOB_JWT_TOKEN"
```

### 6. Get all conversations for Alice
```bash
curl -X GET http://localhost:3000/api/conversations \
  -H "Authorization: Bearer ALICE_JWT_TOKEN"
```

## Message Status Flow

1. **sent** - Message created and saved to database
2. **delivered** - Receiver is online and message was sent via Socket.IO
3. **read** - Receiver has marked the message as read

## Features

- ✅ Real-time messaging with Socket.IO
- ✅ Message persistence in MongoDB
- ✅ Message status tracking (sent/delivered/read)
- ✅ Pagination for message history
- ✅ Typing indicators
- ✅ Reply to messages
- ✅ Soft delete messages
- ✅ Conversation listing with unread counts
- ✅ Input validation and error handling
- ✅ User authentication required for all endpoints
