// Will contain the bottom tab navigation setup 
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { FriendsNavigator, SearchStackNavigator, GameStackNavigator as AppGameStackNavigator } from './AppNavigator';  // Import FriendsNavigator and SearchStackNavigator

// Import screens
import GameScreen from '../screens/Game/GameScreen';
import GamePlayScreen from '../screens/Game/GamePlayScreen';
import GameSummaryScreen from '../screens/Game/GameSummaryScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import FriendsListScreen from '../screens/Friends/FriendsListScreen';
import AboutScreen from '../screens/About/AboutScreen'; // Using this as "Logs" for now
import LogsScreen from '../screens/Logs/LogsScreen';
import BadgesListScreen from '../screens/Badges/BadgesListScreen';
import PendingRoomScreen from '../screens/Game/PendingRoomScreen';  // Add this import
import CapitalsGame from '../screens/Game/CapitalsGame';
import FlagsGame from '../screens/Game/FlagsGame';
import GameDurationScreen from "../screens/Game/GameDurationScreen";
import CountryOfTheDayScreen from '../screens/Country/CountryOfTheDayScreen';

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
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="BadgesList" component={BadgesListScreen} />
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

// Create a separate stack navigator for the Game screens
function LocalGameStackNavigator() {
  return (
    <GameStack.Navigator screenOptions={{ headerShown: false }}>
      <GameStack.Screen 
        name="GameMain" 
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen name="GamePlay" component={GamePlayScreen} />
      <GameStack.Screen name="GameSummary" component={GameSummaryScreen} />
      <GameStack.Screen 
        name="PendingRoom" 
        component={PendingRoomScreen}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="CapitalsGame" 
        component={CapitalsGame}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="FlagsGame" 
        component={FlagsGame}
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="GameDuration" 
        component={GameDurationScreen} 
        options={{ headerShown: false }}
      />
      <GameStack.Screen 
        name="CountryOfTheDay" 
        component={CountryOfTheDayScreen} 
        options={{ headerShown: false }}
      />
    </GameStack.Navigator>
  );
}

// NEW: Custom TabBar Component using Reanimated for the moving indicator
function CustomTabBar({ state, descriptors, navigation }) {
  const { width } = Dimensions.get('window');
  const tabWidth = width / state.routes.length;
  const indicatorWidth = 40; // Fixed width for indicator (same as icon box)
  const indicatorHorizontalOffset = (tabWidth - indicatorWidth) / 2;

  // Set up a shared value to track the indicator's horizontal translation.
  const indicatorTranslateX = useSharedValue(state.index * tabWidth + indicatorHorizontalOffset);

  // Whenever the active index changes, animate the indicator's translateX.
  React.useEffect(() => {
    indicatorTranslateX.value = withTiming(
      state.index * tabWidth + indicatorHorizontalOffset,
      { duration: 300 }
    );
  }, [state.index, tabWidth, indicatorHorizontalOffset]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorTranslateX.value }],
  }));

  return (
    <View style={styles.tabBarContainer}>
      {/* Animated indicator behind icons */}
      <Animated.View style={[styles.indicator, animatedIndicatorStyle]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        let iconName;
        switch (route.name) {
          case 'Game':
            iconName = 'public';
            break;
          case 'Search':
            iconName = 'search';
            break;
          case 'Home':
            iconName = 'home';
            break;
          case 'Friends':
            iconName = 'people';
            break;
          case 'Logs':
            iconName = 'history';
            break;
          default:
            iconName = 'help-outline';
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tabButton}
          >
            <MaterialIcons name={iconName} size={26} color="#fff" />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      // Use our custom tab bar component
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen 
        name="Game" 
        component={LocalGameStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Home" 
        component={HomeStackNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Friends" 
        component={FriendsNavigator}  // Use FriendsNavigator instead of FriendsListScreen
        options={{ headerShown: false }}
      />
      <Tab.Screen
        name="Logs"
        component={LogsScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Add these styles at the bottom of the file
const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#92c47b',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingBottom: 20,
    
    // marginBottom: 20,
  },
  indicator: {
    position: 'absolute',
    top: (60 - 40) / 2, // center vertically in tab bar (80 height, 40 indicator)
    width: 40,
    height: 40,
    backgroundColor: '#add495',
    borderRadius: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // ensure buttons are above the indicator
  },
}); 