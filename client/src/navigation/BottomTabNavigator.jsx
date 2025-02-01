// Will contain the bottom tab navigation setup 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import GameScreen from '../screens/Game/GameScreen';
import GamePlayScreen from '../screens/Game/GamePlayScreen';
import GameSummaryScreen from '../screens/Game/GameSummaryScreen';
import FriendSearchScreen from '../screens/Friends/FriendSearchScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import AboutScreen from '../screens/About/AboutScreen'; // Using this as "Logs" for now
import LogsScreen from '../screens/Logs/LogsScreen';

// NEW import for the settings screen
import ProfileSettingsScreen from '../screens/Settings/ProfileSettingsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();
const FriendsStack = createStackNavigator();
const SearchStack = createStackNavigator();
const GameStack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen 
        name="ProfileSettings" 
        component={ProfileSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <HomeStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <HomeStack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ title: 'About Worldly' }}
      />
    </HomeStack.Navigator>
  );
}

function FriendsStackNavigator() {
  return (
    <FriendsStack.Navigator>
      <FriendsStack.Screen 
        name="FriendsList" 
        component={FriendsListScreen} 
        options={{ title: 'Friends' }}
      />
      <FriendsStack.Screen 
        name="FriendSearch" 
        component={FriendSearchScreen}
        options={{ title: 'Find Friends' }}
      />
      <FriendsStack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </FriendsStack.Navigator>
  );
}

function SearchStackNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="FriendSearch"
        component={FriendSearchScreen}
        options={{ title: 'Find Friends' }}
      />
      <SearchStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </SearchStack.Navigator>
  );
}

// Create a separate stack navigator for the Game screens
function GameStackNavigator() {
  return (
    <GameStack.Navigator>
      <GameStack.Screen 
        name="GameMain" 
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="GamePlay" 
        component={GamePlayScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false // Prevent swipe back during game
        }}
      />
      <GameStack.Screen 
        name="GameSummary" 
        component={GameSummaryScreen}
        options={{ 
          headerShown: false,
          gestureEnabled: false
        }}
      />
    </GameStack.Navigator>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Game') {
            iconName = 'public';
          } else if (route.name === 'Friends') {
            iconName = 'people';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Logs') {
            iconName = 'history';
          }
          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'rgba(177, 216, 138, 1)',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Game" 
        component={GameStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Home" 
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 