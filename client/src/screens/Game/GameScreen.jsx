import { useState } from 'react';
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

export default function GameScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);

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
        <ActivityIndicator size="large" color="rgba(177, 216, 138, 1)" />
        <Text style={styles.loadingText}>Setting up your game...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Start a New Game</Text>
        <Text style={styles.subtitle}>Choose your game mode</Text>
      </View>

      {/* Solo Game Option */}
      <TouchableOpacity 
        style={styles.gameOption}
        onPress={handleStartSoloGame}
      >
        <View style={styles.optionContent}>
          <MaterialIcons name="person" size={32} color="rgba(177, 216, 138, 1)" />
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Solo Game</Text>
            <Text style={styles.optionDescription}>
              Test your geography knowledge against the clock
            </Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} color="#666" />
      </TouchableOpacity>

      {/* Multiplayer Game Option */}
      <TouchableOpacity 
        style={styles.gameOption}
        onPress={handleStartMultiplayerGame}
      >
        <View style={styles.optionContent}>
          <MaterialIcons name="groups" size={32} color="rgba(177, 216, 138, 1)" />
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Multiplayer Game</Text>
            <Text style={styles.optionDescription}>
              Compete with {mockGameSettings.minPlayersForMultiplayer}-{mockGameSettings.maxPlayersForMultiplayer} players in real-time
            </Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={24} color="#666" />
      </TouchableOpacity>

      {/* Game Settings Info */}
      <View style={styles.settingsInfo}>
        <Text style={styles.settingsTitle}>Game Settings</Text>
        <View style={styles.settingItem}>
          <MaterialIcons name="timer" size={20} color="#666" />
          <Text style={styles.settingText}>
            Time Limit: {mockGameSettings.timeLimit / 60} minutes
          </Text>
        </View>
        <View style={styles.settingItem}>
          <MaterialIcons name="emoji-events" size={20} color="#666" />
          <Text style={styles.settingText}>
            Points per correct guess: {mockGameSettings.pointsPerCorrectGuess}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  gameOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingsInfo: {
    padding: 20,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  settingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
}); 