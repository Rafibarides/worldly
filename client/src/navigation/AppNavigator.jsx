import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from './BottomTabNavigator';
import BadgesListScreen from '../screens/Badges/BadgesListScreen';
import { createStackNavigator } from '@react-navigation/stack';
import FriendRequestsScreen from '../screens/Friends/FriendRequestsScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import FriendSearchScreen from '../screens/Friends/FriendSearchScreen';
import { TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const SearchStack = createStackNavigator();

// Export FriendsNavigator so it can be used in BottomTabNavigator
export function FriendsNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="FriendsList" 
        component={FriendsListScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity 
              style={{ marginLeft: 16 }}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            elevation: 0, // Android
            shadowOpacity: 0, // iOS
            borderBottomWidth: 0, // iOS
            backgroundColor: '#fff'
          }
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
          headerTitle: '',
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
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
      <SearchStack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          headerTitle: '',
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
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