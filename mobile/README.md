# PingMe Mobile

A React Native chat application with authentication and navigation.

## Features

- **Authentication Flow**: Login and Registration screens
- **Main App Flow**: Home screen and Chat functionality
- **React Navigation**: Stack and Tab navigation implementation
- **TypeScript**: Full TypeScript support for type safety

## Project Structure

```
src/
├── context/
│   └── AuthContext.tsx          # Authentication context and state management
├── navigation/
│   ├── AuthStack.tsx           # Authentication flow navigation
│   └── AppStack.tsx            # Main app navigation with tabs
└── screens/
    ├── auth/
    │   ├── LoginScreen.tsx     # Login screen
    │   └── RegisterScreen.tsx  # Registration screen
    └── app/
        ├── HomeScreen.tsx      # Home/Dashboard screen
        ├── ChatListScreen.tsx  # List of chats
        └── ChatScreen.tsx      # Individual chat screen
```

## Navigation Structure

### AuthStack (Unauthenticated Users)
- **Login Screen**: User authentication
- **Register Screen**: New user registration

### AppStack (Authenticated Users)
- **Main Tabs**:
  - **Home Tab**: Dashboard/profile information
  - **Chats Tab**: List of chat conversations
- **Chat Screen**: Individual chat interface (modal/stack screen)

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **iOS Setup** (if targeting iOS):
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Android Setup**:
   - Ensure Android development environment is set up
   - Android SDK and tools are installed

4. **Run the Application**:
   
   For iOS:
   ```bash
   npm run ios
   ```
   
   For Android:
   ```bash
   npm run android
   ```

   Start Metro bundler:
   ```bash
   npm start
   ```

## Key Dependencies

- **@react-navigation/native**: Core navigation library
- **@react-navigation/stack**: Stack navigator for screen transitions
- **@react-navigation/bottom-tabs**: Tab navigator for main app sections
- **react-native-screens**: Native screen optimization
- **react-native-safe-area-context**: Safe area handling
- **react-native-gesture-handler**: Gesture handling for navigation
- **@react-native-async-storage/async-storage**: Local storage for authentication tokens

## Authentication Flow

1. **AuthContext**: Manages authentication state across the app
2. **Token Storage**: Uses AsyncStorage to persist authentication tokens
3. **API Integration**: Ready for integration with your backend server
4. **Auto Login**: Checks for existing tokens on app launch

## Integration with Backend

The app is configured to work with your existing server structure. Update the API endpoints in `AuthContext.tsx`:

- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`

Make sure your server handles these endpoints and returns the expected response format:

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@email.com"
  }
}
```

## Development Notes

- The TypeScript errors shown are expected until you run `npm install` to install the dependencies
- Mock data is used in chat screens - replace with real API calls
- The app structure supports easy extension for additional features
- All screens are responsive and handle keyboard interactions

## Next Steps

1. Install dependencies: `npm install`
2. Set up your development environment for React Native
3. Connect to your backend API
4. Customize the UI/UX to match your design requirements
5. Add real-time chat functionality using WebSockets or Socket.IO
6. Implement push notifications
7. Add image/media sharing capabilities
