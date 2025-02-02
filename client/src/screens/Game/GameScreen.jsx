import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { mockGameSettings } from '../../utils/mockData';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withDelay
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function GameScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

  const headerFade = useSharedValue(1);

  useEffect(() => {
    headerFade.value = withRepeat(
      withTiming(0.85, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const soloOptionAnim = useSharedValue(0);
  const multiOptionAnim = useSharedValue(0);

  useEffect(() => {
    soloOptionAnim.value = withDelay(500, withTiming(1, { duration: 500 }));
    multiOptionAnim.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerFade.value,
    };
  });

  const animatedSoloOptionStyle = useAnimatedStyle(() => {
    return {
      opacity: soloOptionAnim.value,
      transform: [{ translateY: (1 - soloOptionAnim.value) * 20 }],
    };
  });

  const animatedMultiOptionStyle = useAnimatedStyle(() => {
    return {
      opacity: multiOptionAnim.value,
      transform: [{ translateY: (1 - multiOptionAnim.value) * 20 }],
    };
  });

  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const handleStartSoloGame = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('GamePlay', { 
        gameType: 'solo',
        settings: mockGameSettings.difficultyLevels.medium
      });
    }, 500);
  };

  const handleStartMultiplayerGame = () => {
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('GamePlay', {
        gameType: 'multiplayer',
        settings: mockGameSettings.difficultyLevels.medium
      });
    }, 500);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Setting up your game...</Text>
      </View>
    );
  }

  return (
    <LinearGradient 
      colors={['#70ab51', '#7dbc63', '#70ab51']}
      locations={[0, 0.5, 0.06]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 0.06, y: 0.5 }}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Animated.Text style={[styles.title, animatedHeaderStyle]}>
            Start a New Game
          </Animated.Text>
        </View>

        {/* Solo Game Option */}
        <AnimatedTouchableOpacity 
          style={[styles.gameOption, animatedSoloOptionStyle]}
          onPress={handleStartSoloGame}
        >
          <View style={styles.optionContent}>
            <MaterialIcons name="person" size={32} color="#ffc268" />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Solo Game</Text>
              <Text style={styles.optionDescription}>Timed</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
        </AnimatedTouchableOpacity>

        {/* Multiplayer Game Option */}
        <AnimatedTouchableOpacity 
          style={[styles.gameOption, animatedMultiOptionStyle]}
          onPress={handleStartMultiplayerGame}
        >
          <View style={styles.optionContent}>
            <MaterialIcons name="groups" size={32} color="#ffc268" />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Multiplayer Game</Text>
              <Text style={styles.optionDescription}>Compete with friends</Text>
            </View>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
        </AnimatedTouchableOpacity>

        {/* Game Settings Info */}
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsTitle}>Game Settings</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="timer" size={20} color="#fff" />
            </View>
            <Text style={styles.settingText}>
              Time Limit: {mockGameSettings.timeLimit / 60} minutes
            </Text>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="emoji-events" size={20} color="#fff" />
            </View>
            <Text style={styles.settingText}>
              Points per correct guess: {mockGameSettings.pointsPerCorrectGuess}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(177, 216, 138, 1)',
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  gameOption: {
    width: '90%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f7a3a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#4f7a3a',
  },
  settingsInfo: {
    padding: 20,
    alignItems: 'center',
    width: '90%',
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  settingIcon: {
    width: 30,
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
}); 