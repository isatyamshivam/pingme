# 📱 PingMe - Real-Time Chat App User Guide

Welcome to PingMe! This guide will walk you through how to use all the features of this real-time chat application.

## 🚀 Getting Started

### Step 1: Launch the Application
1. Make sure both the **server** and **mobile app** are running
2. Open the app on your device/emulator
3. You'll see the **Welcome/Authentication Screen**

### Step 2: Create an Account or Login

#### 📝 **Register (First Time Users)**
1. Tap **"Register"** or **"Sign Up"**
2. Fill in the form:
   - **Username**: Your display name (e.g., "john_doe")
   - **Email**: Your email address (e.g., "john@example.com")
   - **Password**: Secure password (minimum 6 characters)
3. Tap **"Register"** button
4. ✅ You'll be automatically logged in after successful registration

#### 🔐 **Login (Existing Users)**
1. Tap **"Login"** or **"Sign In"**
2. Enter your credentials:
   - **Email**: Your registered email
   - **Password**: Your password
3. Tap **"Login"** button
4. ✅ You'll be taken to the main app

---

## 🏠 Home Screen (User Directory)

After logging in, you'll see the **Home Screen** with a list of all users.

### Features:
- 👤 **User List**: See all registered users
- 🟢 **Online Status**: Green dot = online, Gray = offline
- 📱 **Tap to Chat**: Tap any user to start chatting
- 🔄 **Auto-Refresh**: Status updates in real-time

### How to Start a Chat:
1. Browse the user list
2. Tap on any user you want to chat with
3. 💬 Chat screen opens automatically

---

## 💬 Chat Screen (Real-Time Messaging)

This is where the magic happens! Real-time chat with advanced features.

### 📨 **Sending Messages**
1. Type your message in the input field at the bottom
2. Tap the **"Send"** button (or send icon)
3. ✅ Message appears instantly for both users

### 🎯 **Message Features**

#### **Message Bubbles**
- 🔵 **Your messages**: Blue bubbles on the right
- ⚪ **Their messages**: White/gray bubbles on the left
- ⏰ **Timestamps**: Smart time display (Today, Yesterday, or full date)

#### **Read Receipts**
- ✓ **Single checkmark**: Message sent
- ✓✓ **Double checkmark**: Message delivered and read
- 🔵 **Blue checkmarks**: Message read (confirmed)

#### **Typing Indicators**
- 💭 **"User is typing..."**: Shows when the other person is typing
- ⏱️ **Auto-hide**: Disappears after 2 seconds of inactivity

### 🔗 **Connection Status**
- 🟢 **Connected**: Normal operation, all features work
- 🟠 **Connecting...**: Orange banner shows when reconnecting
- 📱 **Offline Mode**: Messages sent via backup API when disconnected

---

## ⚡ Real-Time Features

### **Instant Messaging**
- Messages appear **immediately** without refresh
- No delay between sending and receiving
- Works across multiple devices simultaneously

### **Live Typing Detection**
- See when someone is typing in real-time
- Automatic start/stop detection
- Smart timeout (stops after 2 seconds of inactivity)

### **Read Status Tracking**
- Know exactly when your messages are read
- Visual indicators update in real-time
- Automatic read marking when chat is open

### **Auto-Reconnection**
- Seamless reconnection if connection drops
- Background sync when connection restored
- No message loss during disconnections

---

## 🎛️ App Navigation

### **Main Navigation**
- 🏠 **Home Tab**: User directory and online status
- 💬 **Chat Tab**: Active conversations (if implemented)
- 👤 **Profile Tab**: Your account settings (if implemented)

### **Screen Transitions**
- 🔄 **Smooth animations** between screens
- 📱 **Back button** to return to previous screen
- 🔝 **Auto-scroll** to latest messages in chat

---

## 🎨 User Interface Guide

### **Color Coding**
- 🔵 **Blue**: Your messages, active elements
- ⚪ **White/Gray**: Other user's messages
- 🟢 **Green**: Online status, success states
- 🟠 **Orange**: Warning states (connecting)
- 🔴 **Red**: Error states, offline status

