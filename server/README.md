# Real-time Chat App with Authentication

This is a real-time chat application built with Node.js, Express, Socket.IO, and MongoDB with JWT authentication.

## Features

- User registration and login with JWT authentication
- Real-time messaging with Socket.IO
- Online/offline user status tracking
- Password hashing with bcrypt
- MongoDB integration with Mongoose

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your MongoDB connection string and JWT secret.

3. **Start MongoDB:**
   Make sure MongoDB is running on your system.

4. **Run the application:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

## API Endpoints

### Authentication Routes

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "onlineStatus": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /auth/login
Login an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "onlineStatus": true,
      "createdAt": "...",
      "updatedAt": "..."
    },
    "token": "jwt-token-here"
  }
}
```

#### POST /auth/logout
Logout the current user.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Socket.IO Events

### Client to Server

- `authenticate` - Authenticate user with JWT token
- `send_message` - Send a chat message

### Server to Client

- `authenticated` - Confirmation of successful authentication
- `authentication_error` - Authentication failed
- `user_online` - A user came online
- `user_offline` - A user went offline
- `receive_message` - Receive a chat message

## Testing the API

You can test the authentication endpoints using curl or any API testing tool:

### Register a user:
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Login:
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Logout (replace YOUR_JWT_TOKEN with actual token):
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Client-side Socket.IO Connection

```javascript
// Connect to server
const socket = io('http://localhost:3000');

// Authenticate with JWT token
socket.emit('authenticate', 'your-jwt-token-here');

// Listen for authentication response
socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.user);
});

// Send a message
socket.emit('send_message', {
  message: 'Hello, world!',
  room: 'general' // optional
});

// Receive messages
socket.on('receive_message', (data) => {
  console.log('New message:', data);
});
```

## User Model Schema

```javascript
{
  name: String (required, 2-50 characters),
  email: String (required, unique, valid email),
  passwordHash: String (required, min 6 characters, auto-hashed),
  onlineStatus: Boolean (default: false),
  lastSeen: Date (default: now),
  socketId: String (default: null),
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- Passwords are hashed using bcrypt with salt rounds of 12
- JWT tokens expire after 7 days
- Email validation and uniqueness enforcement
- Input validation for all required fields
- Sensitive data (passwordHash) is excluded from JSON responses
