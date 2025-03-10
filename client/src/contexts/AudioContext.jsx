import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AudioContext = createContext();

export function useAudio() {
  return useContext(AudioContext);
}

export function AudioProvider({ children }) {
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preferences when the app starts
  useEffect(() => {
    const loadAudioPreferences = async () => {
      try {
        const savedMusicPreference = await AsyncStorage.getItem('musicEnabled');
        // Only update if we have a saved preference
        if (savedMusicPreference !== null) {
          setMusicEnabled(savedMusicPreference === 'true');
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading audio preferences:', error);
        setIsLoaded(true);
      }
    };

    loadAudioPreferences();
  }, []);

  // Save preferences when they change
  const toggleMusic = async (value) => {
    try {
      setMusicEnabled(value);
      await AsyncStorage.setItem('musicEnabled', value.toString());
    } catch (error) {
      console.error('Error saving music preference:', error);
    }
  };

  const value = {
    musicEnabled,
    toggleMusic,
    isLoaded
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
} 