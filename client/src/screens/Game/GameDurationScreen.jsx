import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function GameDurationScreen({ route, navigation }) {
  // Get parameters passed from the previous screen
  const gameType = route.params?.gameType || 'solo';
  const settings = route.params?.settings || {};

  // Animation values for each card
  const card1Opacity = useSharedValue(0);
  const card2Opacity = useSharedValue(0);
  const card3Opacity = useSharedValue(0);
  const card4Opacity = useSharedValue(0);

  // Start animations when component mounts
  useEffect(() => {
    const baseDelay = 300;
    card1Opacity.value = withDelay(baseDelay, withTiming(1, { duration: 500 }));
    card2Opacity.value = withDelay(baseDelay + 100, withTiming(1, { duration: 500 }));
    card3Opacity.value = withDelay(baseDelay + 200, withTiming(1, { duration: 500 }));
    card4Opacity.value = withDelay(baseDelay + 300, withTiming(1, { duration: 500 }));
  }, []);

  // Create animated styles
  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: (1 - card1Opacity.value) * 20 }]
  }));
  
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: (1 - card2Opacity.value) * 20 }]
  }));
  
  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateY: (1 - card3Opacity.value) * 20 }]
  }));
  
  const card4Style = useAnimatedStyle(() => ({
    opacity: card4Opacity.value,
    transform: [{ translateY: (1 - card4Opacity.value) * 20 }]
  }));

  const handleDurationSelect = (minutes) => {
    // Convert minutes to seconds
    const durationInSeconds = minutes * 60;
    
    // Navigate to gameplay screen with the selected duration
    navigation.navigate("GamePlay", {
      gameType: "solo",
      duration: durationInSeconds
    });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Game Duration</Text>
        </View>
        
        <View style={styles.cardsContainer}>
          <View style={styles.row}>
            <AnimatedTouchableOpacity
              style={[styles.durationCard, card1Style]}
              onPress={() => handleDurationSelect(2)}
            >
              <Text style={styles.durationLabel}>Quick Game</Text>
              <Text style={styles.durationMinutes}>2</Text>
              <Text style={styles.durationLabel}>minutes</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={[styles.durationCard, card2Style]}
              onPress={() => handleDurationSelect(5)}
            >
              <Text style={styles.durationLabel}>Short Game</Text>
              <Text style={styles.durationMinutes}>5</Text>
              <Text style={styles.durationLabel}>minutes</Text>
            </AnimatedTouchableOpacity>
          </View>
          
          <View style={styles.row}>
            <AnimatedTouchableOpacity
              style={[styles.durationCard, card3Style]}
              onPress={() => handleDurationSelect(10)}
            >
              <Text style={styles.durationLabel}>Medium Game</Text>
              <Text style={styles.durationMinutes}>10</Text>
              <Text style={styles.durationLabel}>minutes</Text>
            </AnimatedTouchableOpacity>

            <AnimatedTouchableOpacity
              style={[styles.durationCard, card4Style]}
              onPress={() => handleDurationSelect(15)}
            >
              <Text style={styles.durationLabel}>Full Game</Text>
              <Text style={styles.durationMinutes}>15</Text>
              <Text style={styles.durationLabel}>minutes</Text>
            </AnimatedTouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87c66b', // Solid green used throughout the app
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20
  },
  durationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    width: '45%',
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  durationMinutes: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffc268'  // Yellow color used throughout the app
  },
  durationLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  }
}); 