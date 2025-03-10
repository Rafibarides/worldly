import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import AuthStackNavigator from './navigation/AuthStackNavigator';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Routes component which checks if there's a logged-in user
function Routes() {
  const { currentUser } = useAuth();
  return (
    <NavigationContainer>
      {currentUser ? <BottomTabNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

// Define the toast config with a custom challenge toast
const toastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#7dbc63' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  info: (props) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#1e88e5' }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{ fontSize: 16, fontWeight: 'bold' }}
      text2Style={{ fontSize: 14 }}
    />
  ),
  // Custom challenge toast with challenger avatar
  challenge: ({ text1, text2, props, onPress }) => {
    // Extract the avatarUrl from props
    const { avatarUrl, challengeId } = props || {};
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [isPressed, setIsPressed] = React.useState(false);
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        style={[
          styles.challengeToast,
          isPressed && styles.challengeToastPressed
        ]}
      >
        {avatarUrl ? (
          <View style={styles.avatarContainer}>
            {!imageLoaded && (
              <View style={[styles.defaultAvatar, styles.loadingAvatar]}>
                <Text style={styles.defaultAvatarText}>!</Text>
              </View>
            )}
            <Image 
              source={{ uri: avatarUrl }} 
              style={[
                styles.challengeAvatar,
                imageLoaded ? null : { position: 'absolute', opacity: 0 }
              ]} 
              onLoad={() => setImageLoaded(true)}
            />
          </View>
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.defaultAvatarText}>!</Text>
          </View>
        )}
        <View style={styles.challengeTextContainer}>
          <Text style={styles.challengeText1}>{text1}</Text>
          <Text style={styles.challengeText2}>{text2}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#fdc15f" />
      </TouchableOpacity>
    );
  },
};

const styles = StyleSheet.create({
  challengeToast: {
    height: 80,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginTop: 10,
  },
  challengeIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  challengeTextContainer: {
    flex: 1,
  },
  challengeText1: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fdc15f',
    marginBottom: 5,
  },
  challengeText2: {
    fontSize: 14,
    color: '#1d6200',
  },
  challengeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#fdc15f',
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fdc15f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  defaultAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    position: 'relative',
  },
  loadingAvatar: {
    position: 'absolute',
    zIndex: 1,
  },
  challengeToastPressed: {
    backgroundColor: '#f8f8f8',
    transform: [{ scale: 0.98 }],
  },
});

export default function App({ navigation }) {
  return (
    <AuthProvider navigation={navigation}>
      <Routes />
      <Toast config={toastConfig} />
    </AuthProvider>
  );
}
