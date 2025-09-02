# ⚡ Quick Start Guide - PingMe Chat App

## 🏃‍♂️ How to Run the Application

### 1️⃣ **Start the Backend Server**
```bash
# Navigate to server directory
cd server

# Install dependencies (first time only)
npm install

# Start the server
npm run dev
```
✅ **Server should show**: "Server running on port 3000" & "Connected to MongoDB"

### 2️⃣ **Start the Mobile App**
```bash
# Navigate to mobile directory  
cd mobile

# Install dependencies (first time only)
npm install

# Start Metro bundler
npm start
```
✅ **Metro should show**: Welcome screen with options to run on Android/iOS

### 3️⃣ **Deploy to Device**

#### **For Android:**
- Press `a` in Metro terminal, OR
- Run: `npx react-native run-android`

#### **For iOS:**
- Press `i` in Metro terminal, OR  
- Run: `npx react-native run-ios`

---

## 📱 How to Use the App

### **Step 1: Register/Login**
1. **Open the app** on your device
2. **Create account**: Tap "Register" → Fill username, email, password
3. **Or login**: Tap "Login" → Enter email and password

### **Step 2: Browse Users**
1. **Home screen** shows all registered users
2. **Green dot** = user is online
3. **Gray dot** = user is offline
4. **Tap any user** to start chatting

### **Step 3: Start Chatting**
1. **Type message** in input field at bottom
2. **Tap Send** button to send
3. **See real-time** message delivery
4. **Watch for**:
   - ✓ = Message sent
   - ✓✓ = Message read
   - "User is typing..." = Typing indicators

---

## 🎯 Key Features

### **Real-Time Messaging**
- ⚡ **Instant delivery** - Messages appear immediately
- 👀 **Typing indicators** - See when others are typing
- ✓✓ **Read receipts** - Know when messages are read
- 🔄 **Auto-reconnect** - Seamless connection recovery

### **User Experience**
- 🟢 **Online status** - See who's available
- 💬 **Message bubbles** - Clean chat interface  
- ⏰ **Smart timestamps** - Today/Yesterday/Date format
- 📱 **Mobile optimized** - Smooth performance

### **Technical Features**
- 🔐 **JWT Authentication** - Secure login system
- 🔌 **Socket.IO** - Real-time communication
- 📡 **API Fallback** - Works even when offline
- 💾 **MongoDB** - Persistent message storage

---

## 🛠️ Requirements

### **Development Environment**
- **Node.js** v14+ 
- **MongoDB** (local or cloud)
- **React Native CLI** or **Expo CLI**
- **Android Studio** (for Android) or **Xcode** (for iOS)

### **For Users**
- **Android** 5.0+ or **iOS** 10.0+
- **Internet connection** for real-time features
- **Server running** on localhost:3000

---

## 🔧 Troubleshooting

### **Server Issues**
```bash
# If server won't start:
cd server
npm install
npm run dev

# Check MongoDB connection in terminal output
```

### **Mobile App Issues**
```bash
# If app won't start:
cd mobile
npm install
npx react-native start --reset-cache

# For Android build issues:
npx react-native run-android --reset-cache
```

### **Connection Issues**
- ✅ Ensure server is running on port 3000
- ✅ Check device/emulator can reach localhost
- ✅ For physical device, use computer's IP address

---

## 🎉 Ready to Chat!

Once both server and mobile app are running:

1. **Register** a few test accounts
2. **Login** on different devices/emulators  
3. **Start chatting** in real-time!

**Example Test Users:**
- User 1: alice@test.com / password123
- User 2: bob@test.com / password123  
- User 3: charlie@test.com / password123

**Pro Tip**: Open multiple emulators or use web browser + mobile to test real-time features!

---

📚 **For detailed usage instructions, see the full [USER_GUIDE.md](./USER_GUIDE.md)**
