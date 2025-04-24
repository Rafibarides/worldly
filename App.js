import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

// Import your screens
import HomeScreen from './screens/HomeScreen'; // adjust path as needed
import GamePlayScreen from './screens/Game/GamePlayScreen';
import PendingRoomScreen from './screens/Game/PendingRoomScreen';
import GameSummaryScreen from './screens/Game/GameSummaryScreen';
import FriendsListScreen from './screens/Friends/FriendsListScreen';
import GameScreen from './screens/Game/GameScreen'; // Ensure this import is correct
import CapitalsGame from './screens/Game/CapitalsGame';
import FlagsGame from './screens/Game/FlagsGame';

const Stack = createStackNavigator();

// Define the toast config
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#7dbc63' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#1e88e5' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold'
      }}
      text2Style={{
        fontSize: 14
      }}
    />
  ),
};

export default function App() {
  return (
    <>
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
          <Stack.Screen
            name="CapitalsGame"
            component={CapitalsGame}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="FlagsGame"
            component={FlagsGame}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <Toast config={toastConfig} />
    </>
  );
} 