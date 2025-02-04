import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import BadgesListScreen from '../screens/Badges/BadgesListScreen';
import { createStackNavigator } from '@react-navigation/stack';
import FriendRequestsScreen from '../screens/Friends/FriendRequestsScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import FriendSearchScreen from '../screens/Friends/FriendSearchScreen';

const Stack = createStackNavigator();
const SearchStack = createStackNavigator();

// Export FriendsNavigator so it can be used in BottomTabNavigator
export function FriendsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen} 
      />
      <Stack.Screen 
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          title: 'Friend Requests'
        }}
      />
      <Stack.Screen 
        name="FriendSearch" 
        component={FriendSearchScreen} 
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile'
        }}
      />
    </Stack.Navigator>
  );
}

export function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen 
        name="FriendSearch" 
        component={FriendSearchScreen} 
        options={{ headerShown: false }}
      />
    </SearchStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
} 