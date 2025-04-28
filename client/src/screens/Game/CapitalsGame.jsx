import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Animated as RNAnimated, Alert } from 'react-native';
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
import capitalsData from '../../utils/Capitals.json';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { database } from '../../services/firebase';
import LivesModal from './LivesModal';
import HintModal from './HintModal';
import { Audio } from 'expo-av';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CapitalsGame() {
  console.log('CapitalsGame component mounted');
  const navigation = useNavigation();
  const { currentUser } = useAuth();
  
  // Game state
  const [lives, setLives] = useState(4);
  const [score, setScore] = useState(0);
  const [currentCapital, setCurrentCapital] = useState('');
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
  
  // Animation values
  const capitalScale = useSharedValue(1);
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

  // Add this state to track which option is the correct answer
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // Add this state to track if the lives modal is visible
  const [livesModalVisible, setLivesModalVisible] = useState(false);

  // Add this state variable
  const [hintModalVisible, setHintModalVisible] = useState(false);

  // Add state for toast message
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  
  // Animation value for toast
  const toastOpacity = useRef(new RNAnimated.Value(0)).current;

  // Add sound references
  const correctSound = useRef(null);
  const incorrectSound = useRef(null);

  // Get all country-capital pairs from all continents
  const getAllCountryCapitalPairs = () => {
    const allPairs = [];
    Object.keys(capitalsData).forEach(continent => {
      capitalsData[continent].forEach(pair => {
        allPairs.push({
          country: pair[0],
          capital: pair[1],
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

  // Select a random capital and generate options
  const generateRound = () => {
    // Get all country-capital pairs
    const allPairs = getAllCountryCapitalPairs();
    
    // Select a random pair
    const randomIndex = Math.floor(Math.random() * allPairs.length);
    const selectedPair = allPairs[randomIndex];
    
    // Set the current capital and correct country
    setCurrentCapital(selectedPair.capital);
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
    capitalScale.value = withSequence(
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
  
  // Load sound effects
  useEffect(() => {
    const loadSounds = async () => {
      try {
        const correctSoundObject = new Audio.Sound();
        const incorrectSoundObject = new Audio.Sound();
        
        await correctSoundObject.loadAsync(require('../../../assets/sound/correct.wav'));
        await incorrectSoundObject.loadAsync(require('../../../assets/sound/Incorrect.wav'));
        
        correctSound.current = correctSoundObject;
        incorrectSound.current = incorrectSoundObject;
      } catch (error) {
        console.error('Error loading sounds:', error);
      }
    };
    
    loadSounds();
    
    // Cleanup function to unload sounds when component unmounts
    return () => {
      const unloadSounds = async () => {
        if (correctSound.current) {
          await correctSound.current.unloadAsync();
        }
        if (incorrectSound.current) {
          await incorrectSound.current.unloadAsync();
        }
      };
      unloadSounds();
    };
  }, []); // Run only once on component mount

  // Handle user selection
  const handleSelection = async (selectedCountry) => {
    // Set the selected option to highlight it
    setSelectedOption(selectedCountry);
    
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
      // Correct answer - play sound
      if (correctSound.current) {
        try {
          await correctSound.current.replayAsync();
        } catch (error) {
          console.error('Error playing correct sound:', error);
        }
      }
      
      // Correct answer
      setScore(prev => prev + 1);
      
      // Show toast message
      setToastMessage("Correct!");
      setToastVisible(true);
      RNAnimated.sequence([
        RNAnimated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        RNAnimated.delay(1000),
        RNAnimated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => setToastVisible(false));
      
      // Update continent score
      setContinentScores(prev => ({
        ...prev,
        [currentContinent]: prev[currentContinent] + 1
      }));
      
      // Track continents played
      continentsPlayed.current.add(currentContinent);
      
      // Generate new round after a longer delay to let user see the feedback
      setTimeout(() => {
        setShowCorrectAnswer(false); // Reset for next round
        setSelectedOption(null); // Reset selected option
        roundsPlayed.current += 1;
        generateRound();
      }, 1500); // Longer delay to show the feedback
    } else {
      // Incorrect answer - play sound
      if (incorrectSound.current) {
        try {
          await incorrectSound.current.replayAsync();
        } catch (error) {
          console.error('Error playing incorrect sound:', error);
        }
      }
      
      // Incorrect answer
      setLives(prev => prev - 1);
      
      // Show toast message
      setToastMessage("Wrong answer!");
      setToastVisible(true);
      RNAnimated.sequence([
        RNAnimated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        RNAnimated.delay(1000),
        RNAnimated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => setToastVisible(false));
      
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
        }, 1500); // Longer delay to show the feedback
      } else {
        // Generate new round with delay
        setTimeout(() => {
          setShowCorrectAnswer(false); // Reset for next round
          setSelectedOption(null); // Reset selected option
          roundsPlayed.current += 1;
          generateRound();
        }, 1500); // Longer delay to show the feedback
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
      gameType: "capitals",
      finalScore: score,
      // Add these parameters for compatibility with GameSummaryScreen
      totalCountries: 196, // Use standard total country count
      guessedCountries: guessedCountriesArray, // Empty array since this is a different game type
      // Include the capitals-specific data as additional parameters
      capitalsData: {
        totalRoundsPlayed: roundsPlayed.current,
        continentScores: continentScores,
        continentsPlayed: Array.from(continentsPlayed.current)
      }
    });
  };
  
  // Handle exit game
  const handleExitGame = () => {
    Alert.alert(
      "Exit Game",
      "Are you sure you want to exit? Your progress will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Exit", 
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Game' }],
            });
          },
          style: "destructive"
        }
      ]
    );
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
  const capitalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: capitalScale.value }]
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
        <Text style={styles.loadingText}>Loading Capitals Quiz...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#87c66b" }]}>
      {/* Toast Message */}
      {toastVisible && (
        <RNAnimated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </RNAnimated.View>
      )}
      
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
        <Animated.Text style={[styles.capitalText, capitalAnimatedStyle]}>
          {currentCapital}
        </Animated.Text>
        
        <Text style={styles.questionText}>is the capital of</Text>
        
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <AnimatedTouchableOpacity
              key={index}
              style={[
                styles.optionButton, 
                optionAnimatedStyles[index],
                showCorrectAnswer && option === correctCountry ? styles.correctOptionButton : null,
                showCorrectAnswer && option === selectedOption && option !== correctCountry ? styles.incorrectOptionButton : null,
              ]}
              onPress={() => handleSelection(option)}
            >
              <View style={styles.optionTextContainer}>
                <Text 
                  style={[
                    styles.optionText,
                    showCorrectAnswer && option === correctCountry ? styles.correctOptionText : null,
                    showCorrectAnswer && option === selectedOption && option !== correctCountry ? styles.incorrectOptionText : null,
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
        gameType="capitals"
        hintData={{
          continent: currentContinent
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
    marginBottom: 40,
    textAlign: 'center',
  },
  capitalText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
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
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  correctOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  incorrectOptionButton: {
    backgroundColor: '#ff6b6b',
    borderColor: '#fff',
    borderWidth: 2,
  },
  incorrectOptionText: {
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
  toastContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    zIndex: 1000,
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
