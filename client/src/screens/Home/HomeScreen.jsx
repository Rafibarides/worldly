import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useAuth } from '../../contexts/AuthContext';

// For development, we'll use the first mock user
// const currentUser = mockUsers[0];

// If not already defined, create an animated version of LinearGradient:
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function HomeScreen({ navigation }) {
  const { currentUser } = useAuth();

  const renderBadges = () => {
    return currentUser?.badges?.map((badgeId) => {
      const badge = mockBadges?.find(b => b.id === badgeId);
      return (
            <View key={badgeId} style={styles.badge}>
              <Image
                source={require('../../../assets/images/badge-hero.png')}
                style={styles.badgeHero}
                resizeMode="contain"
              />
              <Image
                source={badge?.icon}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
              <Text style={styles.badgeName}>{badge?.name}</Text>
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
          {/* Level Pill */}
          <View style={styles.levelPill}>
            <Image
              style={styles.medalIcon}
              source={require('../../../assets/images/medal.png')}
            />
            <Text style={styles.levelText}>Level: {currentUser.level}</Text>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ProfileSettings')}
          >
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>🌍</Text>
          <Text style={styles.username}>{currentUser?.username}</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{currentUser?.stats?.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <View style={styles.statContent}>
              <Text style={styles.statNumber}>{currentUser?.stats?.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
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
        {currentUser.badges ? (
          <ScrollView
            horizontal={true}
            contentContainerStyle={styles.badgesContainer}
            showsHorizontalScrollIndicator={false}
          >
            {renderBadges()}
          </ScrollView>
        ) : (
          <Text style={styles.noBadgesText}>No badges to show</Text>
        )}
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
    paddingTop: 60,
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
    fontSize: 60,
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
    paddingHorizontal: 10,
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
    shadowOpacity: 0.20,
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