import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { currentUser } = useAuth();
  const route = useRoute();
  // Use the passed-in friend data if available; otherwise default to currentUser.
  const displayedUser = route.params?.profileUser || currentUser;

  const renderBadges = () => {
    return (displayedUser.badges || []).map((badgeId) => {
      const badge = mockBadges.find(b => b.id === badgeId);
      return (
        <View key={badgeId} style={styles.badge}>
          <Image 
            source={require('../../../assets/images/badge-hero.png')}
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
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image 
            style={styles.avatar}
            source={{ uri: displayedUser.photoURL || 'https://example.com/default-pic.png' }}
          />
          <Text style={styles.username}>{displayedUser.username}</Text>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{displayedUser.stats.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{displayedUser.stats.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <Text style={styles.sectionTitle}>Badges</Text>
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
    backgroundColor: '#fff',
    paddingTop: 60,
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
  badgesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
}); 