import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  withSequence
} from 'react-native-reanimated';
// Import the countries_by_continent file for a canonical list per continent
import countriesByContinent from '../../utils/countries_by_continent.json';
// Import the country helpers for normalization and territory matching
import { normalizeCountryName, getTerritoryMatch } from '../../utils/countryHelpers';

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
  const AnimatedCard = ({ children, delay }) => {
    const cardOpacity = useSharedValue(0);
    const cardPressScale = useSharedValue(1);

    useEffect(() => {
      cardOpacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    }, []);

    const cardAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: cardOpacity.value,
        transform: [{ scale: cardOpacity.value * cardPressScale.value }]
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
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  // Right before rendering, log the final continentPercentages:
  console.log('continentPercentages:', continentPercentages);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <Text style={styles.title}>Game Review</Text>
      <Text style={styles.scoreText}>
        Total: {finalScore} / {totalCountries} countries
      </Text>

      {/* Cards Container for Continent Breakdown */}
      <View style={styles.cardsContainer}>
        {Object.keys(fixedContinentTotals).map((continent, index) => (
          <AnimatedCard key={continent} delay={index * 100}>
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
        <Text style={styles.buttonText}>Back to Game Selection</Text>
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(177,216,138,1)',
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
  },
  scoreText: {
    fontSize: 20,
    marginBottom: 20,
    color: '#fff',
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
    width: '30%', // Set each card's width so 3 cards fit per row
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 20, // Vertical spacing between rows
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#ffa500',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  }
}); 