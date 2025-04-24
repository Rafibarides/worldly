import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import {
  doc,
  query,
  where,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
} from "firebase/firestore";
import { database } from "../../services/firebase";
import { useNavigation } from "@react-navigation/native";
import RejoinChallengeButton from '../../components/RejoinChallengeButton';
import Toast from 'react-native-toast-message';
import { Audio } from 'expo-av';
import SelectionModal from './SelectionModal';
import CapitalsGame from './CapitalsGame';

export default function GameScreen() {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a ref to store sound objects
  const soundRef = useRef(null);
  // Define initialLoadRef at the component level, not inside the useEffect
  const initialLoadRef = useRef(true);
  
  // Add this near the top of your component with other state variables
  const [appJustOpened, setAppJustOpened] = useState(true);
  
  // Add this useEffect to detect if the app was just opened
  useEffect(() => {
    // Set a flag that the app just opened
    setAppJustOpened(true);
    
    // After a short delay, reset the flag
    const timer = setTimeout(() => {
      setAppJustOpened(false);
    }, 3000); // 3 seconds should be enough for initial loads
    
    return () => clearTimeout(timer);
  }, []);
  
  // Setup audio session function that will be used inside the component
  useEffect(() => {
    let audioSessionInitialized = false;
    
    const setupAudio = async () => {
      try {
        // Only initialize once
        if (!audioSessionInitialized) {
          await Audio.setAudioModeAsync({
            playsInSilentMode: true,
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
          });
          audioSessionInitialized = true;
          console.log('Audio session initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing audio session:', error);
      }
    };
    
    setupAudio();
    
    // Clean up any sounds when component unmounts
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Update the playChallengeSound function
  const playChallengeSound = async () => {
    try {
      // Try to initialize audio session first (this is crucial!)
      await Audio.setAudioModeAsync({
        playsInSilentMode: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      
      // Create and load the sound with proper error handling
      const soundObject = new Audio.Sound();
      await soundObject.loadAsync(require('../../../assets/sound/chalReq.mp3'));
      
      // Store in ref for cleanup
      soundRef.current = soundObject;
      
      // Play the sound
      await soundObject.playAsync();
      
      // Unload sound when finished playing
      soundObject.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          soundObject.unloadAsync().catch(error => {
            console.log('Error unloading sound:', error);
          });
          if (soundRef.current === soundObject) {
            soundRef.current = null;
          }
        }
      });
    } catch (error) {
      console.error("Error playing challenge sound:", error);
    }
  };

  // Similarly for friend request sound
  const playFriendRequestSound = async () => {
    try {
      // Unload any previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      // Create and load the sound
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/sound/friendReq.mp3')
      );
      
      // Store in ref for cleanup
      soundRef.current = sound;
      
      // Play the sound
      await sound.playAsync();
      
      // Unload sound when finished playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync().catch(error => {
            console.log('Error unloading sound:', error);
          });
          soundRef.current = null;
        }
      });
    } catch (error) {
      console.error("Error playing friend request sound:", error);
    }
  };

  const headerFade = useSharedValue(1);

  useEffect(() => {
    headerFade.value = withRepeat(
      withTiming(0.85, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const soloOptionAnim = useSharedValue(0);
  const multiOptionAnim = useSharedValue(0);

  useEffect(() => {
    soloOptionAnim.value = withDelay(500, withTiming(1, { duration: 500 }));
    multiOptionAnim.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, []);
  
  const animatedSoloOptionStyle = useAnimatedStyle(() => {
    return {
      opacity: soloOptionAnim.value,
      transform: [{ translateY: (1 - soloOptionAnim.value) * 20 }],
    };
  });

  const animatedMultiOptionStyle = useAnimatedStyle(() => {
    return {
      opacity: multiOptionAnim.value,
      transform: [{ translateY: (1 - multiOptionAnim.value) * 20 }],
    };
  });

  const AnimatedTouchableOpacity =
    Animated.createAnimatedComponent(TouchableOpacity);

  // Add this state variable near the top of the component
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);

  // Update the handleStartSoloGame function
  const handleStartSoloGame = () => {
    // Instead of starting the game directly, show the selection modal
    setSelectionModalVisible(true);
  };

  // Update the handleGameTypeSelection function
  const handleGameTypeSelection = (gameType) => {
    setSelectionModalVisible(false);
    
    if (gameType === 'countries') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate("GamePlay", {
          gameType: "solo",
          settings: defaultGameSettings,
        });
      }, 500);
    } else if (gameType === 'capitals') {
      // Try directly navigating without reset
      console.log('Attempting to navigate to CapitalsGame...');
      
      // Just use regular navigation
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate("CapitalsGame");
      }, 300);
    } else if (gameType === 'flags') {
      // Use the same pattern as for CapitalsGame
      console.log('Attempting to navigate to FlagsGame...');
      
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate("FlagsGame");
      }, 300);
    }
  };

  const handleStartMultiplayerGame = () => {
    navigation.navigate("Friends");
  };

  // Add icon animation
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue(0);

  useEffect(() => {
    // Start the icon animation after a slight delay
    iconScale.value = withDelay(
      300,
      withSequence(
        withSpring(1.3, {
          damping: 4,
          stiffness: 80,
        }),
        withSpring(1, {
          damping: 6,
          stiffness: 100,
        })
      )
    );

    // Add a subtle rotation effect
    iconRotate.value = withDelay(
      300,
      withSequence(
        withSpring(-0.2, {
          damping: 4,
          stiffness: 80,
        }),
        withSpring(0, {
          damping: 6,
          stiffness: 100,
        })
      )
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: iconScale.value },
        { rotate: `${iconRotate.value}rad` },
      ],
    };
  });

  // NEW: State for challenge requests and toggle visibility.
  const [challengeRequests, setChallengeRequests] = useState([]);
  const [showChallengeRequests, setShowChallengeRequests] = useState(false);
  const [highlightedChallengeId, setHighlightedChallengeId] = useState(null);

  // UPDATED: Fetch incoming challenge requests and also fetch challenger details
  useEffect(() => {
    if (currentUser) {
      let challengedRequests = [];
      let challengerRequests = [];
      // Keep track of challenges we've already shown notifications for
      const notifiedChallenges = new Set();
      
      // Query for challenges where the current user is the challenged player
      const qChallenged = query(
        collection(database, "challenges"),
        where("challengedId", "==", currentUser.uid),
        where("status", "==", "pending")
      );

      // Query for challenges where the current user is the challenger
      const qChallenger = query(
        collection(database, "challenges"),
        where("challengerId", "==", currentUser.uid),
        where("status", "==", "pending")
      );

      const unsubscribeChallenged = onSnapshot(qChallenged, (snapshot) => {
        (async () => {
          // Check for new challenges to show toast notifications
          const newChallenges = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => ({
              id: change.doc.id,
              ...change.doc.data()
            }))
            // Only show notifications for challenges we haven't notified about yet
            .filter(challenge => !notifiedChallenges.has(challenge.id));
            
          // Play sound ONLY if:
          // 1. There are new challenges
          // 2. We're past the initial load (initialLoadRef.current is false)
          // 3. The app wasn't just opened (appJustOpened is false)
          if (newChallenges.length > 0 && !initialLoadRef.current && !appJustOpened) {
            playChallengeSound();
          }
          
          // After processing this snapshot, mark that we're past the initial load
          if (initialLoadRef.current) {
            initialLoadRef.current = false;
          }
          
          // Show toast for each new challenge
          for (const newChallenge of newChallenges) {
            // Add to our set of notified challenges
            notifiedChallenges.add(newChallenge.id);
            
            // Get challenger details
            const challengerId = newChallenge.challengerId;
            const challengerRef = doc(database, "users", challengerId);
            const challengerSnap = await getDoc(challengerRef);
            const challengerData = challengerSnap.exists()
              ? challengerSnap.data()
              : { username: "Unknown" };
              
            // Preload the avatar image before showing the toast
            const avatarUrl = challengerData.avatarUrl || null;
            
            // Use a small delay to ensure UI is responsive
            setTimeout(async () => {
              // Preload the image
              await preloadImage(avatarUrl);
              
              // Now show the toast with the preloaded image
              Toast.show({
                type: 'challenge',
                text1: 'New Challenge Request!',
                text2: `${challengerData.username} has challenged you to a game`,
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                topOffset: 60,
                props: {
                  avatarUrl: avatarUrl,
                  challengeId: newChallenge.id
                },
                onPress: () => {
                  // Navigate to the Game screen first (this is safe even if we're already there)
                  navigation.navigate('Game');
                  
                  // Set a small delay to ensure navigation completes before showing the panel
                  setTimeout(() => {
                    setShowChallengeRequests(true);
                    
                    // Find the challenge in the list and highlight it
                    const challengeIndex = challengeRequests.findIndex(item => item.id === newChallenge.id);
                    if (challengeIndex !== -1) {
                      // You could add some state to highlight this item in the UI
                      setHighlightedChallengeId(newChallenge.id);
                      
                      // Clear the highlight after a short delay
                      setTimeout(() => {
                        setHighlightedChallengeId(null);
                      }, 2000);
                    }
                  }, 300);
                }
              });
            }, 300); // Small delay to ensure UI responsiveness
          }

          challengedRequests = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              // For challenges where you are the challenged player, your opponent is the challenger.
              const opponentId = data.challengerId;
              const opponentRef = doc(database, "users", opponentId);
              const opponentSnap = await getDoc(opponentRef);
              const opponentData = opponentSnap.exists()
                ? opponentSnap.data()
                : { username: "Unknown", avatarUrl: "" };
              return { id: docSnap.id, ...data, opponent: opponentData };
            })
          );
          const merged = [...challengedRequests, ...challengerRequests].sort(
            (a, b) => b.createdAt - a.createdAt
          );
          setChallengeRequests(merged.slice(0, 4));
        })();
      });

      const unsubscribeChallenger = onSnapshot(qChallenger, (snapshot) => {
        (async () => {
          challengerRequests = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              // For challenges where you are the challenger, your opponent is the challenged friend.
              const opponentId = data.challengedId;
              const opponentRef = doc(database, "users", opponentId);
              const opponentSnap = await getDoc(opponentRef);
              const opponentData = opponentSnap.exists()
                ? opponentSnap.data()
                : { username: "Unknown", avatarUrl: "" };
              return { id: docSnap.id, ...data, opponent: opponentData };
            })
          );
          const merged = [...challengedRequests, ...challengerRequests].sort(
            (a, b) => b.createdAt - a.createdAt
          );
          setChallengeRequests(merged.slice(0, 4));
        })();
      });

      return () => {
        unsubscribeChallenged();
        unsubscribeChallenger();
      };
    }
  }, [currentUser]);

  // NEW: Handler to accept a challenge request.
  const handleAcceptChallenge = async (challengeItem) => {
    try {
      const challengeRef = doc(database, "challenges", challengeItem.id);
      // For a challenged user, update the flag indicating they've joined.
      await updateDoc(challengeRef, { challengedJoined: true });
      // Navigate to the PendingRoom screen passing your opponent's details.
      navigation.navigate("PendingRoom", {
        challengedFriend: challengeItem.opponent,
        challengeId: challengeItem.id,
      });
    } catch (error) {
      console.error("Error accepting challenge:", error);
      Alert.alert("Error", "Failed to accept challenge. Please try again.");
    }
  };

  // New handler for challengers rejoining an active challenge.
  const handleRejoinChallenge = async (challengeItem) => {
    try {
      // For rejoining, simply navigate back to the PendingRoom with the relevant challenge.
      navigation.navigate("PendingRoom", {
        challengedFriend: challengeItem.opponent,
        challengeId: challengeItem.id,
      });
    } catch (error) {
      console.error("Error rejoining challenge:", error);
      Alert.alert("Error", "Failed to rejoin challenge. Please try again.");
    }
  };

  // Inside your component, add this function to preload images
  const preloadImage = (uri) => {
    return new Promise((resolve, reject) => {
      if (!uri) {
        resolve(null);
        return;
      }
      
      Image.prefetch(uri)
        .then(() => {
          resolve(uri);
        })
        .catch((error) => {
          console.warn("Error preloading image:", error);
          resolve(null); // Resolve with null to continue the flow
        });
    });
  };

  // Add this useEffect to listen for friend requests
  useEffect(() => {
    if (currentUser) {
      // Keep track of friend requests we've already shown notifications for
      const notifiedFriendRequests = new Set();
      
      // Query for friendships where the current user is the requestee (recipient) and status is pending
      const qFriendRequests = query(
        collection(database, "friendships"),
        where("requesteeId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      
      const unsubscribeFriendRequests = onSnapshot(qFriendRequests, (snapshot) => {
        (async () => {
          // Check for new friend requests to show toast notifications
          const newFriendRequests = snapshot.docChanges()
            .filter(change => change.type === 'added')
            .map(change => ({
              id: change.doc.id,
              ...change.doc.data()
            }))
            // Only show notifications for requests we haven't notified about yet
            .filter(request => !notifiedFriendRequests.has(request.id));
            
          // Play sound ONLY if:
          // 1. There are new friend requests
          // 2. We're past the initial load
          // 3. The app wasn't just opened from a notification
          if (newFriendRequests.length > 0 && !initialLoadRef.current && !appJustOpened) {
            playFriendRequestSound();
          }
          
          // After the first load, set initialLoad to false
          if (initialLoadRef.current) {
            initialLoadRef.current = false;
          }
          
          // Show toast for each new friend request
          for (const newRequest of newFriendRequests) {
            // Add to our set of notified friend requests
            notifiedFriendRequests.add(newRequest.id);
            
            // Get requester details
            const requesterId = newRequest.requesterId;
            const requesterRef = doc(database, "users", requesterId);
            const requesterSnap = await getDoc(requesterRef);
            const requesterData = requesterSnap.exists()
              ? requesterSnap.data()
              : { username: "Unknown" };
              
            // Preload the avatar image before showing the toast
            const avatarUrl = requesterData.avatarUrl || null;
            
            // Use a small delay to ensure UI is responsive
            setTimeout(async () => {
              // Preload the image
              await preloadImage(avatarUrl);
              
              // Now show the toast with the preloaded image
              Toast.show({
                type: 'friendRequest',
                text1: 'New Friend Request!',
                text2: `${requesterData.username} wants to be your friend`,
                position: 'top',
                visibilityTime: 4000,
                autoHide: true,
                topOffset: 60,
                props: {
                  avatarUrl: avatarUrl,
                  friendshipId: newRequest.id,
                  requesterId: requesterId
                },
                onPress: () => {
                  // Navigate to the Friends screen to see the request
                  navigation.navigate('Friends');
                }
              });
            }, 300); // Small delay to ensure UI responsiveness
          }
        })();
      });
      
      return () => {
        unsubscribeFriendRequests();
      };
    }
  }, [currentUser, navigation]);

  // Add these state variables at the top of the component
  const [timeInfoModalVisible, setTimeInfoModalVisible] = useState(false);
  const [pointsInfoModalVisible, setPointsInfoModalVisible] = useState(false);
  const [gameInfoModalVisible, setGameInfoModalVisible] = useState(false);

  const defaultGameSettings = {
    timeLimit: 120,
    difficulty: "medium",
    region: "world"
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Setting up your game...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#b1d88a", "#87c66b"]}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.titlePill}
            onPress={() => setGameInfoModalVisible(true)}
          >
            <Animated.Image
              source={require("../../../assets/images/start-up1.png")}
              style={[styles.titleIcon, iconAnimatedStyle]}
            />
            <Text style={styles.titleText}>Start New Game</Text>
          </TouchableOpacity>
        </View>

        {/* Game options */}
        <View style={styles.contentContainer}>
          <AnimatedTouchableOpacity
            style={[styles.gameOption, animatedSoloOptionStyle]}
            activeOpacity={1}
            onPress={handleStartSoloGame}
            disabled={isLoading}
          >
            <View style={styles.optionContent}>
              <MaterialIcons name="person" size={32} color="#ffc268" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Solo Game</Text>
                <Text style={styles.optionDescription}>Timed, earn points</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
          </AnimatedTouchableOpacity>

          <AnimatedTouchableOpacity
            style={[styles.gameOption, animatedMultiOptionStyle]}
            activeOpacity={1}
            onPress={handleStartMultiplayerGame}
            disabled={isLoading}
          >
            <View style={styles.optionContent}>
              <MaterialIcons name="groups" size={32} color="#ffc268" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Multiplayer Game</Text>
                <Text style={styles.optionDescription}>Compete with friends</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
          </AnimatedTouchableOpacity>
        </View>

        {/* Rejoin Game Button Container */}
        <View style={styles.rejoinButtonContainer}>
          <RejoinChallengeButton />
        </View>

        {/* Settings info */}
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsTitle}>Game Settings</Text>
          <View style={styles.settingCardsContainer}>
            <TouchableOpacity 
              style={styles.settingCard}
              onPress={() => setTimeInfoModalVisible(true)}
            >
              <MaterialIcons name="timer" size={20} color="#fff" />
              <Text style={styles.settingCardText}>
                Time Limit: 15 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingCard}
              onPress={() => setPointsInfoModalVisible(true)}
            >
              <MaterialIcons name="emoji-events" size={20} color="#fff" />
              <Text style={styles.settingCardText}>
                Points per Country: 1
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Challenge Requests Button */}
        <TouchableOpacity
          style={styles.challengeRequestsButton}
          onPress={() => setShowChallengeRequests(!showChallengeRequests)}
        >
          <MaterialIcons name="notifications" size={24} color="#fff" />
          {challengeRequests.length > 0 && <View style={styles.challengeDot} />}
        </TouchableOpacity>

        {/* Challenge Requests List */}
        {showChallengeRequests && (
          <View style={styles.challengeRequestsContainer}>
            <Text style={styles.challengeRequestsHeader}>Incoming Challenges</Text>
            {challengeRequests.length === 0 ? (
              <Text style={styles.noRequestsText}>No pending challenges</Text>
            ) : (
              <FlatList
                data={challengeRequests}
                renderItem={({ item }) => (
                  <View style={styles.requestItem}>
                    <Text style={styles.requestText}>
                      {item.opponent?.username || "Unknown"}
                    </Text>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptChallenge(item)}
                    >
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                style={{ maxHeight: 200 }}
              />
            )}
          </View>
        )}
      </View>

      {/* Time Info Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={timeInfoModalVisible}
        onRequestClose={() => setTimeInfoModalVisible(false)}
        presentationStyle="overFullScreen"
        supportedOrientations={['portrait','landscape']}
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.infoModalContent}>
              <MaterialIcons name="timer" size={40} color="#fff" style={styles.modalIcon} />
              <Text style={styles.infoModalTitle}>Time Limit: 15 Minutes</Text>
              <Text style={styles.infoModalDescription}>
                You have 15 minutes to guess as many countries as you can. The clock starts ticking as soon as the game begins!
              </Text>
              <Text style={styles.infoModalDescription}>
                In multiplayer mode, if you guess more countries than your opponent before time runs out, you win the game.
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setTimeInfoModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Points Info Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={pointsInfoModalVisible}
        onRequestClose={() => setPointsInfoModalVisible(false)}
        presentationStyle="overFullScreen"
        supportedOrientations={['portrait','landscape']}
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.infoModalContent}>
              <MaterialIcons name="emoji-events" size={40} color="#fff" style={styles.modalIcon} />
              <Text style={styles.infoModalTitle}>Points System</Text>
              <Text style={styles.infoModalDescription}>
                You earn 1 point for each country you correctly guess. Countries can be guessed in any order.
              </Text>
              <Text style={styles.infoModalDescription}>
                Only sovereign nations are accepted as valid answers. Territories, dependencies, and disputed regions are counted.
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setPointsInfoModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Game Info Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={gameInfoModalVisible}
        onRequestClose={() => setGameInfoModalVisible(false)}
        presentationStyle="overFullScreen"
        supportedOrientations={['portrait','landscape']}
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.infoModalContent}>
              <Animated.Image
                source={require("../../../assets/images/start-up1.png")}
                style={[styles.modalIcon, { width: 40, height: 40 }]}
              />
              <Text style={styles.infoModalTitle}>Game Options</Text>
              <Text style={styles.infoModalDescription}>
                Choose between a <Text style={{fontWeight: 'bold'}}>solo game</Text> to test your geography knowledge, or challenge a friend to a <Text style={{fontWeight: 'bold'}}>multiplayer</Text> match!
              </Text>
              <Text style={styles.infoModalDescription}>
                Select one of the two play modes to start a game.
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setGameInfoModalVisible(false)}
              >
                <Text style={styles.closeModalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add the SelectionModal component */}
      <SelectionModal
        visible={selectionModalVisible}
        onClose={() => setSelectionModalVisible(false)}
        onSelectOption={handleGameTypeSelection}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(177, 216, 138, 1)",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
  },
  header: {
    width: "100%",
    marginBottom: 30,
    paddingLeft: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
  gameOption: {
    width: "90%",
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 15,
    paddingHorizontal: 20,
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  optionText: {
    marginLeft: 15,
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4f7a3a",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#4f7a3a",
  },
  settingsInfo: {
    padding: 20,
    alignItems: "flex-start",
    width: "90%",
    marginTop: 30,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
    textAlign: "left",
  },
  settingCardsContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  settingCard: {
    backgroundColor: "#8fce75",
    borderRadius: 10,
    padding: 10,
    height: 100,
    width: 100,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    justifyContent: "center",
    margin: 10,
  },
  settingCardText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  titlePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7dbc63",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderColor: "#ffffff",
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  titleIcon: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  // NEW: Style for the challenge requests button (floating in the top right)
  challengeRequestsButton: {
    position: "absolute",
    top: 80,
    right: 20,
    backgroundColor: "#7dbc63",
    padding: 10,
    borderRadius: 25,
    zIndex: 100,
  },
  // NEW: Styles for the challenge requests container
  challengeRequestsContainer: {
    position: "absolute",
    top: 120,
    right: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    width: 250,
    maxHeight: 300,
    elevation: 5,
    zIndex: 100,
  },
  challengeRequestsHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noRequestsText: {
    fontSize: 16,
    color: "#666",
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  requestText: {
    fontSize: 16,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: "#ffc268",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  challengeDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    borderColor: "#fff",
  },
  // NEW: Style for the rejoin button container
  rejoinButtonContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',   // a touch darker
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoModalContent: {
    width: Platform.isPad ? '70%' : '90%',
    maxWidth: Platform.isPad ? 400 : 420,
    backgroundColor: '#87c66b',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: 15,
  },
  infoModalTitle: {
    fontSize: Platform.isPad ? 20 : 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoModalDescription: {
    fontSize: Platform.isPad ? 14 : 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: Platform.isPad ? 20 : 22,
  },
  closeModalButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  closeModalButtonText: {
    color: "#ffc268",
    fontWeight: "bold",
    fontSize: 16,
  },
});
