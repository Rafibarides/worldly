import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { mockGameSettings } from "../../utils/mockData";
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

export default function GameScreen() {
  const { currentUser } = useAuth();
  const navigation = useNavigation();

  const [isLoading, setIsLoading] = useState(false);

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

  const handleStartSoloGame = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate("GamePlay", {
        gameType: "solo",
        settings: mockGameSettings.difficultyLevels.medium,
      });
    }, 500);
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

  // UPDATED: Fetch incoming challenge requests and also fetch challenger details
  useEffect(() => {
    if (currentUser) {
      const challengesRef = collection(database, "challenges");

      // Query for challenges where currentUser is challenged.
      const qChallenged = query(
        challengesRef,
        where("challengedId", "==", currentUser.uid),
        where("status", "==", "pending")
      );

      // Query for challenges where currentUser is the challenger.
      const qChallenger = query(
        challengesRef,
        where("challengerId", "==", currentUser.uid),
        where("status", "==", "pending")
      );

      let challengedRequests = [];
      let challengerRequests = [];

      const unsubscribeChallenged = onSnapshot(qChallenged, (snapshot) => {
        (async () => {
          challengedRequests = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              // For challenges where you are challenged, your opponent is the challenger.
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
          <View style={styles.titlePill}>
            <Animated.Image
              source={require("../../../assets/images/start-up1.png")}
              style={[styles.titleIcon, iconAnimatedStyle]}
            />
            <Text style={styles.titleText}>Start New Game</Text>
          </View>
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
                <Text style={styles.optionDescription}>Timed</Text>
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

        {/* NEW: Container for the Rejoin Challenge Button */}
        <View style={styles.rejoinButtonContainer}>
          <RejoinChallengeButton currentUser={currentUser} />
        </View>

        {/* Settings info */}
        <View style={styles.settingsInfo}>
          <Text style={styles.settingsTitle}>Game Settings</Text>
          <View style={styles.settingCardsContainer}>
            <View style={styles.settingCard}>
              <MaterialIcons name="timer" size={20} color="#fff" />
              <Text style={styles.settingCardText}>
                Time Limit: 15 min
              </Text>
            </View>
            <View style={styles.settingCard}>
              <MaterialIcons name="emoji-events" size={20} color="#fff" />
              <Text style={styles.settingCardText}>
                Points per Country: 1
              </Text>
            </View>
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
});
