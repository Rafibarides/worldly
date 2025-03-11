import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Image, BackHandler } from 'react-native';
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
import { updateDoc, increment, doc, setDoc, onSnapshot, collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { database } from '../../services/firebase';
// NEW: Import the auth context to get currentUser and setCurrentUser
import { useAuth } from '../../contexts/AuthContext';
import calculateLevel from '../../utils/leveling';  // <-- New import for leveling
// Global flag to ensure that a multiplayer win is only updated once per gameId
let globalGameWinUpdateFlags = {};
import RejoinChallengeButton from '../../components/RejoinChallengeButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Displays a summary of the solo game:
 * - Score: number of correctly guessed countries
 * - Total possible countries (example: 169, 196, or recognizedCountries.length)
 * - A button to return to the Home screen (or any other route).
 */
export default function GameSummaryScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  // Add result to the destructured params
  const { 
    finalScore, 
    totalCountries, 
    guessedCountries = [], 
    gameType,
    result, // "Winner", "Loser", or "Tied"
    opponentScore,
    gameId,         // Added gameId to access the game identifier in multiplayer mode
    opponent        // Added opponent to access opponent data
  } = route.params || {};

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

  // Override hardware back button to prevent "GO_BACK" warnings
  useEffect(() => {
    const backAction = () => {
      // Returning true disables the default back action
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
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

    // Check if all countries are guessed (or very close due to floating point precision)
    const rawPercentage = (guessedCount / total) * 100;
    const percentage = guessedCount === total ? 100 : Math.floor(rawPercentage);

    // After we compute each continent's percentage, log out the computed result:
    console.log(`[${continent}] guessedCount: ${guessedCount}, total: ${total}, rawPercentage: ${rawPercentage}, finalPercentage: ${percentage}`);
    continentPercentages[continent] = isNaN(percentage) ? 0 : percentage;

    // Inside the forEach loop for continents, add this before calculating percentages:
    console.log(`[${continent}] Normalized continent countries:`, continentCanonical);
    console.log(`[${continent}] Normalized guessed countries:`, [...guessedCountries].map(g => normalizeCountryName(g)));

    // After the guessedCountries.forEach loop, add this to see which countries weren't matched:
    if (continent === "North America") {
      const missingCountries = continentCanonical.filter(country => 
        ![...guessedSet].some(guessed => guessed === country)
      );
      console.log(`[${continent}] Missing countries:`, missingCountries);
    }
  });

  // NEW: Get current user and setCurrentUser from the Auth context
  const { currentUser, setCurrentUser, fetchCurrentUser } = useAuth();
  // Define friendIds based on currentUser's friends list (default to empty array if not defined)
  const friendIds = currentUser?.friends || [];
  // Add state for friendship statuses
  const [friendshipStatuses, setFriendshipStatuses] = useState({});

  // Add this ref at the component level, outside any hooks
  const hasProcessedContinents = useRef(false);

  // Then in the useEffect:
  useEffect(() => {
    if (!currentUser) return;
    
    const updateContinentsTracked = async () => {
      // Only run once per component mount
      if (hasProcessedContinents.current) return;
      hasProcessedContinents.current = true;
      
      const updates = {};
      for (const continent of Object.keys(continentPercentages)) {
        if (continentPercentages[continent] === 100) {
          // Collect all updates in a single object
          updates[`continentsTracked.${continent}`] = increment(1);
        }
      }
      
      // Only make a single Firestore call with all updates
      if (Object.keys(updates).length > 0) {
        try {
          await updateDoc(doc(database, 'users', currentUser.uid), updates);
        } catch (error) {
          console.error(`Error updating continents:`, error);
        }
      }
    };
    
    updateContinentsTracked();
  }, [currentUser, continentPercentages]); // Include necessary dependencies

  // NEW: Leveling system update.
  // This hook checks the user's gamesPlayed and recalculates their level.
  // If the calculated level is higher than the current user's level, we update it in Firestore.
  useEffect(() => {
    async function objectiveLevelCheck() {
      // Ensure that we have a valid user and stats.
      if (!currentUser || !currentUser.stats) return;
      // Fetch the most recent user data
      const latestUser = await fetchCurrentUser();
      // Calculate correct level based on the latest gamesPlayed count
      const newLevel = calculateLevel(latestUser.stats.gamesPlayed);
      // Ensure we default to level 1 if no level is specified
      const currentLevel = latestUser.stats?.level || 1;
      // If new level should be higher than the current level, update "stats.level" in Firestore and local state.
      if (newLevel > currentLevel) {
        try {
          // Update the nested stats field for level
          await updateDoc(doc(database, 'users', latestUser.uid), { "stats.level": newLevel });
          setCurrentUser({
            ...latestUser,
            stats: { ...latestUser.stats, level: newLevel },
          });
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

  // Add styles for the result banner
  const getResultStyle = () => {
    switch(result) {
      case "Winner":
        return styles.winnerBanner;
      case "Loser":
        return styles.loserBanner;
      case "Tied":
        return styles.tieBanner;
      default:
        return {};
    }
  };

  // Increment gamesPlayed for both solo and multiplayer games
  useEffect(() => {
    if (gameType === 'solo' || gameType === 'multiplayer') {
      updateDoc(doc(database, 'users', currentUser.uid), {
        "stats.gamesPlayed": increment(1)
      });
    }
  }, [gameType]);

  // NEW: Increment gamesWon for multiplayer games when the user wins.
  // Use a global flag object keyed by gameId to ensure that the update is executed only once per game.
  useEffect(() => {
    console.log("gamesWon effect check:", { 
      gameType, 
      result, 
      currentUserId: currentUser?.uid, 
      gameId, 
      updateFlag: globalGameWinUpdateFlags[gameId]
    });
    if (
      gameType === 'multiplayer' &&
      currentUser &&
      gameId &&
      result &&
      result.toLowerCase().trim() === 'winner' &&
      !globalGameWinUpdateFlags[gameId]
    ) {
      // Set the global flag for the current gameId immediately to prevent multiple increments.
      globalGameWinUpdateFlags[gameId] = true;
      updateDoc(doc(database, 'users', currentUser.uid), {
        "stats.gamesWon": increment(1)
      })
      .then(() => {
        console.log(`Incremented gamesWon for user ${currentUser.uid} for gameId ${gameId}`);
      })
      .catch((error) => {
        console.error("Error updating gamesWon:", error);
      });
    }
  }, [gameType, result, currentUser, gameId]);

  // NEW: Presence handling using Firestore with heartbeat for robust offline detection
  useEffect(() => {
    if (gameType !== 'multiplayer' || !gameId || !currentUser || !opponent) return;
    
    const presenceDocRef = doc(database, 'gamePresences', gameId);
    
    // Helper function to update the current user's presence (with heartbeat)
    const updatePresence = () => {
      setDoc(
        presenceDocRef,
        { [currentUser.uid]: { online: true, lastActive: Date.now() } },
        { merge: true }
      );
    };
    
    // Set initial presence
    updatePresence();
    
    // Set an interval to update the lastActive timestamp every 5 seconds
    const intervalId = setInterval(() => {
      updatePresence();
    }, 5000);
    
    // Listen to changes in the presence document for the opponent's status
    const unsubscribe = onSnapshot(presenceDocRef, (snapshot) => {
      const data = snapshot.data();
      if (data && data[opponent.uid]) {
        const { online, lastActive } = data[opponent.uid];
        const threshold = 7000; // 7 seconds threshold
        if (!online || (Date.now() - lastActive > threshold)) {
          setOpponentPresent(false);
        } else {
          setOpponentPresent(true);
        }
      } else {
        setOpponentPresent(false);
      }
    });
    
    return () => {
      clearInterval(intervalId);
      // Mark current user as offline on unmount
      updateDoc(presenceDocRef, {
        [currentUser.uid]: { online: false, lastActive: Date.now() },
      });
      unsubscribe();
    };
  }, [gameId, currentUser, opponent, gameType]);

  // Subscribe to friendship statuses for real-time updates.
  useEffect(() => {
    if (!currentUser || !friendIds || friendIds.length === 0) return;

    const friendshipsRef = collection(database, "friendships");

    const qSent = query(
      friendshipsRef,
      where("status", "in", ["pending", "confirmed"]),
      where("requesterId", "==", currentUser.uid),
      where("requesteeId", "in", friendIds)
    );

    const unsubscribeSent = onSnapshot(qSent, (snapshot) => {
      const statuses = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        statuses[data.requesteeId] = data.status;
      });
      // Merge with any previously set statuses.
      setFriendshipStatuses(prev => ({ ...prev, ...statuses }));
    });

    const qReceived = query(
      friendshipsRef,
      where("status", "in", ["pending", "confirmed"]),
      where("requesteeId", "==", currentUser.uid),
      where("requesterId", "in", friendIds)
    );

    const unsubscribeReceived = onSnapshot(qReceived, (snapshot) => {
      const statuses = {};
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        statuses[data.requesterId] = data.status;
      });
      setFriendshipStatuses(prev => ({ ...prev, ...statuses }));
    });

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [currentUser, friendIds]);

  // Add this useEffect to mark challenge as completed when game ends
  useEffect(() => {
    const markChallengeCompleted = async () => {
      // Only do this for multiplayer games that have a gameId
      if (gameType === 'multiplayer' && gameId) {
        try {
          // Query to find the challenge with this gameId
          const challengesRef = collection(database, 'challenges');
          const challengeQuery = query(
            challengesRef,
            where('gameId', '==', gameId),
            limit(1)
          );
          
          const querySnapshot = await getDocs(challengeQuery);
          
          if (!querySnapshot.empty) {
            const challengeDoc = querySnapshot.docs[0];
            // Update the challenge status to completed
            await updateDoc(doc(database, 'challenges', challengeDoc.id), {
              status: 'completed',
              completedAt: serverTimestamp()
            });
            
            console.log('Challenge marked as completed:', challengeDoc.id);
            
            // Clear the active challenge from AsyncStorage
            AsyncStorage.removeItem('activeChallenge');
          }
        } catch (error) {
          console.error('Error marking challenge as completed:', error);
        }
      }
    };
    
    markChallengeCompleted();
  }, [gameId, gameType]); // Only run once when component mounts and when these values are available

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
        {/* Add Result Banner for multiplayer games */}
        {gameType === "multiplayer" && (
          <View style={[styles.resultBanner, getResultStyle()]}>
            <Text style={styles.resultText}>
              {result === "Winner" && "Victory! 🏆"}
              {result === "Loser" && "Better luck next time! 😔"}
              {result === "Tied" && "It's a tie! 🤝"}
            </Text>
            <Text style={styles.scoreText}>
              Your Score: {finalScore} | Opponent's Score: {opponentScore}
            </Text>
          </View>
        )}
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderColor: '#ffffff',
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 30,
    alignSelf: 'flex-start',
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
  resultBanner: {
    width: '100%',
    padding: 20,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  winnerBanner: {
    backgroundColor: '#4CAF50',
  },
  loserBanner: {
    backgroundColor: '#fbaa3e',
  },
  tieBanner: {
    backgroundColor: '#4CAF50',
  },
  resultText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
}); 