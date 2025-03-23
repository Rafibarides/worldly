import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import Constants from 'expo-constants';

// Retrieve Expo configuration from Constants.
// Use Constants.manifest for older versions; if it's null, fallback to Constants.expoConfig.
const expoConfig = Constants.manifest || Constants.expoConfig;
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} = (expoConfig && expoConfig.extra) || {};

// Optional check (you can remove this in production)
if (!FIREBASE_API_KEY) {
  console.error("Firebase configuration is missing. Please check your app.json 'extra' settings.");
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const database = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Ensure the FIREBASE_PROJECT_ID is wordly-app-b86b5
console.log('Using Firebase project:', expoConfig.extra.FIREBASE_PROJECT_ID);