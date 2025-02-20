import React, { createContext, useState, useEffect, useContext } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, database } from "../services/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext({});
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          // const userDocRef = doc(database, "admin", user.uid);
          const userDocRef = doc(database, "users", user.uid);
          const userSnapshot = await getDoc(userDocRef);

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data();
            await AsyncStorage.setItem("user", JSON.stringify(userData));
            setCurrentUser(userData);
          } else {
            console.log("No user document found in Firestore for this user.");
            setCurrentUser(null);
            await AsyncStorage.removeItem("user");
            // Optionally, redirect to the login screen if the user document is missing
          }
          setLoading(false);
        } catch (error) {
          console.error("Error getting user document:", error);
          setCurrentUser(null);
          await AsyncStorage.removeItem("user");
        }
      } else {
        setCurrentUser(null);
        await AsyncStorage.removeItem("user");
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    await signOut(auth);
    await AsyncStorage.removeItem("user");
    setCurrentUser(null);
  };

  const fetchCurrentUser = async () => {
    if (!auth.currentUser) return null;

    try {
      const userDocRef = doc(database, "users", auth.currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setCurrentUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  };

  const value = {
    currentUser,
    setCurrentUser,
    logout,
    loading,
    fetchCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
