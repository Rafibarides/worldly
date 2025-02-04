import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDID6GE-_GroY_fRg4awrXBF-pM-WhHDSM",
  authDomain: "wordly-app-b86b5.firebaseapp.com",
  projectId: "wordly-app-b86b5",
  storageBucket: "wordly-app-b86b5.firebasestorage.app",
  messagingSenderId: "481611040058",
  appId: "1:481611040058:web:8bbb367c5cdcdc3a867c03",
  measurementId: "G-52FNWMTV0Q"
};

const app = initializeApp(firebaseConfig);
initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const database = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);