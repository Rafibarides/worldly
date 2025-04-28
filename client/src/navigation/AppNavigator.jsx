import { NavigationContainer } from "@react-navigation/native";
import BottomTabNavigator from "./BottomTabNavigator";
import BadgesListScreen from "../screens/Badges/BadgesListScreen";
import { createStackNavigator } from "@react-navigation/stack";
import FriendRequestsScreen from "../screens/Friends/FriendRequestsScreen";
import FriendsListScreen from "../screens/Friends/FriendsListScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import FriendSearchScreen from "../screens/Friends/FriendSearchScreen";
import { TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native"
import GameDurationScreen from "../screens/Game/GameDurationScreen";
import UserFriendsListScreen from "../screens/Friends/UserFriendsListScreen";
import CountryOfTheDayScreen from "../screens/Country/CountryOfTheDayScreen";

const Stack = createStackNavigator();
const SearchStack = createStackNavigator();

// Export FriendsNavigator so it can be used in BottomTabNavigator
export function FriendsNavigator() {
  const navigation = useNavigation();

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
          headerTitle: "",
          headerLeft: () => {
            return (
              <TouchableOpacity
                style={{ marginLeft: 16 }}
                onPress={() => navigation.goBack()}
              >
                <MaterialIcons
                  name="arrow-back-ios"
                  size={24}
                  color="#ffc268"
                />
              </TouchableOpacity>
            );
          },
          headerStyle: {
            elevation: 0, // Android
            shadowOpacity: 0, // iOS
            borderBottomWidth: 0, // iOS
            backgroundColor: "#fff",
          },
        }}
      />
      <Stack.Screen name="FriendSearch" component={FriendSearchScreen} />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "",
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />
      <Stack.Screen
        name="UserFriendsList"
        component={UserFriendsListScreen}
        options={{
          headerTitle: "",
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#fff",
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
          headerTitle: "",
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />
      <SearchStack.Screen
        name="UserFriendsList"
        component={UserFriendsListScreen}
        options={{
          headerTitle: "",
          headerBackTitleVisible: false,
          headerLeft: ({ onPress }) => (
            <TouchableOpacity onPress={onPress} style={{ marginLeft: 16 }}>
              <MaterialIcons name="arrow-back-ios" size={24} color="#ffc268" />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: "#fff",
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
          },
        }}
      />
    </SearchStack.Navigator>
  );
}

export function GameStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GameHome"
        component={GameScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GameDuration"
        component={GameDurationScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CountryOfTheDay"
        component={CountryOfTheDayScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}
