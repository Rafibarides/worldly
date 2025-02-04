import { useState, useRef, useEffect } from 'react';
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
  Layout,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import MapView from '../../components/MapView';
import worldData from '../../../assets/geojson/ne_50m_admin_0_countries.json';
import { feature } from 'topojson-client';
import { normalizeCountryName, getTerritoriesForCountry, getTerritoryMatch } from '../../utils/countryHelpers';
import recognizedCountries from '../../utils/recognized_countries.json';

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

// Insert this block to add South Sudan if it's missing in the geoJSON
if (!filteredWorldData.features.some(feat => feat.properties.NAME.toLowerCase() === 's. sudan')) {
  filteredWorldData.features.push({
    type: "Feature",
    properties: {
      NAME: "S. Sudan"
    },
    geometry: {
      type: "Polygon",
      // Note: These coordinates are a placeholder.
      // Replace with accurate coordinates for South Sudan if available.
      coordinates: [[
        [32.0, 4.0],
        [35.0, 4.0],
        [35.0, 11.0],
        [32.0, 11.0],
        [32.0, 4.0]
      ]]
    }
  });
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function GamePlayScreen({ route, navigation }) {
  const { gameType, settings } = route.params;

  // Temporarily override to 30 seconds for testing:
  const [timeLeft, setTimeLeft] = useState(60);  

  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [guessedCountries, setGuessedCountries] = useState([]);
  const guessedCountriesRef = useRef(guessedCountries);
  useEffect(() => {
    guessedCountriesRef.current = guessedCountries;
  }, [guessedCountries]);
  
  // Create a ref for the score so we always have the latest value
  const scoreRef = useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const scoreScale = useSharedValue(1);
  const inputShake = useSharedValue(0);
  const toastOpacity = useSharedValue(0);
  const toastTranslate = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => {
            handleGameEnd();
          }, 0);
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
    backgroundColor: '#49b3f5'
  };

  const animateScore = () => {
    scoreScale.value = withSequence(
      withSpring(1.2, { damping: 2, stiffness: 80 }),
      withSpring(1, { damping: 2, stiffness: 80 })
    );
  };

  const scoreAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scoreScale.value }]
    };
  });

  const shakeInput = () => {
    inputShake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 100 }),
      withTiming(-10, { duration: 100 }),
      withTiming(10, { duration: 100 }),
      withTiming(0, { duration: 50 })
    );
  };

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: inputShake.value }]
    };
  });

  const toastAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: toastOpacity.value,
      transform: [{ translateY: toastTranslate.value }]
    };
  });

  const showToast = () => {
    toastOpacity.value = 0;
    toastTranslate.value = 0;
    
    toastOpacity.value = withSequence(
      withSpring(1, { damping: 12, stiffness: 100 }),
      withDelay(500, withSpring(0, { damping: 12, stiffness: 100 }))
    );
    
    toastTranslate.value = withSpring(-50, {
      damping: 12,
      stiffness: 80,
      mass: 0.5
    });
  };

  const handleTextChange = (text) => {
    setGuess(text);
    
    if (text.trim()) {
      const normalizedGuess = normalizeCountryName(text);
      
      const matchedFeature = filteredWorldData.features.find(
        (feat) => {
          const featureName = feat.properties.NAME;
          return featureName === normalizedGuess || 
                 featureName.toLowerCase() === normalizedGuess.toLowerCase();
        }
      );

      if (matchedFeature) {
        const countryName = matchedFeature.properties.NAME;
        const normalizedCountryName = normalizeCountryName(countryName);
        const alreadyGuessed = guessedCountries.includes(normalizedCountryName);

        if (!alreadyGuessed) {
          const territories = getTerritoriesForCountry(normalizedCountryName);
          
          setGuessedCountries(prev => [...prev, normalizedCountryName, ...territories]);
          
          const isRecognized = recognizedCountries.recognized_countries.some(recCountry =>
            normalizeCountryName(recCountry) === normalizedGuess
          );
          if (isRecognized) {
            setScore(prev => prev + 1);
            animateScore();
          }
          
          setGuess('');
        } else {
          shakeInput();
          showToast();
        }
      } else {
        // If no matched feature is found, check if the country is recognized on its own.
        const isRecognized = recognizedCountries.recognized_countries.some(recCountry =>
          normalizeCountryName(recCountry) === normalizedGuess
        );
        if (isRecognized && !guessedCountries.includes(normalizedGuess)) {
          // Even without a map feature, treat this recognized country as a valid guess.
          setGuessedCountries(prev => [...prev, normalizedGuess]);
          setScore(prev => prev + 1);
          animateScore();
          setGuess('');
        } else {
          const sovereignCountry = getTerritoryMatch(normalizedGuess);
          if (sovereignCountry && !guessedCountries.includes(sovereignCountry)) {
            console.log('Territory found but sovereign country not guessed yet:', sovereignCountry);
          }
        }
      }
    }
  };

  const handleGameEnd = () => {
    if (gameType === 'solo') {
      navigation.replace('GameSummary', {
        finalScore: scoreRef.current,
        totalCountries: recognizedCountries.recognized_countries.length,
        guessedCountries: guessedCountriesRef.current,
      });
    } else {
      console.log('Multiplayer end game logic goes here.');
    }
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

      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <MaterialIcons name="timer" size={24} color="#666" />
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>
        <AnimatedText style={[styles.score, scoreAnimatedStyle]}>
          {score}/196
        </AnimatedText>
      </View>

      <Animated.View style={[styles.toastWrapper, toastAnimatedStyle]}>
        <Text style={styles.toastText}>- Already Guessed</Text>
      </Animated.View>

      <AnimatedView 
        style={[{ flex: 1 }, mapContainerStyle]}
      >
        <MapView guessedCountries={guessedCountries} />
      </AnimatedView>

      <View style={styles.inputSection}>
        <AnimatedTextInput
          style={[styles.input, inputAnimatedStyle]}
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
  toastWrapper: {
    position: 'absolute',
    right: 30,
    top: '45%',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 196, 0, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toastText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
}); 