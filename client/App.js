import { NavigationContainer } from '@react-navigation/native';
import { useRef, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, savePushToken } from './src/services/notificationService';

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();
  
  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token);
      }
    });
    
    // Set up notification response listener directly here
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped with data:', data);
      // Navigation will be handled in your Routes component where navigation is available
    });
    
    // Clean up listeners on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
  
  return (
    <NavigationContainer>
      {/* Your app components */}
    </NavigationContainer>
  );
} 