// Will contain the bottom tab navigation setup 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// Import screens
import GameScreen from '../screens/Game/GameScreen';
import FriendSearchScreen from '../screens/Friends/FriendSearchScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import AboutScreen from '../screens/About/AboutScreen'; // Using this as "Logs" for now

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        tabBarActiveTintColor: 'rgba(177, 216, 138, 1)', // from your color scheme
        tabBarInactiveTintColor: 'rgba(242, 174, 199, 1)', // from your color scheme
      }}
    >
      <Tab.Screen 
        name="Game" 
        component={GameScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="public" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={FriendSearchScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsListScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Logs" 
        component={AboutScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <MaterialIcons name="history" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 