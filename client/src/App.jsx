import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import AuthStackNavigator from './navigation/AuthStackNavigator';

// Routes component which checks if there's a logged-in user
function Routes() {
  const { currentUser } = useAuth();
  return (
    <NavigationContainer>
      {currentUser ? <BottomTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

export default function App({navigation}) {
  return (
    <AuthProvider navigation={navigation}>
      <Routes />
    </AuthProvider>
  );
}
