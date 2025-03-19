import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import countriesByContinent from '../../utils/countries_by_continent.json';
import Animated, { FadeIn } from 'react-native-reanimated';
import { collection, getDocs } from 'firebase/firestore';
import { database } from '../../services/firebase';

const { width, height } = Dimensions.get('window');

export default function Badge({ visible, onClose, initialBadgeId }) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    // Fetch badges from Firestore instead of using mock data
    const fetchBadges = async () => {
      const continentBadges = [];
      
      // Define continent badges with their icons
      const continentBadgeTypes = [
        { id: "Africa", name: "Africa", icon: require('../../../assets/images/badges/africa.png') },
        { id: "South America", name: "South America", icon: require('../../../assets/images/badges/south-america.png') },
        { id: "Oceania", name: "Oceania", icon: require('../../../assets/images/badges/australia.png') },
        { id: "Asia", name: "Asia", icon: require('../../../assets/images/badges/asia.png') },
        { id: "Europe", name: "Europe", icon: require('../../../assets/images/badges/europe.png') },
        { id: "North America", name: "North America", icon: require('../../../assets/images/badges/north-america.png') }
      ];
      
      // Filter to only include continent badges
      continentBadgeTypes.forEach(badge => {
        if (Object.keys(countriesByContinent).includes(badge.name)) {
          continentBadges.push(badge);
        }
      });
      
      setBadges(continentBadges);
      
      // Set initial badge if provided
      if (initialBadgeId) {
        const index = continentBadges.findIndex(badge => badge.id === initialBadgeId);
        if (index !== -1) {
          setCurrentBadgeIndex(index);
        }
      }
    };
    
    fetchBadges();
  }, [initialBadgeId]);

  const currentBadge = badges[currentBadgeIndex];

  const handleNext = () => {
    setCurrentBadgeIndex((prevIndex) => 
      prevIndex === badges.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevious = () => {
    setCurrentBadgeIndex((prevIndex) => 
      prevIndex === 0 ? badges.length - 1 : prevIndex - 1
    );
  };

  if (!visible || !currentBadge) return null;

  // Get countries for the current continent
  const countries = countriesByContinent[currentBadge.name] || [];

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.badgeCard}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Animated.View
            key={`header-${currentBadge.id}`}
            entering={FadeIn.delay(100)}
            style={styles.badgeHeader}
          >
            <View style={styles.iconContainer}>
              <Image 
                source={currentBadge.icon}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.badgeTitle}>{currentBadge.name}</Text>
            <Text style={styles.badgeDescription}>
              {currentBadge.description || `Collect countries in ${currentBadge.name}`}
            </Text>
          </Animated.View>
          
          <Animated.View
            key={`countries-${currentBadge.id}`}
            entering={FadeIn.delay(200)}
            style={styles.countriesWrapper}
          >
            <Text style={styles.countriesTitle}>
              Countries in {currentBadge.name}:
            </Text>
            <ScrollView style={styles.countriesContainer}>
              <View style={styles.countriesList}>
                {countries.map((country, index) => (
                  <Text key={index} style={styles.countryItem}>
                    • {country}
                  </Text>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
          
          <Animated.View
            key={`navigation-${currentBadge.id}`}
            entering={FadeIn.delay(300)}
            style={styles.navigationContainer}
          >
            <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
              <MaterialIcons name="chevron-left" size={30} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.badgeCounter}>
              {currentBadgeIndex + 1} / {badges.length}
            </Text>
            
            <TouchableOpacity style={styles.navButton} onPress={handleNext}>
              <MaterialIcons name="chevron-right" size={30} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
          
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCard: {
    backgroundColor: '#73b355',
    borderRadius: 20,
    width: '85%',
    height: height * 0.6,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    justifyContent: 'space-between',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  badgeHeader: {
    alignItems: 'center',
    width: '100%',
    height: '30%',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeIcon: {
    width: 80,
    height: 80,
    marginTop: 10,
  },
  badgeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  badgeDescription: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  countriesWrapper: {
    width: '100%',
    height: '50%',
  },
  countriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  countriesContainer: {
    width: '100%',
  },
  countriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  countryItem: {
    color: '#fff',
    fontSize: 12,
    width: '50%',
    paddingVertical: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '10%',
  },
  navButton: {
    padding: 5,
  },
  badgeCounter: {
    color: '#fff',
    fontSize: 16,
  },
}); 