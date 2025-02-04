import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockUsers, mockBadges } from '../../utils/mockData';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function BadgesListScreen() {
  const navigation = useNavigation();
  const currentUser = mockUsers[0];

  const renderBadges = () => {
    return currentUser.badges.map((badgeId) => {
      const badge = mockBadges.find(b => b.id === badgeId);
      return (
        <View key={badgeId} style={styles.badgeRow}>
          <Image 
            source={require('../../../assets/images/badge-hero.png')}
            style={styles.badgeHero}
            resizeMode="contain"
          />
          <View style={styles.badgeIconContainer}>
            <Image 
              source={badge.icon}
              style={styles.badgeIcon}
              resizeMode="contain"
            />
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
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="keyboard-arrow-left" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('ProfileSettings')}
        >
          <MaterialIcons name="more-vert" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
    marginTop: 60,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
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
    marginTop: 15,
  },
  badgeIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  badgeIcon: {
    width: 60,
    height: 60,
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 8,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  badgeHero: {
    width: 30,
    height: 30,
    position: 'absolute',
    top: -15,
    left: 40,
  },
}); 