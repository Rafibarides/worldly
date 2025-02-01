import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';

export default function ProfileScreen({ route }) {
  const { userId } = route.params;
  const user = mockUsers.find(u => u.id === userId);

  const renderBadges = () => {
    return user.badges.map((badgeId) => {
      const badge = mockBadges.find(b => b.id === badgeId);
      return (
        <View key={badgeId} style={styles.badge}>
          <Text style={styles.badgeIcon}>{badge.icon}</Text>
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
          <Text style={styles.avatar}>🌍</Text>
          <Text style={styles.username}>{user.username}</Text>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.stats.gamesWon}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{user.stats.totalCountriesGuessed}</Text>
            <Text style={styles.statLabel}>Countries</Text>
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
  },
  profileSection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(242, 205, 215, 0.3)',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    fontSize: 60,
    marginBottom: 10,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  statCard: {
    backgroundColor: 'rgba(177, 216, 138, 0.1)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(177, 216, 138, 1)',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
}); 