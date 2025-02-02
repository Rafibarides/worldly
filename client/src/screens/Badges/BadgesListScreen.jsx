import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function BadgesListScreen() {
  // For development, we'll use the first mock user
  const currentUser = mockUsers[0];

  const renderBadges = () => {
    return currentUser.badges.map((badgeId) => {
      const badge = mockBadges.find(b => b.id === badgeId);
      return (
        <View key={badgeId} style={styles.badgeRow}>
          <View style={styles.badgeIconContainer}>
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
          </View>
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description || 'Achievement unlocked!'}</Text>
          </View>
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
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Your Badges</Text>
        <View style={styles.badgesList}>
          {renderBadges()}
        </View>
      </ScrollView>
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  badgesList: {
    gap: 15,
  },
  badgeRow: {
    flexDirection: 'row',
    backgroundColor: '#87c66b',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  badgeIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  badgeIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
}); 