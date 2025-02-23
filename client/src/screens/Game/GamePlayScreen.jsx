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
import { updateDoc, increment, doc, onSnapshot } from "firebase/firestore";
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

export default function GamePlayScreen({ route, navigation }) {
  const { gameType, challengeId, gameId } = route.params;

  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameData, setGameData] = useState(null);
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

  // ------------------------------
  // UPDATE: Timer useEffect - Only end game locally for solo games.
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (gameType === "solo") {
            // Solo game calls the handleGameEnd to process results.
            setTimeout(() => {
              handleGameEnd();
            }, 0);
          } else {
            // For multiplayer, we wait for the server's "gameOver" event to finalize the game.
            console.log(
              "Multiplayer timer reached 0; waiting for server gameOver event."
            );
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameType]);

  // ------------------------------
  // NEW useEffect: Listen for "gameOver" event from the server in multiplayer.
  useEffect(() => {
    if (gameType === "multiplayer") {
      const handleGameOver = ({ winnerUserId, gameResults }) => {
        // Navigate to the GameSummary screen with the results received from the server.
        navigation.replace("GameSummary", {
          gameType,
          isWinner: currentUser && winnerUserId === currentUser.uid,
          gameResults, // Contains details like final scores, guessed countries, time used etc.
        });
      };

      socket.on("gameOver", handleGameOver);
      return () => {
        socket.off("gameOver", handleGameOver);
      };
    }
  }, [gameType, currentUser, navigation]);

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
              list[scoreIndex] = {
                ...list[scoreIndex],
                score: list[scoreIndex].score + 1,
              };
              await updateDoc(doc(database, "challenges", challengeId), {
                scoreList: list,
                country: countries,
              });
            }

            const isRecognized = recognizedCountries.recognized_countries.some(
              (recCountry) =>
                normalizeCountryName(recCountry) === normalizedGuess
            );
            if (isRecognized) {
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
          if (isRecognized && !guessedCountries.includes(normalizedGuess)) {
            if (gameType === "multiplayer") {
              socket.emit("countryGuessed", {
                gameId,
                userId: currentUser.uid,
                country: normalizedGuess,
              });
              setGuess("");
            } else {
              setGuessedCountries((prev) => [...prev, normalizedGuess]);
              setScore((prev) => prev + 1);
              animateScore();
              setGuess("");
            }
            const list = [...(gameData?.scoreList ?? [])];
            const countries = [...(gameData?.country ?? [])];
            countries.push({ country: txt, uid: currentUser.uid });
            let scoreIndex = list.findIndex((e) => e.uid === currentUser.uid);
            if (scoreIndex !== -1) {
              list[scoreIndex] = {
                ...list[scoreIndex],
                score: list[scoreIndex].score + 1,
              };
              await updateDoc(doc(database, "challenges", challengeId), {
                scoreList: list,
                country: countries,
              });
            }
          }
        }
      }
    } catch (error) {
      console.log("🚀 ~ handleTextChange ~ error:", error);
    }
  };

  const handleGameEnd = async () => {
    // Increment the user's gamesPlayed field when the game is completed
    try {
      await updateDoc(doc(database, "users", currentUser.uid), {
        "stats.gamesPlayed": increment(1),
      });
      // Immediately refetch user data to ensure the latest stats are loaded
      await fetchCurrentUser();
    } catch (error) {
      console.error("Error updating gamesPlayed:", error);
    }

    if (gameType === "solo") {
      navigation.replace("GameSummary", {
        finalScore: scoreRef.current,
        totalCountries: recognizedCountries.recognized_countries.length,
        guessedCountries: guessedCountriesRef.current,
      });
    } else navigation.replace("GameSummary");
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: 60 }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 60}
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
                onPress: () => navigation.replace("GameMain"),
              },
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
        <AnimatedText style={[styles.score, scoreAnimatedStyle]}></AnimatedText>
        {!!gameData?.scoreList?.length &&
          gameData?.scoreList?.map((e) => {
            let isCur = e.uid == currentUser.uid;
            return (
              <View>
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
          })}
      </View>

      <Animated.View style={[styles.toastWrapper, toastAnimatedStyle]}>
        <Text style={styles.toastText}>- Already Guessed</Text>
      </Animated.View>

      {/* NEW: Display guessed count overlay for solo game */}
      { gameType === "solo" && (
        <View style={styles.guessedCountContainer}>
          <Text style={styles.guessedCountText}>
            Guessed: {guessedCountries.length} countries
          </Text>
        </View>
      )}

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
    padding: 20,
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f5f5f5",
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
  guessedCountContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    zIndex: 2,
  },
  guessedCountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
