import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { database } from '../services/firebase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';

export default function RejoinChallengeButton() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation values
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  
  // Set up the animations
  useEffect(() => {
    if (hasActiveChallenge) {
      // Subtle opacity pulsing
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
      
      // Subtle scale pulsing
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
    }
  }, [hasActiveChallenge]);
  
  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    };
  });

  // Check for active challenges when the component mounts
  useEffect(() => {
    const checkForActiveChallenge = async () => {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const challengesRef = collection(database, 'challenges');
        
        // Create two queries - one for challenges where the user is challenger, one where the user is challenged
        const challengerQuery = query(
          challengesRef,
          where('challengerId', '==', currentUser.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const challengedQuery = query(
          challengesRef,
          where('challengedId', '==', currentUser.uid),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        
        const [challengerSnapshot, challengedSnapshot] = await Promise.all([
          getDocs(challengerQuery),
          getDocs(challengedQuery)
        ]);
        
        // Check if either query returned results
        const hasChallenge = !challengerSnapshot.empty || !challengedSnapshot.empty;
        console.log("Active challenge found:", hasChallenge);
        setHasActiveChallenge(hasChallenge);
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking for active challenges:", error);
        setIsLoading(false);
      }
    };

    checkForActiveChallenge();
    
    // Set up a timer to periodically check for active challenges
    const intervalId = setInterval(checkForActiveChallenge, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleRejoinChallenge = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Current User ID:", currentUser.uid);

      const challengesRef = collection(database, 'challenges');
      
      // Create two queries - one for challenges where the user is challenger, one where the user is challenged.
      const challengerQuery = query(
        challengesRef,
        where('challengerId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const challengedQuery = query(
        challengesRef,
        where('challengedId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const [challengerSnapshot, challengedSnapshot] = await Promise.all([
        getDocs(challengerQuery),
        getDocs(challengedQuery)
      ]);
      const allChallenges = [];
      challengerSnapshot.forEach(doc => {
         allChallenges.push({ id: doc.id, ...doc.data() });
      });
      challengedSnapshot.forEach(doc => {
         allChallenges.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending.
      allChallenges.sort((a, b) => {
         const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
         const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
         return bTime - aTime;
      });
      
      if (allChallenges.length > 0) {
        // Take the most recent active challenge.
        const mostRecentChallenge = allChallenges[0];
        console.log("Rejoining challenge:", mostRecentChallenge.id);
        navigation.navigate('GamePlay', {
          challengeId: mostRecentChallenge.id,
          gameId: mostRecentChallenge.gameId,
          gameType: 'multiplayer',
        });
      } else {
        Alert.alert('No Active Challenges', 'You don\'t have any active challenges to rejoin.');
        setHasActiveChallenge(false);
      }
    } catch (error) {
      console.error("Error rejoining challenge:", error);
      Alert.alert('Error', 'Failed to rejoin challenge. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only render the button if there's an active challenge
  if (isLoading) {
    return <ActivityIndicator size="small" color="#ffc268" />;
  }
  
  if (!hasActiveChallenge) {
    return null;
  }

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity style={styles.button} onPress={handleRejoinChallenge}>
        <Text style={styles.buttonText}>Rejoin Active Game</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#ffc268',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 