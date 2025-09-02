# PingMe Demo Script (< 5 minutes)

**Real-time Chat Application Demo**

---

## 🎬 Demo Setup (30 seconds)

### Prerequisites
- Backend server running on `http://localhost:3000`
- Two devices/simulators ready (or one device + web browser)
- MongoDB connected

### Quick Start Commands
```bash
# Terminal 1 - Start Backend
cd server && npm run dev

# Terminal 2 - Start Mobile App
cd mobile && npm start
# Then press 'a' for Android or 'i' for iOS
```

---

## 📝 Demo Script (4 minutes)

### **Scene 1: User Registration (45 seconds)**

**Narrator:** "Let's create two users to demonstrate real-time chat features."

**Device 1 (Alice):**
1. Open PingMe app
2. Tap **"Register"**
3. Fill form:
   - Username: `alice`
   - Email: `alice@demo.com`
   - Password: `demo123`
4. Tap **"Register"** button
5. **Result:** Automatically logged in → Home screen with user list

**Device 2 (Bob):**
1. Open PingMe app (second device/simulator)
2. Tap **"Register"**
3. Fill form:
   - Username: `bob`
   - Email: `bob@demo.com`
   - Password: `demo123`
4. Tap **"Register"** button
5. **Result:** Home screen shows Alice as "Online" 🟢

**Key Point:** "Notice Alice immediately appears as 'Online' on Bob's device - this is real-time presence detection!"

---

### **Scene 2: Login Flow (30 seconds)**

**Narrator:** "Let's test the login system by logging out and back in."

**Device 1 (Alice):**
1. Tap profile/logout button (top-right)
2. Confirm logout → Returns to Login screen
3. Enter credentials:
   - Email: `alice@demo.com`
   - Password: `demo123`
4. Tap **"Login"**
5. **Result:** Back to Home screen, Bob still shows as online

**Key Point:** "JWT authentication with persistent login - tokens are securely stored!"

---

### **Scene 3: Starting a Chat (30 seconds)**

**Device 1 (Alice):**
1. On Home screen, tap on **"Bob"** from user list
2. **Result:** Chat screen opens with title "Bob"
3. Show empty chat initially

**Device 2 (Bob):**
1. Tap on **"Alice"** from user list
2. **Result:** Same conversation opens on Bob's device

**Key Point:** "Chat conversations are automatically created when users first message each other."

---

### **Scene 4: Real-time Messaging (60 seconds)**

**Device 1 (Alice):**
1. Type message: `"Hey Bob! 👋"`
2. Tap **Send** button
3. **Result:** Message appears instantly

**Device 2 (Bob):**
1. **Show:** Alice's message appears in real-time without refresh
2. Type reply: `"Hi Alice! How are you?"`
3. Tap **Send**

**Device 1 (Alice):**
1. **Show:** Bob's reply appears instantly
2. Type: `"Great! This real-time chat is amazing!"`
3. Send message

**Key Point:** "Messages sync instantly across all devices using Socket.IO - no delays, no refresh needed!"

---

### **Scene 5: Typing Indicators (45 seconds)**

**Device 1 (Alice):**
1. Start typing: `"Let me show you the typing indicator..."`
2. **Don't send yet** - keep typing slowly

**Device 2 (Bob):**
1. **Show:** "Alice is typing..." indicator appears at bottom
2. **Show:** Indicator disappears when Alice stops typing
3. Now Bob starts typing: `"I can see when you're typing!"`

**Device 1 (Alice):**
1. **Show:** "Bob is typing..." appears
2. **Show:** Indicator disappears after Bob sends message

**Key Point:** "Typing indicators help users know when someone is responding - just like WhatsApp or iMessage!"

---

### **Scene 6: Read Receipts (30 seconds)**

**Device 1 (Alice):**
1. Send message: `"Did you receive this message?"`
2. **Show:** Message status shows "Sent" initially

**Device 2 (Bob):**
1. Open chat (if not already open)
2. **Show:** Message appears

**Device 1 (Alice):**
1. **Show:** Message status changes to "Read" ✓✓
2. Send another: `"Perfect! Read receipts working!"`

**Key Point:** "Read receipts show message delivery status - users know exactly when their messages are seen!"

---

### **Scene 7: Online/Offline Status (30 seconds)**

**Device 2 (Bob):**
1. Close the app or disconnect from network
2. **Show:** On Alice's device, Bob's status changes to "Offline" 🔴

**Device 1 (Alice):**
1. **Show:** User list updates Bob's status to "Offline"
2. Send message: `"Are you still there?"`
3. **Show:** Message stays as "Sent" (not "Read")

**Device 2 (Bob):**
1. Reconnect/reopen app
2. **Show:** Status changes back to "Online" 🟢
3. **Show:** Alice's message appears

**Key Point:** "Real-time presence - users can see who's available for immediate response!"

---

## 🎯 Demo Wrap-up (20 seconds)

**Narrator:** "In under 5 minutes, we've demonstrated:"

✅ **User Registration & Authentication** - Secure JWT-based login
✅ **Real-time Messaging** - Instant message delivery
✅ **Typing Indicators** - See when others are responding  
✅ **Read Receipts** - Know when messages are seen
✅ **Online/Offline Status** - Real-time presence detection

**"PingMe delivers a complete WhatsApp-like experience with modern React Native and Socket.IO technology!"**

---

## 🎥 Demo Tips

### **For Live Demo:**
- Have both devices/simulators visible on screen
- Use screen recording software (OBS, QuickTime)
- Speak clearly while demonstrating each feature
- Point out real-time updates as they happen

### **For Video Demo:**
- Use split-screen to show both devices
- Add text overlays highlighting key features
- Include timestamps for each feature demonstration
- End with feature summary slide

### **Backup Plans:**
- Pre-register users if registration fails
- Have sample conversations ready
- Test network connectivity beforehand
- Prepare screenshots of key features

---

## 📱 Advanced Demo Features (Optional Extensions)

If you have extra time, demonstrate:

1. **Multiple Users:** Add a third user to show group presence
2. **Message History:** Show conversation persistence
3. **Network Recovery:** Disconnect/reconnect to show message sync
4. **Cross-Platform:** iOS + Android simultaneously
5. **Background Notifications:** App backgrounding/foregrounding

---

**Total Demo Time: 4 minutes 30 seconds**
**Perfect for showcasing PingMe's core real-time chat capabilities!** 🚀
