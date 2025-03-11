import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';
import ProfileView from '../../components/ProfileView';
import React, { useState, useEffect, useCallback } from 'react';
import { updateDoc, doc } from "firebase/firestore";
import calculateLevel from "../../utils/leveling";
import { database } from "../../services/firebase";

// For development, we'll use the first mock user
// const currentUser = mockUsers[0];

// If not already defined, create an animated version of LinearGradient:
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen({ navigation }) {
  const { currentUser, fetchCurrentUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh data whenever the HomeScreen gains focus using a navigation listener
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      await fetchCurrentUser();
    });
    return unsubscribe;
  }, [navigation, fetchCurrentUser]);

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentUser();
    setRefreshing(false);
  };

  // NEW: Check and update the user's level on screen load (or whenever currentUser changes)
  useEffect(() => {
    if (currentUser && currentUser.stats) {
      const newLevel = calculateLevel(currentUser.stats.gamesPlayed);
      // Read current level from the top-level field, defaulting to 1 if not set.
      const currentLevel = currentUser.level || 1;
      if (newLevel > currentLevel) {
        updateDoc(doc(database, "users", currentUser.uid), {
          level: newLevel
        })
        .then(() => {
          console.log(`User level updated from ${currentLevel} to ${newLevel}`);
        })
        .catch((error) => {
          console.error("Error updating user level:", error);
        });
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#70ab51" />
      </View>
    );
  }

  return (
    <AnimatedLinearGradient
      colors={['#70ab51', '#7dbc63', '#70ab51']}
      locations={[0, 0.5, 0.06]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 0.06, y: 0.5 }}
      style={styles.container}
    >
      {/* Wrap the content in a ScrollView with pull-to-refresh */}
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ProfileView 
          user={currentUser} 
          isCurrentUser={true}
        />
        {/* Other HomeScreen content can follow here */}
      </ScrollView>
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 60,
  },
  settingsButton: {
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statCard: {
    backgroundColor: 'rgba(177, 216, 138, 0.1)',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    marginTop: 20,
  },
  statRow: {
    paddingVertical: 10,
    width: '100%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  statDivider: {
    height: 1,
    width: '90%',
    backgroundColor: 'rgba(177, 216, 138, 0.3)',
    marginVertical: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  badgesSection: {
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 25,
  },
  seeAllText: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  badge: {
    backgroundColor: '#87c66b',
    width: 140,
    height: 180,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    padding: 10,
    marginTop: 20,
  },
  badgeHero: {
    width: 30,
    height: 30,
    position: 'absolute',
    top: -11,
    alignSelf: 'center',
  },
  badgeIcon: {
    width: 120,
    height: 120,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 0,
  },
  noBadgesText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
    marginBottom: 0,
  },
  challengeButton: {
    backgroundColor: 'rgba(177, 216, 138, 1)', // Theme color
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 25,
    margin: 20,
    gap: 10,
  },
  challengeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: '#75b35b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.4 },
    shadowOpacity: 0,
    shadowRadius: 1.6,
    elevation: 1,
  },
  medalIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 8,
  },
  levelText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
}); 