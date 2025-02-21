import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import HomeScreen from './screens/HomeScreen'; // adjust path as needed
import GamePlayScreen from './screens/Game/GamePlayScreen';
import PendingRoomScreen from './screens/Game/PendingRoomScreen';
import GameSummaryScreen from './screens/Game/GameSummaryScreen';
import FriendsListScreen from './screens/Friends/FriendsListScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        {/* Home Screen */}
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />

        {/* Friends List Screen */}
        <Stack.Screen name="FriendsList" component={FriendsListScreen} options={{ title: 'Friends' }} />

        {/* Pending Room Screen */}
        <Stack.Screen
          name="PendingRoom"
          component={PendingRoomScreen}
          options={{ headerShown: true, title: 'Pending Challenge' }}
        />

        {/* Game Play Screen */}
        <Stack.Screen
          name="GamePlay"
          component={GamePlayScreen}
          options={{ headerShown: true, title: 'Game Play' }}
        />

        {/* Game Summary Screen */}
        <Stack.Screen
          name="GameSummary"
          component={GameSummaryScreen}
          options={{ headerShown: true, title: 'Game Summary' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 