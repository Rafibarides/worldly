import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import HomeScreen from './screens/HomeScreen'; // adjust path as needed
import GamePlayScreen from './screens/Game/GamePlayScreen';
import PendingRoomScreen from './screens/Game/PendingRoomScreen';
import GameSummaryScreen from './screens/Game/GameSummaryScreen';
import FriendsListScreen from './screens/Friends/FriendsListScreen';
import GameScreen from './screens/Game/GameScreen'; // Ensure this import is correct

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Game"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen 
          name="Game" 
          component={GameScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="GamePlay" 
          component={GamePlayScreen}
          options={{ headerShown: true, title: 'Game Play' }} 
        />
        <Stack.Screen 
          name="GameSummary" 
          component={GameSummaryScreen}
          options={{ headerShown: true, title: 'Game Summary' }} 
        />
        <Stack.Screen 
          name="Friends" 
          component={FriendsListScreen}
          options={{ title: 'Friends' }} 
        />
        <Stack.Screen
          name="PendingRoom"
          component={PendingRoomScreen}
          options={{ headerShown: true, title: 'Pending Challenge' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 