### **Visual Indicators**
- 🟢 **Dot**: User is online
- ⚫ **Gray dot**: User is offline
- 💭 **Typing bubble**: Someone is typing
- ✓✓ **Checkmarks**: Message status
- 🔄 **Loading spinner**: Processing actions

---

## 🛠️ Troubleshooting

### **Common Issues & Solutions**

#### **Can't Login?**
- ✅ Check your email and password
- ✅ Ensure server is running (localhost:3000)
- ✅ Check internet connection

#### **Messages Not Sending?**
- ✅ Check connection status banner
- ✅ Try typing again (app will retry)
- ✅ Restart the app if needed

#### **Not Seeing Other Users?**
- ✅ Make sure server is running
- ✅ Check if other users are registered
- ✅ Pull down to refresh user list

#### **Real-Time Features Not Working?**
- ✅ Check connection banner at top of chat
- ✅ App automatically falls back to regular API
- ✅ Features restore when connection returns

---

## 🔧 Technical Details

### **System Requirements**
- **Android**: Version 5.0+ (API level 21+)
- **iOS**: Version 10.0+
- **Internet**: Required for all features
- **Server**: Must be running on localhost:3000

### **Network Requirements**
- **WiFi or Mobile Data**: For real-time features
- **WebSocket Support**: For instant messaging
- **HTTP/HTTPS**: For API fallback

---

## 💡 Pro Tips

### **Best Practices**
1. 🔄 **Keep app updated** for best performance
2. 📶 **Stable internet** for best real-time experience
3. 🔋 **Background refresh** enabled for notifications
4. 📱 **App permissions** granted for full functionality

### **Advanced Features**
1. 💬 **Long press messages** (if implemented) for more options
2. 📁 **Swipe gestures** for quick actions
3. 🔍 **Search conversations** (if implemented)
4. 🔕 **Notification settings** (if implemented)

---

## 📞 Example Usage Scenarios

### **Scenario 1: First Time User**
1. 📱 Open app → See login screen
2. 📝 Tap "Register" → Fill form → Create account
3. 🏠 Land on Home → See user list
4. 👤 Tap a user → Start chatting
5. 💬 Send first message → See real-time response

### **Scenario 2: Daily Usage**
1. 📱 Open app → Login automatically (if saved)
2. 🏠 Check Home → See who's online
3. 💬 Continue existing chats → See unread messages
4. ⚡ Enjoy real-time messaging → See typing indicators

### **Scenario 3: Group Coordination**
1. 👥 Multiple users online
2. 💬 Start conversations with different people
3. 🔄 Switch between chats seamlessly
4. ⚡ Coordinate in real-time with instant messaging

---

## 🎯 Key Features Summary

### ✅ **What You Can Do**
- 📝 **Register/Login** with secure authentication
- 👥 **See all users** with real-time online status
- 💬 **Chat instantly** with real-time messaging
- 👀 **See typing indicators** when others type
- ✓✓ **Track read status** of your messages
- 🔄 **Auto-reconnect** when connection drops
- 📱 **Seamless experience** across all devices

### 🚀 **Coming Soon** (Potential Features)
- 🖼️ **Image sharing** in chats
- 🎵 **Voice messages** for audio communication
- 👥 **Group chats** for multiple users
- 🔔 **Push notifications** for background messages
- 🔍 **Message search** through chat history
- 🎨 **Themes and customization** options

---

## 📋 Quick Reference

### **Key Actions**
| Action | How To |
|--------|--------|
| 📝 Register | Tap "Register" → Fill form → Submit |
| 🔐 Login | Tap "Login" → Enter credentials → Submit |
| 💬 Start Chat | Home → Tap user → Chat opens |
| 📨 Send Message | Type → Tap Send button |
| 👀 See Status | Check green/gray dots |
| 🔄 Refresh | Pull down on user list |
| ↩️ Go Back | Use back button or gesture |

### **Status Indicators**
| Symbol | Meaning |
|--------|---------|
| 🟢 | User is online |
| ⚫ | User is offline |
| ✓ | Message sent |
| ✓✓ | Message delivered |
| 🔵✓✓ | Message read |
| 💭 | User is typing |
| 🟠 | Connecting to server |

---

🎉 **Enjoy your real-time chatting experience with PingMe!**

*For technical support or feature requests, contact the development team.*
