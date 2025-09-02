# PingMe - Real-time Chat Application

A full-stack real-time chat application built with React Native (mobile) and Node.js + Socket.IO (backend).

## 📱 Features

- **Real-time messaging** with Socket.IO
- **User authentication** with JWT tokens
- **Online/offline status** indicators
- **Typing indicators** and read receipts
- **User directory** to see all registered users
- **Cross-platform mobile app** (iOS & Android)

## 🏗️ Architecture

```
pingme/
├── mobile/          # React Native app
├── server/          # Node.js + Express + Socket.IO backend
└── README.md        # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **React Native development environment**:
  - Android Studio (for Android)
  - Xcode (for iOS - macOS only)
- **Git**

---

## 🔧 Backend Setup (Node.js + MongoDB + Socket.IO)

### 1. Navigate to Server Directory

```bash
cd server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/pingme
# For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pingme

# JWT Secret (use a strong secret in production)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (adjust for production)
CORS_ORIGIN=http://localhost:3000,http://10.0.2.2:3000
```

### 4. Start MongoDB

**Local MongoDB:**
```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Windows (if installed as service)
net start MongoDB

# Linux
sudo systemctl start mongod
```

**MongoDB Atlas:**
- Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

### 6. Verify Backend Setup

Visit `http://localhost:3000` in your browser - you should see the API status page.

---

## 📱 Frontend Setup (React Native)

### 1. Navigate to Mobile Directory

```bash
cd mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Start Metro Bundler

```bash
npm start
```

### 5. Run the App

**Android:**
```bash
# Make sure Android emulator is running or device is connected
npm run android
```

**iOS:**
```bash
# Make sure iOS simulator is running
npm run ios
```

### 6. Configure API Endpoint

If running on a physical device, update the API base URL in `mobile/src/utils/api.ts`:

```typescript
// For Android emulator
const BASE_URL = 'http://10.0.2.2:3000';

// For iOS simulator
const BASE_URL = 'http://localhost:3000';

// For physical device (replace with your computer's IP)
const BASE_URL = 'http://192.168.1.100:3000';
```

---

## 👥 Sample Users

The application supports user registration, but you can create sample users via the API:

### Using curl:

```bash
# Create User 1
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "email": "alice@example.com", 
    "password": "password123"
  }'

# Create User 2
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "bob",
    "email": "bob@example.com",
    "password": "password123"
  }'

# Create User 3
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "charlie",
    "email": "charlie@example.com",
    "password": "password123"
  }'
```

### Using the Mobile App:

1. Open the app
2. Tap "Register" 
3. Fill in the form with sample data
4. Repeat for multiple users using different devices/simulators

## 🔐 Authentication Flow

1. **Register:** Create account with username, email, password
2. **Login:** Authenticate and receive JWT token
3. **Token Storage:** JWT stored in AsyncStorage for persistent login
4. **Auto-login:** App checks for stored token on startup

## 💬 Chat Features

### Real-time Messaging
- Messages sync instantly via Socket.IO
- Support for text messages
- Message timestamps and read status

### User Presence
- Online/offline status indicators
- Last seen timestamps
- Real-time presence updates

### Typing Indicators
- Shows when other users are typing
- Automatic timeout after 3 seconds
- Multiple users typing support

## 🛠️ Development

### Project Structure

```
mobile/src/
├── screens/
│   ├── auth/           # Login & Register screens
│   └── app/            # Main app screens
├── navigation/         # React Navigation setup
├── context/            # React Context (Auth)
├── utils/              # API client & Socket service
└── types/              # TypeScript type definitions

server/
├── routes/             # Express route handlers
├── models/             # MongoDB schemas
├── middleware/         # Auth & validation middleware
├── public/             # Static files & Socket.IO test page
└── server.js           # Main server file
```

### Available Scripts

**Backend (server/):**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
```

**Frontend (mobile/):**
```bash
npm start          # Start Metro bundler
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run lint       # Run ESLint
npm test           # Run tests
```

## 🌐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID

### Messages
- `GET /conversations/:conversationId/messages` - Get conversation messages
- `POST /conversations/:conversationId/messages` - Send message

### Socket.IO Events
- `user:online` / `user:offline` - User presence
- `message:new` - New message received
- `typing:start` / `typing:stop` - Typing indicators
- `message:read` - Message read receipts

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Configure reverse proxy (Nginx)
4. Use MongoDB Atlas for database

### Mobile App Deployment
1. Build release APK/IPA
2. Test on physical devices
3. Submit to app stores

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to server"**
- Check if backend server is running on correct port
- Verify API_BASE_URL in mobile app
- Check firewall settings

**"Metro bundler issues"**
- Clear Metro cache: `npx react-native start --reset-cache`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**"MongoDB connection failed"**
- Ensure MongoDB is running
- Check connection string in .env
- Verify network connectivity for Atlas

**"Module not found errors"**
- Run `npm install` in respective directory
- Check for TypeScript compilation errors
- Restart Metro bundler

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation in `/server` and `/mobile` directories

---

**Built with ❤️ using React Native, Node.js, Socket.IO, and MongoDB**
