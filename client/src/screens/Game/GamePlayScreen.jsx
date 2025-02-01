import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue,
  withSpring,
  runOnJS,
  Easing,
  Layout
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import MapView from '../../components/MapView';
import worldData from '../../../assets/geojson/ne_50m_admin_0_countries.json';
import { feature } from 'topojson-client';
import { normalizeCountryName, getTerritoriesForCountry, getTerritoryMatch } from '../../utils/countryHelpers';

let geoJSON;
if (worldData.type === 'Topology') {
  geoJSON = feature(worldData, worldData.objects.ne_50m_admin_0_countries);
} else {
  geoJSON = worldData;
}
const filteredWorldData = {
  ...geoJSON,
  features: geoJSON.features.filter(
    (feat) => feat.properties && feat.properties.NAME !== 'Antarctica'
  ),
};

const AnimatedView = Animated.createAnimatedComponent(View);

export default function GamePlayScreen({ route, navigation }) {
  const { gameType, settings } = route.params;
  const [timeLeft, setTimeLeft] = useState(settings.timeLimit);
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [guessedCountries, setGuessedCountries] = useState([]);

  // Timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const mapContainerStyle = {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  };

  const handleTextChange = (text) => {
    setGuess(text);
    
    if (text.trim()) {
      const normalizedGuess = normalizeCountryName(text);
      
      // Find the matched country - case insensitive matching
      const matchedFeature = filteredWorldData.features.find(
        (feat) => {
          const featureName = feat.properties.NAME;
          return featureName === normalizedGuess || 
                 featureName.toLowerCase() === normalizedGuess.toLowerCase();
        }
      );

      if (matchedFeature) {
        const countryName = matchedFeature.properties.NAME;
        const normalizedCountryName = countryName.toLowerCase();
        const alreadyGuessed = guessedCountries.includes(normalizedCountryName);

        if (!alreadyGuessed) {
          // Get territories for this country
          const territories = getTerritoriesForCountry(normalizedCountryName);
          
          // Add both the country and its territories to guessed countries
          setGuessedCountries(prev => [...prev, normalizedCountryName, ...territories]);
          setScore(prev => prev + 10);
          setGuess('');
        }
      } else {
        // Check if it's a territory
        const sovereignCountry = getTerritoryMatch(normalizedGuess);
        if (sovereignCountry && !guessedCountries.includes(sovereignCountry)) {
          // If it's a territory and its sovereign country hasn't been guessed,
          // we don't count it as a correct guess
          console.log('Territory found but sovereign country not guessed yet:', sovereignCountry);
        }
      }
    }
  };

  const handleGameEnd = () => {
    navigation.replace('GameSummary', {
      score,
      guessedCountries,
      gameType
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: 60 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Exit Button */}
      <TouchableOpacity 
        style={styles.exitButton}
        onPress={() => {
          Alert.alert(
            "Exit Game",
            "Are you sure you want to exit? Your progress will be lost.",
            [
              { text: "Cancel", style: "cancel" },
              { 
                text: "Exit", 
                style: "destructive",
                onPress: () => navigation.navigate('Game')
              }
            ]
          );
        }}
      >
        <MaterialIcons name="arrow-back-ios" size={24} color="#666" />
      </TouchableOpacity>

      {/* Timer and Score */}
      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <MaterialIcons name="timer" size={24} color="#666" />
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>
        <Text style={styles.score}>Score: {score}</Text>
      </View>

      {/* Animated Map Container */}
      <AnimatedView 
        style={[{ flex: 1 }, mapContainerStyle]}
      >
        <MapView guessedCountries={guessedCountries} />
      </AnimatedView>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="Enter country name..."
          value={guess}
          onChangeText={handleTextChange}
          autoCapitalize="none"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#666',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgba(177, 216, 138, 1)',
  },
  inputSection: {
    padding: 20,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  exitButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
  },
}); 