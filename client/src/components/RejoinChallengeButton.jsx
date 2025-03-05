import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { database } from '../services/firebase';

// This component assumes you have access to the current user (for example, via context)
export default function RejoinChallengeButton({ currentUser }) {
  const navigation = useNavigation();

  const handleRejoinChallenge = async () => {
    try {
      console.log("🔍 Current User ID:", currentUser.uid);

      const challengesRef = collection(database, 'challenges');
      
      // Create two queries - one for challenges where user is challenger, one where user is challenged
      const challengerQuery = query(
        challengesRef,
        where('challengerId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const challengedQuery = query(
        challengesRef,
        where('challengedId', '==', currentUser.uid),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      // Execute both queries
      const [challengerSnapshot, challengedSnapshot] = await Promise.all([
        getDocs(challengerQuery),
        getDocs(challengedQuery)
      ]);
      
      // Combine results from both queries
      const allChallenges = [];
      challengerSnapshot.forEach(doc => {
        allChallenges.push({ id: doc.id, ...doc.data() });
      });
      
      challengedSnapshot.forEach(doc => {
        allChallenges.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort all challenges by createdAt (most recent first)
      allChallenges.sort((a, b) => {
        // Handle Firestore timestamps
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
      
      console.log("Found active challenges:", allChallenges.length);
      
      if (allChallenges.length > 0) {
        // Take the most recent active challenge
        const mostRecentChallenge = allChallenges[0];
        console.log("Rejoining challenge:", mostRecentChallenge.id);
        
        // Navigate to the GamePlay screen with the existing challenge
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

  return (
    <TouchableOpacity onPress={handleRejoinChallenge} style={{ padding: 12, backgroundColor: '#7dbc63', borderRadius: 8 }}>
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Rejoin Game</Text>
    </TouchableOpacity>
  );
} 