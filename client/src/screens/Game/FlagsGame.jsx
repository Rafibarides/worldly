import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import flagsData from '../../utils/Flags.json';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { database } from '../../services/firebase';
import LivesModal from './LivesModal';
import HintModal from './HintModal';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function FlagsGame() {
  console.log('FlagsGame component mounted');
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  // Game state
  const [lives, setLives] = useState(4);
  const [score, setScore] = useState(0);
  const [currentFlag, setCurrentFlag] = useState('');
  const [currentCountryCode, setCurrentCountryCode] = useState('');
  const [correctCountry, setCorrectCountry] = useState('');
  const [options, setOptions] = useState([]);
  const [continentScores, setContinentScores] = useState({
    'Africa': 0,
    'Asia': 0,
    'Europe': 0,
    'North America': 0,
    'South America': 0,
    'Oceania': 0
  });
  const [currentContinent, setCurrentContinent] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add state for the warning modal
  const [warningModalVisible, setWarningModalVisible] = useState(false);
  
  // Add state to track which option is the correct answer
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  
  // Animation values
  const flagScale = useSharedValue(1);
  const optionScales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1)
  ];
  const livesContainerScale = useSharedValue(1);
  
  // Animation values for the warning modal hearts
  const heartScales = [
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1),
    useSharedValue(1)
  ];
  
  // Refs for tracking game progress
  const roundsPlayed = useRef(0);
  const continentsPlayed = useRef(new Set());

  // Add this state to track if the lives modal is visible
  const [livesModalVisible, setLivesModalVisible] = useState(false);

  // Add this state variable
  const [hintModalVisible, setHintModalVisible] = useState(false);

  // Get all country-flag pairs from all continents
  const getAllCountryFlagPairs = () => {
    const allPairs = [];
    Object.keys(flagsData).forEach(continent => {
      flagsData[continent].forEach(pair => {
        allPairs.push({
          country: pair[0],
          countryCode: pair[1],
          continent: continent
        });
      });
    });
    return allPairs;
  };

  // Shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // Select a random flag and generate options
  const generateRound = () => {
    // Get all country-flag pairs
    const allPairs = getAllCountryFlagPairs();
    
    // Select a random pair
    const randomIndex = Math.floor(Math.random() * allPairs.length);
    const selectedPair = allPairs[randomIndex];
    
    // Set the current flag, country code, and correct country
    setCurrentCountryCode(selectedPair.countryCode);
    setCurrentFlag(`https://flagcdn.com/w640/${selectedPair.countryCode.toLowerCase()}.png`);
    setCorrectCountry(selectedPair.country);
    setCurrentContinent(selectedPair.continent);
    
    // Generate options (1 correct + 3 incorrect)
    const incorrectOptions = allPairs
      .filter(pair => pair.country !== selectedPair.country)
      .map(pair => pair.country);
    
    // Select 3 random incorrect options
    const randomIncorrectOptions = shuffleArray(incorrectOptions).slice(0, 3);
    
    // Combine correct and incorrect options and shuffle
    const allOptions = shuffleArray([selectedPair.country, ...randomIncorrectOptions]);
    setOptions(allOptions);
    
    // Start animations
    flagScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1.1, { duration: 200 }),
      withTiming(1, { duration: 150 })
    );
    
    setIsLoading(false);
  };

  // Initialize the game
  useEffect(() => {
    generateRound();
  }, []);
  
  // Handle user selection
  const handleSelection = (selectedCountry) => {
    // Animate the selected option
    const optionIndex = options.indexOf(selectedCountry);
    if (optionIndex >= 0) {
      optionScales[optionIndex].value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 150 })
      );
    }
    
    // Show which answer is correct, regardless of user's choice
    setShowCorrectAnswer(true);
    
    if (selectedCountry === correctCountry) {
      // Correct answer
      setScore(prev => prev + 1);
      
      // Update continent score
      setContinentScores(prev => ({
        ...prev,
        [currentContinent]: prev[currentContinent] + 1
      }));
      
      // Track continents played
      continentsPlayed.current.add(currentContinent);
      
      // Generate new round after a short delay to let user see the green highlight
      setTimeout(() => {
        setShowCorrectAnswer(false); // Reset for next round
        roundsPlayed.current += 1;
        generateRound();
      }, 800); // Slightly longer delay to show the correct answer
    } else {
      // Incorrect answer
      setLives(prev => prev - 1);
      
      // Animate lives container
      livesContainerScale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      
      // Check if the user will have exactly 1 life left after this mistake
      if (lives === 2) {
        // Show the warning modal
        setWarningModalVisible(true);
        
        // Animate the hearts in the modal
        // First heart stays, others disappear with animation
        for (let i = 1; i < 4; i++) {
          heartScales[i].value = withDelay(
            500 + i * 300, // Stagger the animations
            withSequence(
              withTiming(1.3, { duration: 200, easing: Easing.ease }),
              withTiming(0, { duration: 300, easing: Easing.ease })
            )
          );
        }
      }
      
      // Check if game is over
      if (lives <= 1) {
        setTimeout(() => {
          handleGameOver();
        }, 800); // Longer delay to show the correct answer
      } else {
        // Generate new round with delay
        setTimeout(() => {
          setShowCorrectAnswer(false); // Reset for next round
          roundsPlayed.current += 1;
          generateRound();
        }, 800); // Longer delay to show the correct answer
      }
    }
  };
  
  // Handle game over and navigate to summary
  const handleGameOver = async () => {
    setGameOver(true);
    
    // Update the user's games played count in Firebase
    if (currentUser) {
      try {
        const userDocRef = doc(database, "users", currentUser.uid);
        await updateDoc(userDocRef, {
          "stats.gamesPlayed": increment(1)
        });
      } catch (error) {
        console.error("Error updating gamesPlayed:", error);
      }
    }
    
    // Create an empty array to store "guessed countries" for compatibility with GameSummaryScreen
    const guessedCountriesArray = [];
    
    // Navigate to game summary with compatible parameters
    navigation.replace("GameSummary", {
      result: "Completed",
      gameType: "flags",
      finalScore: score,
      // Add these parameters for compatibility with GameSummaryScreen
      totalCountries: 196, // Use standard total country count
      guessedCountries: guessedCountriesArray, // Empty array since this is a different game type
      // Include the flags-specific data as additional parameters
      flagsData: {
        totalRoundsPlayed: roundsPlayed.current,
        continentScores: continentScores,
        continentsPlayed: Array.from(continentsPlayed.current)
      }
    });
  };
  
  // Handle exit game
  const handleExitGame = () => {
    navigation.goBack();
  };

  // Create animated styles for the modal hearts
  const heartAnimatedStyles = heartScales.map(scale => 
    useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
        opacity: scale.value
      };
    })
  );

  // Animated styles
  const flagAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: flagScale.value }]
    };
  });
  
  const livesContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: livesContainerScale.value }]
    };
  });
  
  // Generate option animated styles
  const optionAnimatedStyles = optionScales.map(scale => 
    useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }]
      };
    })
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Flags Quiz...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#87c66b" }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={handleExitGame}
        >
          <MaterialIcons name="arrow-back-ios" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.score}>Score: {score}</Text>
        
        <TouchableOpacity onPress={() => setLivesModalVisible(true)}>
          <Animated.View style={[styles.livesContainer, livesContainerAnimatedStyle]}>
            {[...Array(4)].map((_, index) => (
              <MaterialIcons
                key={index}
                name="favorite"
                size={24}
                color={index < lives ? "#ffc268" : "#dfdfdf"}
                style={styles.heartIcon}
              />
            ))}
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.gameContainer}>
        <Text style={styles.questionText}>Which country has this flag?</Text>
        
        <Animated.View style={[styles.flagContainer, flagAnimatedStyle]}>
          <Image 
            source={{ uri: currentFlag }}
            style={styles.flagImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <AnimatedTouchableOpacity
              key={index}
              style={[
                styles.optionButton, 
                optionAnimatedStyles[index],
                showCorrectAnswer && option === correctCountry ? styles.correctOptionButton : null
              ]}
              onPress={() => handleSelection(option)}
            >
              <View style={styles.optionTextContainer}>
                <Text 
                  style={[
                    styles.optionText,
                    showCorrectAnswer && option === correctCountry ? styles.correctOptionText : null
                  ]}
                  numberOfLines={2}
                  adjustsFontSizeToFit={true}
                  minimumFontScale={0.7}
                >
                  {option}
                </Text>
              </View>
            </AnimatedTouchableOpacity>
          ))}
        </View>
      </View>

      {/* Warning Modal */}
      <Modal
        transparent={true}
        visible={warningModalVisible}
        animationType="fade"
        onRequestClose={() => setWarningModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContent}>
            <View style={styles.heartsContainer}>
              {[...Array(4)].map((_, index) => (
                <Animated.View 
                  key={index} 
                  style={[styles.heartContainer, heartAnimatedStyles[index]]}
                >
                  <MaterialIcons
                    name="favorite"
                    size={40}
                    color="#ffc268"
                  />
                </Animated.View>
              ))}
            </View>
            <Text style={styles.warningText}>One Life Remaining!</Text>
            <Text style={styles.warningSubtext}>Choose carefully!</Text>
            <TouchableOpacity
              style={styles.warningButton}
              onPress={() => setWarningModalVisible(false)}
            >
              <Text style={styles.warningButtonText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lives Modal */}
      <LivesModal
        visible={livesModalVisible}
        onClose={() => setLivesModalVisible(false)}
        lives={lives}
      />

      {/* Hint Button */}
      <View style={styles.hintButtonContainer}>
        <TouchableOpacity
          style={styles.hintButton}
          onPress={() => setHintModalVisible(true)}
        >
          <MaterialIcons name="lightbulb" size={24} color="#ffc268" />
        </TouchableOpacity>
      </View>

      {/* Hint Modal */}
      <HintModal
        visible={hintModalVisible}
        onClose={() => setHintModalVisible(false)}
        gameType="flags"
        hintData={{
          continent: currentContinent,
          flagUrl: `https://flagcdn.com/w320/${currentCountryCode.toLowerCase()}.png`
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#87c66b",
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  exitButton: {
    padding: 5,
  },
  score: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  livesContainer: {
    flexDirection: 'row',
  },
  heartIcon: {
    marginLeft: 5,
  },
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  flagContainer: {
    borderRadius: 20,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  flagImage: {
    width: 160,
    height: 100,
  },
  optionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: '48%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionTextContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#4f7a3a',
    fontWeight: '500',
    textAlign: 'center',
  },
  correctOptionButton: {
    backgroundColor: '#8dcc73',
    borderColor: '#fff',
    borderWidth: 2,
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningModalContent: {
    backgroundColor: '#87c66b',
    borderRadius: 20,
    padding: 25,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  heartsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'center',
  },
  heartContainer: {
    marginHorizontal: 5,
  },
  warningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  warningSubtext: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  warningButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f7a3a',
  },
  hintButtonContainer: {
    position: 'absolute',
    left: 20,
    bottom: 20,
  },
  hintButton: {
    backgroundColor: '#fff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
