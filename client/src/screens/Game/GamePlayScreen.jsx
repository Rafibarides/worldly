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
  useAnimatedGestureHandler,
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
import {
  PinchGestureHandler,
  PanGestureHandler,
  GestureHandlerRootView
} from 'react-native-gesture-handler';

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
  const { gameType, challengeId, gameId, duration } = route.params;
  
  // Use the selected duration or default to 15 minutes (900 seconds)
  const gameDuration = duration || 900;

  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(gameDuration);
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

  const audioContext = useAudio();
  const [localMusicEnabled, setLocalMusicEnabled] = useState(true);
  const [backgroundMusic, setBackgroundMusic] = useState(null);
  const backgroundMusicRef = useRef(null);

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
        const newTimeLeft = gameDuration - elapsed;
        
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
  }, [gameData, gameDuration]);

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
      let txt = text.trim();
      setGuess(text);
      
      if (txt) {
        if (!currentUser) {
          console.error("currentUser is undefined");
          return;
        }
        
        const normalizedGuess = normalizeCountryName(txt);
        
        // First try to find the country in the map data
        const matchedFeature = filteredWorldData.features.find((feat) => {
          return normalizeCountryName(feat?.properties?.NAME) === normalizedGuess;
        });
        
        // If not found in map data, check the recognized countries list
        const isRecognizedCountry = recognizedCountries.recognized_countries.some(
          (recCountry) => normalizeCountryName(recCountry) === normalizedGuess
        );
        
        // Determine if this is a valid country - either from map or recognized list
        const isValidCountry = matchedFeature || isRecognizedCountry;
        
        if (isValidCountry) {
          // Get the standardized country name (from either source)
          const countryName = matchedFeature 
            ? matchedFeature.properties.NAME 
            : recognizedCountries.recognized_countries.find(
                c => normalizeCountryName(c) === normalizedGuess
              );
            
          const normalizedCountryName = normalizeCountryName(countryName || txt);
          const alreadyGuessed = guessedCountries.includes(normalizedCountryName);
          
          if (!alreadyGuessed) {
            const territories = getTerritoriesForCountry(normalizedCountryName);
            
            // Always update guessedCountries array for map filling
            setGuessedCountries((prev) => [
              ...prev,
              normalizedCountryName,
              ...territories,
            ]);
            
            // Update the scoring logic to only count the main country, not its territories
            if (gameType !== "solo") {
              // Multiplayer scoring
              const list = [...(gameData?.scoreList ?? [])];
              const countries = [...(gameData?.country ?? [])];
              countries.push({ country: txt, uid: currentUser.uid });
              let scoreIndex = list.findIndex((e) => e.uid === currentUser.uid);
              
              if (scoreIndex !== -1) {
                // ONLY increment score if it's a recognized country (not a territory)
                const isRecognizedCountry = recognizedCountries.recognized_countries.some(
                  country => normalizeCountryName(country) === normalizedCountryName
                );
                
                if (isRecognizedCountry && normalizedCountryName !== 'palestine') {
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
            } else {
              // Solo mode scoring
              // ONLY increment score if it's a recognized country (not a territory)
              const isRecognizedCountry = recognizedCountries.recognized_countries.some(
                country => normalizeCountryName(country) === normalizedCountryName
              );
              
              if (isRecognizedCountry && normalizedCountryName !== 'palestine') {
                setScore((prev) => prev + 1);
                animateScore();
              }
              setGuess("");
            }
          } else {
            shakeInput();
            showToast();
          }
        }
      }
    } catch (error) {
      console.error("Error in handleTextChange:", error);
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
  const [mapWidth, setMapWidth] = useState(0);

  // Add boundary constraints for the map position
  // First, define boundaries based on the container size
  const [mapBounds, setMapBounds] = useState({
    width: 0,
    height: 0
  });

  // Update the onContainerLayout function to capture the map dimensions
  const onContainerLayout = useCallback((e) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerHeight(height);
    setMapWidth(width * 2);
    
    // Save the bounds for constraint calculations
    setMapBounds({
      width: width,
      height: height
    });
  }, []);

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
      "Are you sure you want to exit? Your progress will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Exit", 
          onPress: () => {
            // Use navigation.reset to clear history and go back to GameScreen
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

  // Update the playBackgroundMusic function to check the preference
  const playBackgroundMusic = async () => {
    // Don't play music if the user has disabled it
    if (!localMusicEnabled) return;
    
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

  // Replace the existing toggleMusic function with this one
  const toggleMusic = () => {
    const newMusicState = !localMusicEnabled;
    setLocalMusicEnabled(newMusicState);
    
    if (newMusicState) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  };

  // Update the useEffect to use the appropriate musicEnabled value
  useEffect(() => {
    const isMusicEnabled = audioContext?.musicEnabled ?? localMusicEnabled;
    if (isMusicEnabled) {
      playBackgroundMusic();
    } else {
      stopBackgroundMusic();
    }
  }, [audioContext?.musicEnabled, localMusicEnabled]);

  // Add this effect to stop the music when the game ends
  useEffect(() => {
    if (timeLeft === 0) {
      stopBackgroundMusic();
    }
  }, [timeLeft]);

  // Add the stopBackgroundMusic function that's missing
  const stopBackgroundMusic = async () => {
    try {
      if (backgroundMusicRef.current) {
        await backgroundMusicRef.current.stopAsync();
        await backgroundMusicRef.current.unloadAsync();
        backgroundMusicRef.current = null;
        setBackgroundMusic(null);
      }
    } catch (error) {
      console.error("Error stopping background music:", error);
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

  // Inside the component, add state for zoom and pan
  const [mapScale, setMapScale] = useState(1);
  const [mapTranslateX, setMapTranslateX] = useState(0);
  const [mapTranslateY, setMapTranslateY] = useState(0);

  // Add these animated values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Handle pinch gesture
  const onPinchGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx) => {
      // Change minimum scale from 0.5 to 1.0 to prevent zooming out smaller than original
      const newScale = ctx.startScale * event.scale;
      scale.value = Math.min(Math.max(newScale, 1.0), 5);
    },
    onEnd: () => {
      // If somehow the scale ended up below 1, snap it back to 1
      if (scale.value < 1) {
        scale.value = withSpring(1);
      }
      savedScale.value = scale.value;
    },
  });

  // Then update the pan gesture handler to constrain movement
  const onPanGestureEvent = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      // Calculate maximum allowed pan distance based on scale
      const maxPanX = mapBounds.width * (scale.value - 1) / 2;
      const maxPanY = mapBounds.height * (scale.value - 1) / 2;
      
      // Calculate new position with constraints
      const newX = ctx.startX + event.translationX / scale.value;
      const newY = ctx.startY + event.translationY / scale.value;
      
      // Apply constraints - more restrictive when zoomed out, more freedom when zoomed in
      translateX.value = Math.min(Math.max(newX, -maxPanX), maxPanX);
      translateY.value = Math.min(Math.max(newY, -maxPanY), maxPanY);
    },
    onEnd: () => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    },
  });

  // Create an animated style for the map container
  const mapZoomStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ]
    };
  });

  // Add a new state variable to track visibility of missing countries
  const [showMissingCountries, setShowMissingCountries] = useState(false);

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
        <View style={styles.scoreboardContainer}>
          {/* Display score for solo mode */}
          {gameType === "solo" ? (
            <>
              {/* Left: Solo score with fixed width */}
              <View style={{width: 120, alignItems: 'center'}}>
                <Text style={styles.score}>
                  {score} countries
                </Text>
              </View>
              
              {/* Middle: Timer */}
              <View style={styles.centeredTimerContainer}>
                <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
              </View>
              
              {/* Right: Empty space for balance with same width as left */}
              <View style={{width: 120}}></View>
            </>
          ) : (
            <>
              {/* Left: User card */}
              {!!gameData?.scoreList?.length && 
                gameData.scoreList
                  .filter(e => e.uid === currentUser.uid)
                  .map(e => (
                    <TouchableOpacity
                      key={e.uid}
                      onPress={() => handleCardPress({ ...e, isCur: true })}
                    >
                      <Animated.View 
                        style={[
                          styles.scoreCard, 
                          styles.userScoreCard,
                          userScoreAnimatedStyle
                        ]}
                      >
                        <Text 
                          style={styles.playerName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          You
                        </Text>
                        <Text style={styles.playerScore}>
                          {e.score}/196
                        </Text>
                      </Animated.View>
                    </TouchableOpacity>
                  ))
              }
              
              {/* Middle: Timer */}
              <View style={styles.centeredTimerContainer}>
                <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
              </View>
              
              {/* Right: Opponent card */}
              {!!gameData?.scoreList?.length && 
                gameData.scoreList
                  .filter(e => e.uid !== currentUser.uid)
                  .map(e => (
                    <TouchableOpacity
                      key={e.uid}
                      onPress={() => handleCardPress({ ...e, isCur: false })}
                    >
                      <Animated.View 
                        style={[
                          styles.scoreCard, 
                          styles.opponentScoreCard,
                          opponentScoreAnimatedStyle
                        ]}
                      >
                        <Text 
                          style={styles.playerName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {gameData?.opponentUsername || "Challenger"}
                        </Text>
                        <Text style={styles.playerScore}>
                          {e.score}/196
                        </Text>
                      </Animated.View>
                    </TouchableOpacity>
                  ))
              }
            </>
          )}
        </View>
      </View>

      {/* Vertical toggle buttons on the right */}
      <View style={styles.toggleButtonsContainer}>
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={toggleMusic}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={localMusicEnabled ? "music-note" : "music-off"} 
            size={22} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowMissingCountries(!showMissingCountries)}
        >
          <MaterialIcons
            name={showMissingCountries ? "visibility" : "visibility-off"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>
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

      <View style={styles.gameMapContainer}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PinchGestureHandler onGestureEvent={onPinchGestureEvent}>
            <Animated.View style={{ flex: 1 }}>
              <PanGestureHandler onGestureEvent={onPanGestureEvent}>
                <Animated.View style={[styles.mapBackgroundContainer, mapZoomStyle]}>
                  <MapView 
                    onContainerLayout={onContainerLayout}
                    containerHeight={containerHeight}
                    countryPaths={countryPaths}
                    guessedCountries={guessedCountries}
                    gameType={gameType}
                    mapWidth={mapWidth}
                    gameDataCountry={gameData?.country || []}
                    currentUid={currentUser?.uid}
                    showMissingCountries={showMissingCountries}
                  />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PinchGestureHandler>
        </GestureHandlerRootView>
      </View>

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
    width: '100%',
    paddingTop: 10,
    paddingBottom: 10,
  },
  scoreboardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  scoreCardsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
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
    backgroundColor: "#92c47b", // Green color for user's card
  },
  opponentScoreCard: {
    backgroundColor: "#0089c2", // Blue color for opponent's card
  },
  playerName: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    width: "100%",
    textAlign: "center",
  },
  playerScore: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  centeredTimerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
  toggleButtonsContainer: {
    position: 'absolute',
    right: 6,
    top: 230, // Increased from 120 to 180 to move them lower
    zIndex: 10,
    flexDirection: 'column',
    alignItems: 'center',
  },
  toggleButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
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
  mapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#2D7DD2', // Add back the blue ocean color
    borderRadius: 10, // Optional: rounded corners for the map area
  },
  mapContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2D7DD2', // Also add the blue color here for consistency
  },
  gameMapContainer: {
    flex: 1,
    width: '100%',
    marginVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#2D7DD2', // Blue ocean color
  },
  mapBackgroundContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#2D7DD2', // Keep blue background here
  },
});
