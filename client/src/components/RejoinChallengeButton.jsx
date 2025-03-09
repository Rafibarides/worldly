import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { database } from '../services/firebase';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';

// This component assumes you have access to the current user (for example, via context)
export default function RejoinChallengeButton({ currentUser }) {
  const navigation = useNavigation();

  // NEW: Create an animated version of TouchableOpacity
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  // NEW: State to track whether an active challenge exists for the current user.
  const [hasActiveChallenge, setHasActiveChallenge] = useState(false);

  // NEW: Shared value to control the "breathing" animation
  const scale = useSharedValue(1);

  // NEW: Start the repeated animation (oscillating scale from 1 to 1.05) on mount.
  useEffect(() => {
    scale.value = withRepeat(withTiming(1.05, { duration: 1500 }), -1, true);
  }, [scale]);

  // NEW: Animated style for the breathing effect.
  // Opacity interpolates so that when scale=1 it is 0.8 and when scale=1.05 it is 1.0.
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = ((scale.value - 1) / 0.05) * 0.2 + 0.8;
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity,
    };
  });

  // NEW: Check for any active challenges where the user is either the challenger or challenged.
  useEffect(() => {
    if (!currentUser) return;
    
    const challengesRef = collection(database, 'challenges');
    const challengerQuery = query(
      challengesRef,
      where('challengerId', '==', currentUser.uid),
      where('status', '==', 'active')
    );
    const challengedQuery = query(
      challengesRef,
      where('challengedId', '==', currentUser.uid),
      where('status', '==', 'active')
    );
    
    Promise.all([getDocs(challengerQuery), getDocs(challengedQuery)])
      .then(([challengerSnapshot, challengedSnapshot]) => {
        if (!challengerSnapshot.empty || !challengedSnapshot.empty) {
          setHasActiveChallenge(true);
        } else {
          setHasActiveChallenge(false);
        }
      })
      .catch((error) => {
        console.error("Error checking active challenges:", error);
        setHasActiveChallenge(false);
      });
  }, [currentUser]);

  const handleRejoinChallenge = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Error rejoining challenge:', error);
      Alert.alert('Error', 'There was a problem trying to rejoin the challenge. Please try again.');
    }
  };

  // Conditionally render the button only if an active challenge exists.
  if (!hasActiveChallenge) return null;

  return (
    // Use the AnimatedTouchableOpacity with the added animatedStyle to create the breathing effect.
    <AnimatedTouchableOpacity onPress={handleRejoinChallenge} style={[{ padding: 12, backgroundColor: '#7dbc63', borderRadius: 8 }, animatedStyle]}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Rejoin Game</Text>
    </AnimatedTouchableOpacity>
  );
} 