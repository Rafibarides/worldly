import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Constants from 'expo-constants';

// Configure how notifications appear - this is the ONLY place we should set this
// Set shouldShowAlert to false to prevent notifications from showing in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // Never show alerts when app is in foreground
    shouldPlaySound: false, // Don't play sounds for foreground notifications
    shouldSetBadge: true,   // Still update the app badge
  }),
});

// Register for push notifications and return the token
export async function registerForPushNotificationsAsync() {
  let token;
  
  // Check if we're running on a physical device (notifications don't work on simulators)
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Request permission to show notifications
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }
  
  // Get the token
  try {
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
    
    console.log('Expo push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }
  
  return token;
}

// Save the Expo push token to Firebase for this user
export async function savePushToken(token) {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const db = getFirestore();
      await updateDoc(doc(db, 'users', user.uid), {
        expoPushToken: token,
      });
      console.log('Push token saved to Firebase');
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// Handle receiving a notification
export function setupNotificationListeners(navigation) {
  // Handle notification opened from background
  Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    console.log('Notification tapped:', data);
    
    if (data.type === 'friendRequest') {
      // Navigate to friends screen
      navigation.navigate('Friends');
    } else if (data.type === 'challenge') {
      // Navigate to game screen
      navigation.navigate('Game');
    }
  });
  
  // Handle notification received when app is in foreground
  // This listener doesn't affect whether the notification appears or not
  // It's only for custom handling of the notification content
  return Notifications.addNotificationReceivedListener(notification => {
    // Log that we received a notification in the foreground
    console.log('Received notification in foreground - will be suppressed:', notification.request.content);
    // We don't need to do anything here as the notification won't show
    // Our Firebase listeners will trigger the in-app toasts
  });
} 