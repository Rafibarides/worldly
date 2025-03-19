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
  Modal,
  Image,
  TouchableWithoutFeedback,
  FlatList,
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
import { updateDoc, increment, doc, onSnapshot, serverTimestamp, getDoc } from "firebase/firestore";
import { database } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import socket from "../../services/socket";
import { geoPath, geoNaturalEarth1 } from "d3-geo";
import { Audio } from 'expo-av';
import { useAudio } from '../../contexts/AudioContext';

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
const GAME_DURATION = 1200;

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

        const unsubscribe = onSnapshot(challengeRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Find the opponent's user ID
            let opponentId = null;
            if (currentUser) {
              opponentId = data.challengerId === currentUser.uid 
                ? data.challengedId 
                : data.challengerId;
            }
            
            // If we have an opponent ID, fetch their username and avatar
            if (opponentId) {
              try {
                const opponentDoc = await getDoc(doc(database, "users", opponentId));
                if (opponentDoc.exists()) {
                  // Add the opponent's username and avatar to the game data
                  setGameData({
                    ...data,
                    opponentUsername: opponentDoc.data().username,
                    opponentAvatarUrl: opponentDoc.data().avatarUrl
                  });
                } else {
                  setGameData(data);
                }
              } catch (error) {
                console.log("Error fetching opponent data:", error);
                setGameData(data);
              }
            } else {
              setGameData(data);
            }
          }
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

  const { musicEnabled } = useAudio();

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
      // Stop background music immediately when game is over
      if (backgroundMusicRef.current) {
        try {
          backgroundMusicRef.current.stopAsync();
          backgroundMusicRef.current.unloadAsync();
          backgroundMusicRef.current = null;
          setBackgroundMusic(null);
        } catch (error) {
          console.error("Error stopping background music:", error);
        }
      }
      
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

  // Add this near the beginning of the component to inspect the GeoJSON data
  useEffect(() => {
    // Find Bosnia in the GeoJSON data
    const bosniaFeature = filteredWorldData.features.find(feat => 
      feat?.properties?.NAME.toLowerCase().includes("bosnia")
    );
    console.log("Bosnia feature in GeoJSON:", bosniaFeature?.properties?.NAME);
    
    // Also log all feature names to find any discrepancies
    console.log("All feature names:", filteredWorldData.features.map(f => f.properties.NAME));
  }, []);

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
          return normalizeCountryName(feat?.properties?.NAME) === normalizedGuess;
        });

        if (matchedFeature) {
          const countryName = matchedFeature.properties.NAME;
          const normalizedCountryName = normalizeCountryName(countryName);
          const alreadyGuessed = guessedCountries.includes(normalizedCountryName);
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
              setGuess("");
              updateDoc(doc(database, "challenges", challengeId), {
                scoreList: list,
                country: countries,
              }).catch(error => console.error("Error updating document:", error));
            } else {
              setGuess("");
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
                setGuess("");
                updateDoc(doc(database, "challenges", challengeId), {
                  scoreList: list,
                  country: countries,
                }).catch(error => console.error("Error updating document:", error));
              } else {
                setGuess("");
              }
            }
          }
        }

        if (normalizedGuess.includes("bosnia")) {
          console.log("Normalized guess:", normalizedGuess);
          console.log("Current guessedCountries:", guessedCountries);
          
          // Check if any feature matches this guess
          const matchingFeature = filteredWorldData.features.find(feat => 
            normalizeCountryName(feat?.properties?.NAME) === normalizedGuess
          );
          console.log("Matching feature:", matchingFeature?.properties?.NAME);
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
    // Immediately stop the background music
    if (backgroundMusicRef.current) {
      try {
        // Use stopAsync and unloadAsync immediately without waiting for the async operation
        backgroundMusicRef.current.stopAsync();
        backgroundMusicRef.current.unloadAsync();
        backgroundMusicRef.current = null;
        setBackgroundMusic(null);
      } catch (error) {
        console.error("Error stopping background music:", error);
      }
    }
    
    // Show confirmation dialog
    Alert.alert(
      "Exit Game",
      "Are you sure you want to exit? Your progress will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            // If user cancels, restart the music if it was enabled
            if (musicEnabled) {
              playBackgroundMusic();
            }
          }
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            // For multiplayer games, notify the server that the player has left
            if (gameType === "multiplayer" && gameId) {
              socket.emit("leaveGame", { gameId, userId: currentUser.uid });
            }
            
            // Navigate back to the main game screen
            navigation.goBack();
          }
        }
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

  // Add this state and ref for the background music
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const backgroundMusicRef = useRef(null);

  // Update the playBackgroundMusic function to check the preference
  const playBackgroundMusic = async () => {
    // Don't play music if the user has disabled it
    if (!musicEnabled) return;
    
    try {
      // Unload any existing sound first
      if (backgroundMusicRef.current) {
        await backgroundMusicRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sound/music.mp3'),
        { 
          isLooping: true,
          shouldPlay: true,
          volume: 0.5 // Adjust volume as needed
        }
      );
      
      backgroundMusicRef.current = sound;
      setBackgroundMusic(sound);
    } catch (error) {
      console.error("Error playing background music:", error);
    }
  };

  // Add this effect to respond to changes in the music preference
  useEffect(() => {
    if (musicEnabled) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [musicEnabled]);

  // Add this effect to stop the music when the game ends
  useEffect(() => {
    if (timeLeft === 0) {
      stopBackgroundMusic();
    }
  }, [timeLeft]);

  // Add the stopBackgroundMusic function that's missing
  const stopBackgroundMusic = async () => {
    if (backgroundMusicRef.current) {
      try {
        await backgroundMusicRef.current.stopAsync();
        await backgroundMusicRef.current.unloadAsync();
        backgroundMusicRef.current = null;
        setBackgroundMusic(null);
      } catch (error) {
        console.error("Error stopping background music:", error);
      }
    }
  };

  // Add this effect to stop music when navigating to GameSummary
  useEffect(() => {
    // Clean up function to stop music when component unmounts
    return () => {
      if (backgroundMusicRef.current) {
        try {
          backgroundMusicRef.current.stopAsync();
          backgroundMusicRef.current.unloadAsync();
          backgroundMusicRef.current = null;
          setBackgroundMusic(null);
        } catch (error) {
          console.error("Error stopping background music on unmount:", error);
        }
      }
    };
  }, []);

  // Add these shared values near the other useSharedValue declarations (around line 130-140)
  const userScoreScale = useSharedValue(1);
  const opponentScoreScale = useSharedValue(1);

  // Add this function to trigger the score animation
  const animateScoreCard = (isUser) => {
    const sharedValue = isUser ? userScoreScale : opponentScoreScale;
    sharedValue.value = withSequence(
      withTiming(1.15, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };

  // Add this effect to watch for score changes and trigger animations
  useEffect(() => {
    if (score > 0 && gameData?.scoreList) {
      // Find previous score to compare
      const prevScore = scoreRef.current - 1;
      if (score > prevScore) {
        // Animate user's score card when they get a point
        animateScoreCard(true);
      }
    }
  }, [score]);

  // Add a ref to track the opponent's previous score
  const prevOpponentScoreRef = useRef(0);

  // Update the effect to watch for opponent score changes
  useEffect(() => {
    if (gameType === "multiplayer" && gameData?.scoreList) {
      const opponentEntry = gameData.scoreList.find(e => e.uid !== currentUser.uid);
      if (opponentEntry) {
        const currentOpponentScore = opponentEntry.score;
        // Check if the score has increased
        if (currentOpponentScore > prevOpponentScoreRef.current) {
          // Animate opponent's score card when they get a point
          animateScoreCard(false);
          // Update the previous score reference
          prevOpponentScoreRef.current = currentOpponentScore;
        }
      }
    }
  }, [gameData?.scoreList]);

  // Create animated styles for the score cards
  const userScoreAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: userScoreScale.value }],
    };
  });

  const opponentScoreAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: opponentScoreScale.value }],
    };
  });

  // Add these state variables after the other useState declarations (around line 93)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Add this function to handle card press
  const handleCardPress = (player) => {
    setSelectedPlayer(player);
    setModalVisible(true);
  };

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
          <View style={styles.scoreCardsContainer}>
            {!!gameData?.scoreList?.length &&
              gameData?.scoreList?.map((e) => {
                let isCur = e.uid === currentUser.uid;
                return (
                  <TouchableOpacity
                    key={e.uid}
                    onPress={() => handleCardPress({ ...e, isCur: e.uid === currentUser.uid })}
                  >
                    <Animated.View 
                      style={[
                        styles.scoreCard, 
                        isCur ? styles.userScoreCard : styles.opponentScoreCard,
                        isCur ? userScoreAnimatedStyle : opponentScoreAnimatedStyle
                      ]}
                    >
                      <Text 
                        style={styles.playerName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {isCur ? "You" : gameData?.opponentUsername || "Challenger"}
                      </Text>
                      <Text style={styles.playerScore}>
                        {e.score}/196
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
          </View>
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableWithoutFeedback>
              <View style={[
                styles.modalCard,
                selectedPlayer?.isCur ? styles.userScoreCard : styles.opponentScoreCard
              ]}>
                <View style={styles.modalHeader}>
                  <Image 
                    source={
                      selectedPlayer?.isCur 
                        ? currentUser?.avatarUrl 
                          ? { uri: currentUser.avatarUrl } 
                          : { uri: 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }
                        : gameData?.opponentAvatarUrl 
                          ? { uri: gameData.opponentAvatarUrl } 
                          : { uri: 'https://api.dicebear.com/9.x/avataaars/png?seed=opponent' }
                    } 
                    style={styles.profilePhoto} 
                  />
                  <Text style={styles.modalPlayerName}>
                    {selectedPlayer?.isCur ? "You" : gameData?.opponentUsername || "Challenger"}
                  </Text>
                </View>
                
                <Text style={styles.modalPlayerScore}>
                  {selectedPlayer?.score}/196
                </Text>
                
                <Text style={styles.encouragingMessage}>
                  {selectedPlayer?.isCur 
                    ? `Guess ${196 - selectedPlayer?.score} more countries to win!` 
                    : `${gameData?.opponentUsername || "Challenger"} has ${196 - selectedPlayer?.score} countries left to win!`}
                </Text>
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableOpacity>
      </Modal>
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
    top: 44,
    left: 25,
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
  scoreCardsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  scoreCard: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: 120,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  userScoreCard: {
    backgroundColor: "#92c47b", // Updated green color for user's card
  },
  opponentScoreCard: {
    backgroundColor: "#0089c2", // Updated blue color for opponent's card
  },
  playerName: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    width: "100%",
    textAlign: "center",
    numberOfLines: 1,
    ellipsizeMode: "tail",
  },
  playerScore: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
  },
  modalCard: {
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  profilePhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  modalPlayerName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalPlayerScore: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  encouragingMessage: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Modal header "X" (close button) updated to use game-yellow (#ffc268)
  closeButton: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffc268", // yellow shade used throughout the game
  },
  // For global missed countries header, we wrap the continent title in a green pill
  missedHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
    alignSelf: "flex-start",
  },
  // The pill container for continent titles
  continentTitlePill: {
    backgroundColor: "#7dbc63", // green shade used in our game
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  // The text inside the green pill (white and bold)
  missedCountriesHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  // For the badge icon next to the header (if needed)
  continentBadgeIcon: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },
});
