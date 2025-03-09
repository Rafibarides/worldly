import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { mockBadges } from '../../utils/mockData';
import Badge from '../../components/Badge/Badge';

// Create an animated version of LinearGradient:
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function BadgesListScreen({ navigation }) {
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);

  const renderBadgesList = () => {
    return mockBadges.map((badge) => (
      <TouchableOpacity 
        key={badge.id} 
        style={styles.badgeItem}
        onPress={() => {
          setSelectedBadgeId(badge.id);
          setBadgeModalVisible(true);
        }}
      >
        <Image source={badge.icon} style={styles.badgeItemIcon} />
        <Text style={styles.badgeItemName}>{badge.name}</Text>
      </TouchableOpacity>
    ));
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
      <ScrollView contentContainerStyle={styles.badgesListContainer}>
         {renderBadgesList()}
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
  },
  header: {
     flexDirection: 'row',
     alignItems: 'center',
     padding: 20,
  },
  backButton: {
     marginRight: 10,
  },
  headerTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#fff',
  },
  badgesListContainer: {
     padding: 20,
  },
  badgeItem: {
    backgroundColor: '#87c66b',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  badgeItemIcon: {
    width: 32,
    height: 32,
    marginRight: 15,
    color: '#fff',
  },
  badgeItemName: {
    fontSize: 18,
    color: '#fff',
  },
}); 