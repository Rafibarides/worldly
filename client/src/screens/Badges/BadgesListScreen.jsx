import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Badge from '../../components/Badge/Badge';
import { useAuth } from '../../contexts/AuthContext';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function BadgesListScreen() {
  const navigation = useNavigation();
  const { currentUser } = useAuth();

  // Define a static list of the 6 continent badges for display
  const staticBadges = [
    { id: "Africa", name: "Africa", description: "Complete all countries in Africa", type: "Africa" },
    { id: "South America", name: "South America", description: "Complete all countries in South America", type: "South America" },
    { id: "Oceania", name: "Oceania", description: "Complete all countries in Oceania", type: "Oceania" },
    { id: "Asia", name: "Asia", description: "Complete all countries in Asia", type: "Asia" },
    { id: "Europe", name: "Europe", description: "Complete all countries in Europe", type: "Europe" },
    { id: "North America", name: "North America", description: "Complete all countries in North America", type: "North America" },
  ];

  // Set the badges state with the static array
  const [badges] = useState(staticBadges);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);
  
  const renderBadges = () => {
    return badges.map((badge) => {
      return (
        <TouchableOpacity 
          key={badge.id} 
          style={styles.badgeRow}
          onPress={() => {
            setSelectedBadgeId(badge.id);
            setBadgeModalVisible(true);
          }}
        >
          <Image 
            source={require('../../../assets/images/badge-hero.png')}
            style={styles.badgeHero}
            resizeMode="contain"
          />
          <View style={styles.badgeIconContainer}>
            <Image 
              source={getBadgeIcon(badge.type || badge.id)}
              style={styles.badgeIcon}
              resizeMode="contain"
            />
          </View>
          <View style={styles.badgeInfo}>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeDescription}>{badge.description || 'Achievement unlocked!'}</Text>
          </View>
        </TouchableOpacity>
      );
    });
  };
  
  const getBadgeIcon = (badgeType) => {
    switch(badgeType) {
      case "Africa":
        return require('../../../assets/images/badges/africa.png');
      case "South America":
        return require('../../../assets/images/badges/south-america.png');
      case "Oceania":
        return require('../../../assets/images/badges/australia.png');
      case "Asia":
        return require('../../../assets/images/badges/asia.png');
      case "Europe":
        return require('../../../assets/images/badges/europe.png');
      case "North America":
        return require('../../../assets/images/badges/north-america.png');
      case "worldExplorer":
      case "speedDemon":
        return require('../../../assets/images/badges/australia.png');
      case "perfectScore":
      default:
        return require('../../../assets/images/badges/australia.png');
    }
  };

  return (
    <AnimatedLinearGradient
      colors={['#70ab51', '#7dbc63', '#70ab51']}
      locations={[0, 0.5, 0.06]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 0.06, y: 0.5 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Badges</Text>
      </View>
      <ScrollView contentContainerStyle={styles.badgesContainer}>
        {renderBadges()}
      </ScrollView>

      <Badge 
        visible={badgeModalVisible}
        onClose={() => setBadgeModalVisible(false)}
        initialBadgeId={selectedBadgeId}
      />
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  badgesContainer: {
    gap: 15,
    width: '90%',
    alignSelf: 'center',
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