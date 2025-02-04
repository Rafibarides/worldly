import React, { createContext, useState, useEffect, useContext } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, database } from '../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("User from onAuthStateChanged:", user); // Debugging here
      if (user) {
        try {
          const userDocRef = doc(database, "admin", user.uid);
          const userSnapshot = await getDoc(userDocRef);
  
          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
          } else {
            console.log("No user document found in Firestore for this user.");
            setCurrentUser(null);
            await AsyncStorage.removeItem('user');
            // Optionally, redirect to the login screen if the user document is missing
          }
        } catch (error) {
          console.error("Error getting user document:", error);
          setCurrentUser(null);
          await AsyncStorage.removeItem('user');
        }
      } else {
        setCurrentUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });
  
    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('user');
    setCurrentUser(null);
  };

  const value = { currentUser, setCurrentUser, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
