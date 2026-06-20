import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth as authApi, getTokens } from "../services/api";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On launch: if we have a stored session, load the user from the API.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken, refreshToken } = await getTokens();
        if (!accessToken && !refreshToken) return;
        const { user } = await authApi.me();
        if (active && user) {
          setCurrentUser(user);
          await AsyncStorage.setItem("user", JSON.stringify(user));
        }
      } catch (err) {
        // Token invalid/expired and refresh failed — start signed out.
        await authApi.logOut();
        await AsyncStorage.removeItem("user");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await authApi.logOut();
    await AsyncStorage.removeItem("user");
    setCurrentUser(null);
  };

  // Re-fetch the current user from the API (used after profile/stat changes).
  const fetchCurrentUser = async () => {
    try {
      const { user } = await authApi.me();
      if (user) {
        setCurrentUser(user);
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }
      return user;
    } catch (err) {
      return null;
    }
  };

  const value = { currentUser, setCurrentUser, logout, loading, fetchCurrentUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
