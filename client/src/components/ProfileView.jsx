import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { mockBadges } from '../utils/mockData';

export default function ProfileView({ user }) {
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  const isCurrentUser = currentUser && user && currentUser.uid === user.uid;

  const renderBadges = () => {
    return (user?.badges || []).map((badgeId) => {
      const badge = mockBadges.find(b => b.id === badgeId);
      return (
        <View key={badgeId} style={styles.badge}>
          <Image 
            source={require('../../assets/images/badge-hero.png')}
            style={styles.badgeHero}
            resizeMode="contain"
          />
          <Image 
            source={badge.icon}
            style={styles.badgeIcon}
            resizeMode="contain"
          />
          <Text style={styles.badgeName}>{badge.name}</Text>
        </View>
      );
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* UPDATED HEADER ROW: Left corner displays settings (or challenge) and right corner displays level pill */}
      <View style={styles.headerRow}>
        <View style={styles.levelPill}>
          <Image 
            source={require('../../assets/images/medal.png')}
            style={styles.medalIconInPill}
            resizeMode="contain"
          />
          <Text style={styles.levelText}>Level {user?.level || 1}</Text>
        </View>
        {isCurrentUser && (
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            style={styles.avatar}
            source={{ uri: user?.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }}
          />
          <Text style={styles.username}>{user?.username}</Text>
        </View>
        {!isCurrentUser && (
          <TouchableOpacity 
            style={styles.challengeButton}
            onPress={() => navigation.navigate('Game', { challengedFriend: user })}
          >
            <View style={styles.optionContent}>
              <MaterialIcons name="flag" size={32} color="#ffc268" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Challenge</Text>
                <Text style={styles.optionDescription}>Issue a challenge</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
          </TouchableOpacity>
        )}
        
        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{user?.stats?.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{user?.stats?.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>
        </View>
      </View>

      {/* UPDATED Badges Section with Header Row */}
      <View style={styles.badgesSection}>
        <View style={styles.badgesHeaderRow}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BadgesList', { user })}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.badgesContainer}>
          {renderBadges()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7dbc63',
    paddingTop: 10,
  },
  /* UPDATED headerRow: space-between layout for mirrored corners */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  settingsButton: {
    padding: 8,
  },
  challengeButton: {
    width: '90%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#d2d2d2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
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
    shadowOpacity: 0.2,
    shadowRadius: 1.6,
    elevation: 1,
  },
  medalIconInPill: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  levelText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    alignItems: 'center',
    width: '80%',
    marginTop: 20,
  },
  statRow: {
    alignItems: 'center',
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
  /* UPDATED badges header row for mirroring */
  badgesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  badgesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  seeAllText: {
    color: '#fff',
    opacity: 0.9,
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badge: {
    backgroundColor: 'rgba(242, 174, 199, 0.1)',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    marginTop: 15,
  },
  badgeHero: {
    width: 30,
    height: 30,
    position: 'absolute',
    top: -15,
    alignSelf: 'center',
  },
  badgeIcon: {
    width: 70,
    height: 70,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f7a3a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#4f7a3a',
  },
}); 