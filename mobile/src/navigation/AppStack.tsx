import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/app/HomeScreen';
import ChatScreen from '../screens/app/ChatScreen';

export type AppStackParamList = {
  Home: undefined;
  Chat: { 
    userId: string; 
    username: string; 
    conversationId?: string;
  };
};

const Stack = createStackNavigator<AppStackParamList>();

const AppStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'PingMe',
          headerBackTitle: 'Back'
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={({ route }: { route: any }) => ({
          title: route.params.username,
          headerBackTitle: 'Home',
        })}
      />
    </Stack.Navigator>
  );
};

export default AppStack;
