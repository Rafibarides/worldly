import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

// For development, we'll use the first mock user
const currentUser = mockUsers[0];

// If not already defined, create an animated version of LinearGradient:
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen({ navigation }) {
  const renderBadges = () => {
    return currentUser.badges.map((badgeId) => {
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
    <AnimatedLinearGradient 
      colors={['#70ab51', '#7dbc63', '#70ab51']}
      locations={[0, 0.5, 0.06]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 0.06, y: 0.5 }}
      style={styles.container}
    >
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <MaterialIcons name="settings" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🌍</Text>
          <Text style={styles.username}>{currentUser.username}</Text>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentUser.stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentUser.stats.gamesWon}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentUser.stats.totalCountriesGuessed}</Text>
            <Text style={styles.statLabel}>Countries</Text>
          </View>
        </View>
      </View>

      {/* Badges Section */}
      <View style={styles.badgesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BadgesList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal={true}
          contentContainerStyle={styles.badgesContainer}
          showsHorizontalScrollIndicator={false}
        >
          {renderBadges()}
        </ScrollView>
      </View>

      {/* Challenge Button */}
      {/* <TouchableOpacity 
        style={styles.challengeButton}
        onPress={() => navigation.navigate('Game')}
      >
        <MaterialIcons name="flag" size={24} color="white" />
        <Text style={styles.challengeButtonText}>Start New Game</Text>
      </TouchableOpacity> */}
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
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 174, 199, 0.1)', // Theme color with opacity
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
    backgroundColor: 'rgba(177, 216, 138, 0.1)', // Theme color with opacity
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 100,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(177, 216, 138, 1)', // Theme color
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
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
  },
  seeAllText: {
    color: '#ffffff',
    opacity: 0.9,
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  badge: {
    backgroundColor: '#87c66b', // Updated background color
    width: 120,                // Fixed width
    height: 140,              // Fixed height (slightly taller)
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',  // Center children vertically
    margin: 10,                // Optional margin for spacing
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 5,
    color: '#fff',      // Set icon text to white
  },
  badgeName: {
    fontSize: 12,
    textAlign: 'center',
    color: '#fff',       // Set badge name text to white
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
}); 