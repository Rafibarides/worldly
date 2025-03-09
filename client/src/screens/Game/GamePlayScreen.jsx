import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import MapView from "../../components/MapView";
import worldData from "../../../assets/geojson/ne_50m_admin_0_countries.json";
import { feature } from "topojson-client";
import {
  normalizeCountryName,
  getTerritoriesForCountry,
} from "../../utils/countryHelpers";
import recognizedCountries from "../../utils/recognized_countries.json";
import { updateDoc, increment, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { database } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import socket from "../../services/socket";
import { geoPath, geoNaturalEarth1 } from "d3-geo";

let geoJSON;
if (worldData.type === "Topology") {
  geoJSON = feature(worldData, worldData.objects.ne_50m_admin_0_countries);
} else {
  geoJSON = worldData;
}
const filteredWorldData = {
  ...geoJSON,
  features: geoJSON.features.filter(
    (feat) => feat.properties && feat.properties.NAME !== "Antarctica"
  ),
};

// Insert this block to add South Sudan if it's missing in the geoJSON
if (
  !filteredWorldData.features.some(
    (feat) => feat.properties.NAME.toLowerCase() === "s. sudan"
  )
) {
  filteredWorldData.features.push({
    type: "Feature",
    properties: { NAME: "S. Sudan" },
    geometry: {
      type: "Polygon",
      // Note: These coordinates are a placeholder.
      // Replace with accurate coordinates for South Sudan if available.
      coordinates: [
        [
          [32.0, 4.0],
          [35.0, 4.0],
          [35.0, 11.0],
          [32.0, 11.0],
          [32.0, 4.0],
        ],
      ],
    },
  });
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// Updated game duration in seconds: 30 seconds per game
const GAME_DURATION = 30;

export default function GamePlayScreen({ route, navigation }) {
  const { gameType, challengeId, gameId } = route.params;

  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameData, setGameData] = useState(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const { currentUser, fetchCurrentUser } = useAuth();
  const [opponentGuesses, setOpponentGuesses] = useState([]);
  const [guessedCountries, setGuessedCountries] = useState([]);

  const guessedCountriesRef = useRef(guessedCountries);

  useEffect(() => {
    guessedCountriesRef.current = guessedCountries;
  }, [guessedCountries]);

  useEffect(() => {
    try {
      if (challengeId) {
        const challengeRef = doc(database, "challenges", challengeId);

        const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
          if (docSnap.exists()) setGameData(docSnap.data());
        });

        return () => unsubscribe();
      }
    } catch (error) {
      console.log("🚀 ~ useEffect ~ error:", error);
    }
  }, [challengeId]);

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
    if (gameType === "multiplayer") {
      if (!currentUser) {
        console.error(
          "No current user defined when trying to join a multiplayer game"
        );
        return;
      }
      socket.emit("joinGame", { gameId, userId: currentUser.uid });
    }
  }, [gameType, currentUser, gameId]);

  // Multiplayer receives opponent updates via socket
  useEffect(() => {
    if (gameType === "multiplayer") {
      const handleCountryGuessedUpdate = ({ userId, country }) => {
        if (!currentUser || userId !== currentUser.uid) {
          if (!guessedCountries.includes(country.toLowerCase())) {
            setGuessedCountries((prev) => [...prev, country.toLowerCase()]);
            setScore((prev) => prev + 1);
          }
        }
      };

      socket.on("countryGuessedUpdate", handleCountryGuessedUpdate);
      return () => {
        socket.off("countryGuessedUpdate", handleCountryGuessedUpdate);
      };
    }
  }, [gameType, currentUser, guessedCountries]);

  // Replace the current timer effect with this updated version:
  useEffect(() => {
    let timer;
    if (gameData && gameData.startedAt) {
      // Extract the startedAt timestamp in milliseconds.
      const startedAtMs = gameData.startedAt.toMillis
        ? gameData.startedAt.toMillis()
        : new Date(gameData.startedAt).getTime();
      
      // Function to update the remaining time.
      const updateRemainingTime = () => {
        const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
        const newTimeLeft = GAME_DURATION - elapsed;
        
        if (newTimeLeft <= 0) {
          clearInterval(timer);
          setTimeLeft(0);
        } else {
          setTimeLeft(newTimeLeft);
        }
      };

      // Immediately update the timer display when gameData is available.
      updateRemainingTime();

      // Schedule the timer to update every second.
      timer = setInterval(updateRemainingTime, 1000);
    } else {
      // Fallback: if startedAt isn't available, decrement the timer normally.
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameData]);

  // Add this separate effect to handle navigation when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !hasNavigated) {  // Only navigate if not already done
      setHasNavigated(true); // Prevent further navigations
      if (gameType === "solo") {
        // Navigate to the GameSummary screen with the final results.
        navigation.replace("GameSummary", {
          result: "Completed",
          gameType: "solo",
          finalScore: score,
          totalCountries: recognizedCountries.recognized_countries.length,
          guessedCountries: guessedCountriesRef.current,
        });
      } else if (gameType === "multiplayer" && gameData?.scoreList?.length > 0) {
        (async () => {
          try {
            // Update the challenge status to "completed" in the database.
            const challengeRef = doc(database, "challenges", challengeId);
            await updateDoc(challengeRef, { 
              status: "completed",
              completedAt: serverTimestamp()
            });
          } catch (error) {
            console.error("Error updating challenge status to completed:", error);
          }
          
          // Evaluate scores and determine the result.
          const myEntry = gameData.scoreList.find(entry => entry.uid === currentUser.uid);
          const opponentEntry = gameData.scoreList.find(entry => entry.uid !== currentUser.uid);
          const myScore = myEntry ? myEntry.score : 0;
          const opponentScore = opponentEntry ? opponentEntry.score : 0;
    
          let result = "Tied";
          if (myScore > opponentScore) {
            result = "Winner";
          } else if (myScore < opponentScore) {
            result = "Loser";
          }
    
          // Navigate to the GameSummary screen with the final results.
          navigation.replace("GameSummary", {
            result,
            gameData,
            gameType: "multiplayer",
            finalScore: myScore,
            opponentScore,
            totalCountries: recognizedCountries.recognized_countries.length,
            guessedCountries: guessedCountriesRef.current,
            gameId
          });
        })();
      }
    }
  }, [timeLeft, gameType, gameData, currentUser?.uid, navigation, score, challengeId, gameId, hasNavigated]);

  // Listen for opponent's correct guess events on the correct event name "countryGuessedUpdate"
  useEffect(() => {
    if (gameType === "multiplayer") {
      const handleOpponentGuess = (data) => {
        console.log("🔵 Received countryGuessedUpdate event:", data);

        if (data.gameId === gameId && data.playerId !== currentUser.uid) {
          const normalizedCountry = data.country.toLowerCase();
          setOpponentGuesses((prev) => {
            if (!prev.includes(normalizedCountry)) {
              console.log("📌 Adding opponent's guess:", normalizedCountry);
              return [...prev, normalizedCountry];
            }
            return prev;
          });
        }
      };

      socket.on("countryGuessedUpdate", handleOpponentGuess);

      return () => {
        socket.off("countryGuessedUpdate", handleOpponentGuess);
      };
    }
  }, [gameType, currentUser.uid, gameId]);

  // Add this useEffect at the beginning of the component to ensure the challenge stays active
  useEffect(() => {
    // Only run this for multiplayer games with a challengeId
    if (gameType === "multiplayer" && challengeId) {
      try {
        // Get a reference to the challenge document
        const challengeRef = doc(database, "challenges", challengeId);
        
        // Update the challenge to ensure it stays active
        // This runs when the GamePlayScreen first mounts
        updateDoc(challengeRef, {
          status: "active",
          gameStarted: true,
          // Set both joined flags to true to prevent cancellation logic
          challengerJoined: true,
          challengedJoined: true
        });
        
        // Create a listener that will maintain the active status
        const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // If the status has been changed to "cancelled" but the game is still in progress
            // (timeLeft > 0), restore it to "active"
            if (data.status === "cancelled" && timeLeft > 0 && data.gameStarted) {
              updateDoc(challengeRef, {
                status: "active"
              });
            }
          }
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error ensuring challenge stays active:", error);
      }
    }
  }, [challengeId, gameType, timeLeft]);

  const mapContainerStyle = {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#49b3f5",
  };

  const animateScore = () => {
    scoreScale.value = withSequence(
      withSpring(1.2, { damping: 2, stiffness: 80 }),
      withSpring(1, { damping: 2, stiffness: 80 })
    );
  };

  const scoreAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scoreScale.value }],
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
      transform: [{ translateX: inputShake.value }],
    };
  });

  const toastAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: toastOpacity.value,
      transform: [{ translateY: toastTranslate.value }],
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
      mass: 0.5,
    });
  };

  const handleTextChange = async (text) => {
    try {
      let txt = text.trim().toLowerCase();
      setGuess(text);
      if (txt) {
        if (!currentUser) {
          console.error("currentUser is undefined");
          return;
        }
        const normalizedGuess = normalizeCountryName(text);
        const matchedFeature = filteredWorldData.features.find((feat) => {
          return (
            feat?.properties?.NAME.toLowerCase() ===
            normalizedGuess.toLowerCase()
          );
        });

        if (matchedFeature) {
          const countryName = matchedFeature.properties.NAME;
          const normalizedCountryName = normalizeCountryName(countryName);
          const alreadyGuessed = guessedCountries.includes(
            normalizedCountryName
          );
          if (!alreadyGuessed) {
            const territories = getTerritoriesForCountry(normalizedCountryName);
            setGuessedCountries((prev) => [
              ...prev,
              normalizedCountryName,
              ...territories,
            ]);
            const list = [...(gameData?.scoreList ?? [])];
            const countries = [...(gameData?.country ?? [])];
            countries.push({ country: txt, uid: currentUser.uid });
            let scoreIndex = list.findIndex((e) => e.uid === currentUser.uid);
            if (scoreIndex !== -1) {
              if (normalizedCountryName !== 'palestine') {
                list[scoreIndex] = {
                  ...list[scoreIndex],
                  score: list[scoreIndex].score + 1,
                };
              }
              await updateDoc(doc(database, "challenges", challengeId), {
                scoreList: list,
                country: countries,
              });
            }

            const isRecognized = recognizedCountries.recognized_countries.some(
              (recCountry) =>
                normalizeCountryName(recCountry) === normalizedGuess
            );
            if (isRecognized && normalizedGuess !== 'palestine') {
              setScore((prev) => prev + 1);
              animateScore();
              console.log("Game data set successfully!");
            }
            setGuess("");
          } else {
            shakeInput();
            showToast();
          }
        } else {
          // If no matched feature is found, check if the country is recognized on its own.
          const isRecognized = recognizedCountries.recognized_countries.some(
            (recCountry) => normalizeCountryName(recCountry) === normalizedGuess
          );
          if (isRecognized) {
            if (guessedCountries.includes(normalizedGuess)) {
              // Already guessed – shake input and show toast.
              shakeInput();
              showToast();
            } else {
              // Add the normalized guess to the local guessedCountries array for both game modes.
              setGuessedCountries((prev) => [...prev, normalizedGuess]);

              if (gameType === "multiplayer") {
                socket.emit("countryGuessed", {
                  gameId,
                  userId: currentUser.uid,
                  country: normalizedGuess,
                });
              } else {
                if (normalizedGuess !== 'palestine') {
                  setScore((prev) => prev + 1);
                  animateScore();
                }
              }

              const list = [...(gameData?.scoreList ?? [])];
              const countries = [...(gameData?.country ?? [])];
              countries.push({ country: txt, uid: currentUser.uid });
              let scoreIndex = list.findIndex((e) => e.uid === currentUser.uid);
              if (scoreIndex !== -1) {
                if (normalizedGuess !== 'palestine') {
                  list[scoreIndex] = {
                    ...list[scoreIndex],
                    score: list[scoreIndex].score + 1,
                  };
                }
                await updateDoc(doc(database, "challenges", challengeId), {
                  scoreList: list,
                  country: countries,
                });
              }
              setGuess("");
            }
          }
        }
      }
    } catch (error) {
      console.log("🚀 ~ handleTextChange ~ error:", error);
    }
  };

  const handleGameEnd = async () => {
    try {
      // Do not update gamesPlayed here; increment is handled in GameSummaryScreen.
      navigation.replace("GameSummary", {
        finalScore: scoreRef.current,
        totalCountries: recognizedCountries.recognized_countries.length,
        guessedCountries: guessedCountriesRef.current,
        gameType: "solo"
      });
    } catch (error) {
      console.error("Error updating gamesPlayed:", error);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const [containerHeight, setContainerHeight] = useState(0);

  // Handle layout to measure container height
  const onContainerLayout = useCallback((e) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  // Calculate the map width based on the container height and world aspect ratio
  const mapWidth = containerHeight * 2;

  // Memoize the generated paths to avoid recalculating on every render
  const countryPaths = useMemo(() => {
    if (containerHeight > 0) {
      // Use geoNaturalEarth1 to avoid huge shapes crossing ±180° longitude
      const projection = geoNaturalEarth1();

      // Scale/translate to fit [mapWidth, containerHeight]
      projection.fitSize([mapWidth, containerHeight], filteredWorldData);

      // Create path generator from the new projection
      const pathGenerator = geoPath().projection(projection);

      // Return path strings for all filtered countries
      return filteredWorldData.features.map((feat) => pathGenerator(feat));
    }
    return [];
  }, [containerHeight, mapWidth]);

  const handleExitGame = () => {
    Alert.alert(
      "Exit Game",
      "Are you sure you want to exit? ",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => navigation.reset({
            index: 0,
            routes: [{ name: 'Game' }],
          }),
        },
      ]
    );
  };

  const gameOverCountryCount = 196; // number of correct guesses to end the game immediately
  const [gameIsOver, setGameIsOver] = useState(false);

  // NEW: Monitor for game-over condition based on guessed countries count.
  // Place this effect below your handleGameEnd function.
  useEffect(() => {
    if (!gameIsOver) {
      if (gameType === "solo" && score >= gameOverCountryCount) {
        // For solo games, if the local score reaches the threshold, end the game.
        setGameIsOver(true);
        handleGameEnd(); // this navigates to GameSummary for solo mode.
      } else if (gameType === "multiplayer" && gameData?.scoreList) {
        // For multiplayer games, check both players' scores.
        const myEntry = gameData.scoreList.find(e => e.uid === currentUser.uid) || {};
        const opponentEntry = gameData.scoreList.find(e => e.uid !== currentUser.uid) || {};
        if ((myEntry.score >= gameOverCountryCount) || (opponentEntry.score >= gameOverCountryCount)) {
          setGameIsOver(true);
          (async () => {
            try {
              // Update the challenge status to completed in Firestore.
              const challengeRef = doc(database, "challenges", challengeId);
              await updateDoc(challengeRef, { 
                status: "completed",
                completedAt: serverTimestamp()
              });
            } catch (error) {
              console.error("Error updating challenge status to completed:", error);
            }
            // Determine result based on scores.
            const myScore = myEntry.score || 0;
            const opponentScore = opponentEntry.score || 0;
            let result = "Tied";
            if (myScore > opponentScore) {
              result = "Winner";
            } else if (myScore < opponentScore) {
              result = "Loser";
            }
            // Navigate to the GameSummary screen for multiplayer.
            navigation.replace("GameSummary", {
              result,
              gameData,
              gameType: "multiplayer",
              finalScore: myScore,
              opponentScore,
              totalCountries: recognizedCountries.recognized_countries.length,
              guessedCountries: guessedCountriesRef.current,
              gameId
            });
          })();
        }
      }
    }
  }, [score, gameData, gameType, gameIsOver, currentUser, challengeId, navigation, recognizedCountries, guessedCountriesRef, gameId]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: 60 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <TouchableOpacity
        style={styles.exitButton}
        onPress={handleExitGame}
      >
        <MaterialIcons name="arrow-back-ios" size={24} color="#666" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <MaterialIcons name="timer" size={24} color="#666" />
          <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
        </View>
        {gameType === "solo" ? (
          <Text style={styles.score}>
            Guessed: {guessedCountries.length} countries
          </Text>
        ) : (
          !!gameData?.scoreList?.length &&
          gameData?.scoreList?.map((e) => {
            let isCur = e.uid == currentUser.uid;
            return (
              <View key={e.uid}>
                <AnimatedText
                  style={[
                    styles.score,
                    scoreAnimatedStyle,
                    !isCur && { color: "blue" },
                  ]}
                >
                  {isCur ? "You" : "Challenger"}
                </AnimatedText>
                <AnimatedText
                  style={[
                    styles.score,
                    scoreAnimatedStyle,
                    !isCur && { color: "blue" },
                  ]}
                >
                  {e.score}/196
                </AnimatedText>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.inputSection}>
        <AnimatedTextInput
          style={[styles.input, inputAnimatedStyle]}
          placeholder="Enter country name..."
          value={guess}
          onChangeText={handleTextChange}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          keyboardType="ascii-capable"
        />
      </View>

      <Animated.View style={[styles.toastWrapper, toastAnimatedStyle]}>
        <Text style={styles.toastText}>- Already Guessed</Text>
      </Animated.View>

      <AnimatedView style={[{ flex: 1 }, mapContainerStyle]}>
        <MapView
          onContainerLayout={onContainerLayout}
          guessedCountries={guessedCountries}
          mapWidth={mapWidth}
          gameDataCountry={gameData?.country || []}
          containerHeight={containerHeight}
          currentUid={currentUser.uid}
          countryPaths={countryPaths}
          gameType={gameType}
        />
      </AnimatedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timer: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#666",
  },
  score: {
    fontSize: 20,
    fontWeight: "bold",
    color: "rgb(101, 161, 42)",
  },
  inputSection: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
    marginVertical: 8,
  },
  exitButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
  },
  toastWrapper: {
    position: "absolute",
    right: 30,
    top: "45%",
    zIndex: 1000,
    backgroundColor: "rgba(255, 196, 0, 0.9)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  toastText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
