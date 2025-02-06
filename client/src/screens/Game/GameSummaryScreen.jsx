import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  withSequence,
  withSpring,
  withRepeat
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
// Import the countries_by_continent file for a canonical list per continent
import countriesByContinent from '../../utils/countries_by_continent.json';
// Import the country helpers for normalization and territory matching
import { normalizeCountryName, getTerritoryMatch } from '../../utils/countryHelpers';
// NEW: Import Firestore update functions and database
import { updateDoc, increment, doc } from 'firebase/firestore';
import { database } from '../../services/firebase';
// NEW: Import the auth context to get currentUser and setCurrentUser
import { useAuth } from '../../contexts/AuthContext';
import calculateLevel from '../../utils/leveling';  // <-- New import for leveling

/**
 * Displays a summary of the solo game:
 * - Score: number of correctly guessed countries
 * - Total possible countries (example: 169, 196, or recognizedCountries.length)
 * - A button to return to the Home screen (or any other route).
 */
export default function GameSummaryScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // These are passed from GamePlayScreen when the game ends;
  // guessedCountries should be an array of normalized strings.
  const { finalScore, totalCountries, guessedCountries = [] } = route.params || {};

  // Fixed totals for each continent as provided:
  const fixedContinentTotals = {
    "Africa": 54,
    "Asia": 48,
    "Europe": 45,
    "North America": 23,
    "South America": 12,
    "Oceania": 14
  };

  const continentPercentages = {};

  // Add console logging in the summary screen to help debug the passed-in data:
  useEffect(() => {
    console.log('GameSummaryScreen mounted.');
    console.log('finalScore:', finalScore);
    console.log('totalCountries:', totalCountries);
    console.log('guessedCountries:', guessedCountries);
  }, []);

  // Iterate over each continent in the fixed totals.
  Object.keys(fixedContinentTotals).forEach(continent => {
    // Get the country's canonical list from the JSON file (if available)
    const countryList = countriesByContinent[continent] || [];
    const continentCanonical = countryList.map(country =>
      normalizeCountryName(country)
    );

    // Use a Set to avoid counting duplicates.
    const guessedSet = new Set();

    guessedCountries.forEach(guess => {
      const normGuess = normalizeCountryName(guess);
      // If the guess belongs directly to the continent list, add it.
      if (continentCanonical.includes(normGuess)) {
        guessedSet.add(normGuess);
      } else {
        // Otherwise, check if the guess is a territory.
        const territory = getTerritoryMatch(guess);
        if (territory) {
          const normTerritory = normalizeCountryName(territory);
          if (continentCanonical.includes(normTerritory)) {
            guessedSet.add(normTerritory);
          }
        }
      }
    });

    const guessedCount = guessedSet.size;
    const total = fixedContinentTotals[continent];
    // Use Math.floor so that 2/12 results in about 16% (16.67 -> 16)
    const percentage = Math.floor((guessedCount / total) * 100);

    // After we compute each continent's percentage, log out the computed result:
    console.log(`[${continent}] guessedCount: ${guessedCount}, total: ${total}, rawPercentage: ${(guessedCount / total) * 100}`);
    continentPercentages[continent] = isNaN(percentage) ? 0 : percentage;
  });

  // NEW: Get current user and setCurrentUser from the Auth context
  const { currentUser, setCurrentUser, fetchCurrentUser } = useAuth();

  // NEW: When the summary screen mounts, update the user document for each continent at 100%
  useEffect(() => {
    if (!currentUser) return;
    const updateContinentsTracked = async () => {
      for (const continent of Object.keys(continentPercentages)) {
        if (continentPercentages[continent] === 100) {
          try {
            await updateDoc(doc(database, 'users', currentUser.uid), {
              // Using Firestore dot notation to update the specific continent count
              [`continentsTracked.${continent}`]: increment(1)
            });
            console.log(`Incremented ${continent} count for user ${currentUser.uid}`);
          } catch (error) {
            console.error(`Error updating ${continent}:`, error);
          }
        }
      }
    };
    updateContinentsTracked();
  }, [currentUser]);

  // NEW: Leveling system update.
  // This hook checks the user's gamesPlayed and recalculates their level.
  // If the calculated level is higher than the current user.level, we update it in Firestore.
  useEffect(() => {
    async function objectiveLevelCheck() {
      // Ensure that we have a valid user and stats.
      if (!currentUser || !currentUser.stats) return;
      // Fetch the most recent user data
      const latestUser = await fetchCurrentUser();
      // Calculate correct level based on the latest gamesPlayed count
      const newLevel = calculateLevel(latestUser.stats.gamesPlayed);
      // If the objective check finds the level is lower than what's implied by gamesPlayed, update Firestore and local state.
      if (newLevel > latestUser.level) {
        try {
          await updateDoc(doc(database, 'users', latestUser.uid), { level: newLevel });
          setCurrentUser({ ...latestUser, level: newLevel });
          console.log(`Objective level check: User ${latestUser.uid} updated to level ${newLevel}`);
        } catch (error) {
          console.error("Objective level check failed: ", error);
        }
      } else {
        console.log("Objective level check: No update needed");
      }
    }
    objectiveLevelCheck();
  }, []); // Run once on mount

  // Animate the overall container: fade in + slight scale effect.
  const containerOpacity = useSharedValue(0);
  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 500 });
  }, []);
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ scale: containerOpacity.value }]
    };
  });

  // Animate the back button separately.
  const buttonOpacity = useSharedValue(0);
  const buttonPressScale = useSharedValue(1);

  useEffect(() => {
    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonOpacity.value * buttonPressScale.value }]
    };
  });

  // Create an animated version of TouchableOpacity
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  // AnimatedCard component for the continent cards.
  const AnimatedCard = ({ children, delay, isHighest, index, totalCards }) => {
    const cardOpacity = useSharedValue(0);
    const cardPressScale = useSharedValue(1);
    const starsScale = useSharedValue(0);
    // Added shared value for continuous bobbing
    const starsBobbing = useSharedValue(0);

    // Calculate background opacity based on position
    // First card (index 0) will have opacity 1, last card will have opacity 0.15
    const backgroundOpacity = 1 - (index * 0.60) / (totalCards - 1);

    useEffect(() => {
      cardOpacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
      
      if (isHighest) {
        starsScale.value = withDelay(delay + 200, withSequence(
          withSpring(1.3, { 
            damping: 4,
            stiffness: 80,
          }),
          withSpring(1, {
            damping: 6,
            stiffness: 100,
          })
        ));
        // Start continuous bobbing animation for the stars graphic
        starsBobbing.value = withRepeat(
          withSequence(
            withTiming(-4, { duration: 800 }),
            withTiming(0, { duration: 800 })
          ),
          -1,
          true
        );
      }
    }, []);

    const cardAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: cardOpacity.value,
        transform: [{ scale: cardOpacity.value * cardPressScale.value }]
      };
    });

    // Updated starsAnimatedStyle to include the bobbing translation
    const starsAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: starsScale.value },
          { translateY: starsBobbing.value }
        ],
        opacity: starsScale.value,
      };
    });

    return (
      <TouchableWithoutFeedback
        onPressIn={() => {
          cardPressScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withTiming(1, { duration: 100 })
          );
        }}
      >
        <Animated.View style={[
          styles.card,
          { backgroundColor: `rgba(135, 198, 107, ${backgroundOpacity})` },
          isHighest && styles.highestCard,
          cardAnimatedStyle
        ]}>
          {children}
          {isHighest && (
            <Animated.Image 
              source={require('../../../assets/images/stars.png')}
              style={[styles.stars, starsAnimatedStyle]}
            />
          )}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  // Right before rendering, log the final continentPercentages:
  console.log('continentPercentages:', continentPercentages);

  // Create an animated version of LinearGradient
  const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

  // Add medal bounce animation
  const medalScale = useSharedValue(0);
  const medalRotate = useSharedValue(0);

  useEffect(() => {
    // Start the medal animation after a slight delay
    medalScale.value = withDelay(300, withSequence(
      withSpring(1.3, { 
        damping: 4,
        stiffness: 80,
      }),
      withSpring(1, {
        damping: 6,
        stiffness: 100,
      })
    ));

    // Add a subtle rotation effect
    medalRotate.value = withDelay(300, withSequence(
      withSpring(-0.2, { 
        damping: 4,
        stiffness: 80,
      }),
      withSpring(0, {
        damping: 6,
        stiffness: 100,
      })
    ));
  }, []);

  const medalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: medalScale.value },
        { rotate: `${medalRotate.value}rad` }
      ]
    };
  });

  // Sort continents by percentage before rendering
  const sortedContinents = Object.entries(continentPercentages)
    .sort(([, percentageA], [, percentageB]) => percentageB - percentageA)
    .map(([continent]) => continent);

  // NEW: When the summary screen loses focus, reset navigation to the game selection screen.
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      console.log('GameSummaryScreen lost focus. Resetting navigation to Game selection screen.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Game' }],
      });
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <AnimatedLinearGradient 
      colors={['#70ab51', '#7dbc63', '#70ab51']}
      locations={[0, 0.5, 0.06]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 0.06, y: 0.5 }}
      style={[styles.container, containerAnimatedStyle]}
    >
      <View style={styles.contentContainer}>
        <View style={styles.titlePill}>
          <Animated.Image 
            source={require('../../../assets/images/medal.png')} 
            style={[styles.medalIcon, medalAnimatedStyle]} 
          />
          <Text style={styles.titleText}>Game Review</Text>
        </View>
        <Text style={styles.scoreText}>
          Total: {finalScore} / {totalCountries} countries
        </Text>
        {/* Cards Container for Continent Breakdown */}
        <View style={styles.cardsContainer}>
          {sortedContinents.map((continent, index) => (
            <AnimatedCard 
              key={continent} 
              delay={index * 100}
              isHighest={index === 0}
              index={index}
              totalCards={sortedContinents.length}
            >
              <Text style={styles.cardTitle}>{continent}</Text>
              <Text style={styles.cardPercentage}>
                {continentPercentages[continent]}%
              </Text>
            </AnimatedCard>
          ))}
        </View>
        {/* Animated Button for navigating back to game selection */}
        <AnimatedTouchableOpacity
          style={[styles.button, buttonAnimatedStyle]}
          onPressIn={() => {
            buttonPressScale.value = withSequence(
              withTiming(1.2, { duration: 100 }),
              withTiming(1, { duration: 100 })
            );
          }}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: 'Game' }],
            })
          }
        >
          <View style={styles.backButtonContent}>
            <MaterialIcons 
              name="arrow-back-ios" 
              size={24} 
              color="#ffc268" 
              style={styles.buttonIcon} 
            />
            <Text style={styles.buttonText}>Back to Game Selection</Text>
          </View>
        </AnimatedTouchableOpacity>
      </View>
    </AnimatedLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40,
  },
  titlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7dbc63',
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderColor: '#ffffff',
    borderRadius: 50,
    marginBottom: 5,
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  medalIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  scoreText: {
    fontSize: 16,
    marginBottom: 40,
    color: '#fff',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 0,
  },
  // Updated styles for the continent cards for a 3-column layout:
  cardsContainer: {
    width: '100%', // Ensure container takes full width
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Distribute cards evenly across rows
    marginVertical: 20,
  },
  card: {
    width: '30%',
    height: 100,
    backgroundColor: '#87c66b',
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  highestCard: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    elevation: 8, // for Android
    backgroundColor: '#8fcf6e', // slightly lighter green to complement the glow
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#fff',
  },
  button: {
    width: '90%',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#d2d2d2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f7a3a',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 10,
  },
  stars: {
    width: 32,
    height: 32,
    position: 'absolute',
    top: -8,
    right: -8,
  },
}); 