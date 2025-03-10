import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import socket from "../../services/socket";
import { useAuth } from "../../contexts/AuthContext";
import {
  doc,
  onSnapshot,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "../../services/firebase";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import tipsData from "../../utils/tips.json";

export default function PendingRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { challengedFriend, challengeId } = route.params;
  const { currentUser } = useAuth();
  const [challenge, setChallenge] = useState(null);
  // partnerStatus can be "waiting", "joined", or "left"
  const [partnerStatus, setPartnerStatus] = useState("waiting");
  // NEW: Flag to indicate that the game has been initiated so that we ignore further cancellation updates.
  const [gameInitiated, setGameInitiated] = useState(false);

  // Add a ref to prevent duplicate missed challenge logs
  const missedLogCreated = useRef(false);

  // Add animation values
  const startButtonScale = useSharedValue(1);
  const waitingOpacity = useSharedValue(1);
  const iconRotation = useSharedValue(0);

  // Add state for the current tip
  const [currentTip, setCurrentTip] = useState("");

  // Animation for the waiting indicator
  useEffect(() => {
    if (partnerStatus !== "joined") {
      waitingOpacity.value = withRepeat(
        withSequence(
          withDelay(500, withSpring(0.6)),
          withDelay(500, withSpring(1))
        ),
        -1,
        true
      );

      iconRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
    } else {
      // When partner joins, animate the start button
      startButtonScale.value = withRepeat(
        withSequence(withSpring(1.05), withSpring(1)),
        3,
        true
      );
    }
  }, [partnerStatus]);

  // Animated styles
  const waitingAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: waitingOpacity.value,
    };
  });

  const startButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: startButtonScale.value }],
    };
  });

  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${iconRotation.value}deg` }],
    };
  });

  // Select a random tip when component mounts
  useEffect(() => {
    if (tipsData && tipsData.tips && tipsData.tips.length > 0) {
      const randomIndex = Math.floor(Math.random() * tipsData.tips.length);
      setCurrentTip(tipsData.tips[randomIndex]);
    }
  }, []);

  useEffect(() => {
    // Listen to challenge document changes
    const challengeRef = doc(database, "challenges", challengeId);
    const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
      if (docSnap.exists()) {
        const challengeData = docSnap.data();

        // If the challenge has been cancelled or completed and the game hasn't been initiated, then leave.
        if (
          !gameInitiated &&
          (challengeData.status === "cancelled" ||
            challengeData.status === "completed")
        ) {
          // Only leave if the game has not started.
          AsyncStorage.removeItem("activeChallenge");
          navigation.goBack();
          return;
        } else if (
          // If the challenge status is active (or accepted) and the gameId exists,
          // navigate to GamePlay only if the game hasn't been initiated already.
          (challengeData.status === "active" ||
            challengeData.status === "accepted") &&
          challengeData.gameId &&
          !gameInitiated
        ) {
          // It might be that the other participant has joined.
          // However, if startGame has been triggered locally, we are already navigating.
          navigation.replace("GamePlay", {
            gameType: "multiplayer",
            gameId: challengeData.gameId,
            challengeId,
            settings: {}, // Additional game settings if needed.
          });
          return;
        }

        // For status "pending", keep the active challenge stored.
        setChallenge(challengeData);

        // Update partner status based on the user's role.
        if (currentUser.uid === challengeData.challengerId) {
          setPartnerStatus(
            challengeData.challengedJoined ? "joined" : "waiting"
          );
        } else if (currentUser.uid === challengeData.challengedId) {
          setPartnerStatus(
            challengeData.challengerJoined ? "joined" : "waiting"
          );
        }

        // Join socket room with the correct gameId.
        socket.emit("joinGame", {
          gameId: challengeData.gameId,
          userId: currentUser.uid,
        });
      }
    });

    return () => unsubscribe();
  }, [challengeId, gameInitiated, navigation]);

  // Create a challenge room id based on the two users - for simplicity we'll use a concatenation.
  const challengeRoomId =
    currentUser && challengedFriend
      ? `${currentUser.uid}_${challengedFriend.uid}`
      : "defaultRoom";

  // Navigation listeners to set/clear the joined flag when the user enters/leaves the pending room.
  useEffect(() => {
    const challengeRef = doc(database, "challenges", challengeId);

    const focusListener = navigation.addListener("focus", async () => {
      const docSnap = await getDoc(challengeRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (currentUser.uid === data.challengerId && !data.challengerJoined) {
          await updateDoc(challengeRef, { challengerJoined: true });
        } else if (
          currentUser.uid === data.challengedId &&
          !data.challengedJoined
        ) {
          await updateDoc(challengeRef, { challengedJoined: true });
        }
      }
      // Persist the active challenge ID locally so that the RejoinChallengeButton finds it.
      await AsyncStorage.setItem("activeChallenge", challengeId);

      // Notify the room that this user has joined.
      socket.emit("playerJoined", {
        userId: currentUser.uid,
        roomId: challengeRoomId,
      });
    });

    const blurListener = navigation.addListener("blur", async () => {
      const docSnap = await getDoc(challengeRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        let updateObj = {};
        if (currentUser.uid === data.challengerId) {
          updateObj.challengerJoined = false;
        }
        if (currentUser.uid === data.challengedId) {
          updateObj.challengedJoined = false;
        }
        await updateDoc(challengeRef, updateObj);

        // Notify the room that this user has left.
        socket.emit("playerLeft", {
          userId: currentUser.uid,
          roomId: challengeRoomId,
        });

        // After updating, if both users have left, cancel the challenge
        const updatedSnap = await getDoc(challengeRef);
        if (updatedSnap.exists()) {
          const updatedData = updatedSnap.data();
          if (!updatedData.challengerJoined && !updatedData.challengedJoined) {
            await updateDoc(challengeRef, { status: "cancelled" });
            // Now that the challenge is cancelled, create a missed challenge log.
            await createMissedChallengeLog();
          }
        }

        // Remove the active challenge ID
        AsyncStorage.removeItem("activeChallenge");
      }
    });

    return () => {
      focusListener();
      blurListener();
    };
  }, [navigation, challengeId, currentUser]);

  // New effect to listen for partner socket events.
  useEffect(() => {
    const handlePlayerJoined = ({ userId }) => {
      if (challengedFriend && userId === challengedFriend.uid) {
        setPartnerStatus("joined");
      }
    };
    const handlePlayerLeft = ({ userId }) => {
      if (challengedFriend && userId === challengedFriend.uid) {
        setPartnerStatus("left");
      }
    };
    socket.on("playerJoined", handlePlayerJoined);
    socket.on("playerLeft", handlePlayerLeft);
    return () => {
      socket.off("playerJoined", handlePlayerJoined);
      socket.off("playerLeft", handlePlayerLeft);
    };
  }, [challengedFriend, challengeRoomId]);

  // Replace the existing createMissedChallengeLog function with the following:
  const createMissedChallengeLog = async () => {
    // Prevent duplicate logs.
    if (missedLogCreated.current) return;

    // Re-read the latest challenge data from Firestore.
    const challengeRef = doc(database, "challenges", challengeId);
    const docSnap = await getDoc(challengeRef);
    if (!docSnap.exists()) return;
    const latestChallenge = docSnap.data();

    // Only proceed if the challenge exists, its status is 'cancelled',
    // and the challenged user never joined.
    if (
      !(
        latestChallenge &&
        latestChallenge.status === "cancelled" &&
        !latestChallenge.challengedJoined
      )
    )
      return;
    missedLogCreated.current = true;

    let initiatorId, friendId, friendName, friendAvatar;
    if (currentUser.uid === challenge.challengerId) {
      // Current user is the challenger — log the missed challenge for the challenged friend.
      // In this case, the missed log will be sent to the challenged friend.
      initiatorId = challenge.challengedId;
      friendId = challenge.challengerId;
      friendName = currentUser.username;
      friendAvatar =
        currentUser.avatarUrl ||
        "https://api.dicebear.com/9.x/avataaars/png?seed=default";
    } else {
      // Otherwise, current user is the challenged friend who never joined.
      // Log the missed challenge so the challenged user sees it.
      initiatorId = challenge.challengedId; // equals currentUser.uid
      friendId = challenge.challengerId;
      friendName =
        challengedFriend && challengedFriend.username
          ? challengedFriend.username
          : "Challenger";
      friendAvatar =
        challengedFriend && challengedFriend.avatarUrl
          ? challengedFriend.avatarUrl
          : "https://api.dicebear.com/9.x/avataaars/png?seed=default";
    }

    try {
      const missedChallengesRef = collection(database, "missedChallenges");
      await addDoc(missedChallengesRef, {
        initiatorId,
        friendId,
        friendName,
        friendAvatar,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating missed challenge log:", error);
    }
  };

  // Modify the existing handleCancel function to update the challenge status
  const handleCancel = async () => {
    try {
      // Only proceed with cancellation if the challenge is still pending.
      if (challenge && challenge.status === "pending") {
        await updateDoc(doc(database, "challenges", challengeId), {
          status: "cancelled",
        });

        // Since the challenge is now cancelled, trigger missed challenge log creation.
        await createMissedChallengeLog();
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("Home"); // fallback to Home screen if no screen to go back to
      }
    } catch (error) {
      console.error("Error cancelling challenge:", error);
      Alert.alert("Error", "Failed to cancel challenge.");
    }
  };

  // Handler for manually cancelling the challenge.
  const handleCancelChallenge = async () => {
    const challengeRef = doc(database, "challenges", challengeId);
    await updateDoc(challengeRef, {
      status: "cancelled",
      challengerJoined: false,
      challengedJoined: false,
    });
    navigation.goBack();
  };

  // Handler for starting the game once the friend has joined.
  const startGame = async () => {
    try {
      // Get the challenge reference.
      const challengeRef = doc(database, "challenges", challengeId);

      // Update the challenge document with active status, joined flags, a gameStarted indicator,
      // and record the official game start time.
      await updateDoc(challengeRef, {
        status: "active",
        acceptedAt: serverTimestamp(),
        challengerJoined: true,
        challengedJoined: true,
        gameStarted: true,
        startedAt: serverTimestamp(),
      });

      // Set the local flag so that further cancellation logic is ignored.
      setGameInitiated(true);

      // Store the challenge as the active one for rejoining later
      await AsyncStorage.setItem(
        "activeChallenge",
        JSON.stringify({
          challengeId,
          gameId: challenge.gameId,
        })
      );

      // Navigate to the gameplay screen
      navigation.replace("GamePlay", {
        gameType: "multiplayer",
        gameId: challenge.gameId,
        challengeId,
        settings: {}, // Additional game settings if needed.
      });
    } catch (error) {
      console.error("Error starting game:", error);
      Alert.alert("Error", "Failed to start the game. Please try again.");
    }
  };

  return (
    <LinearGradient colors={["#b1d88a", "#87c66b"]} style={styles.container}>
      <View style={styles.contentContainer}>
        {/* <View style={styles.titlePill}>
          <MaterialIcons name="sports-esports" size={24} color="#fff" />
          <Text style={styles.titleText}>Challenge</Text>
        </View> */}

        <View style={styles.card}>
          <Text style={styles.header}>
            {partnerStatus === "joined" ? "Ready to Play!" : "Challenge Sent"}
          </Text>

          <Text style={styles.info}>
            {partnerStatus === "joined" ? (
              "Opponent has joined"
            ) : partnerStatus === "left" ? (
              <>
                <Text style={{ fontWeight: "bold" }}>
                  {challengedFriend.username}
                </Text>{" "}
                has left the challenge room. Waiting for them to rejoin...
              </>
            ) : (
              <>
                Waiting for{" "}
                <Text style={{ fontWeight: "bold" }}>
                  {challengedFriend.username}
                </Text>{" "}
                to join your challenge...
              </>
            )}
          </Text>

          {partnerStatus === "joined" ? (
            <Animated.View style={startButtonAnimatedStyle}>
              <TouchableOpacity style={styles.startButton} onPress={startGame}>
                <MaterialIcons name="play-arrow" size={24} color="#fff" />
                <Text style={styles.buttonText}>Start Game</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View
              style={[styles.waitingContainer, waitingAnimatedStyle]}
            >
              <Animated.View style={iconAnimatedStyle}>
                <MaterialIcons name="hourglass-top" size={40} color="#ffc166" />
              </Animated.View>
              <Text style={styles.waitText}>
                {currentTip || "Waiting for friend to join..."}
              </Text>
            </Animated.View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <MaterialIcons name="close" size={18} color="#fff" />
            <Text style={styles.cancelText}>Cancel Challenge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 30,
    width: "75%",
    alignItems: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 2,
    color: "#4f7a3a",
  },
  info: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
    lineHeight: 24,
  },
  waitingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  waitText: {
    fontSize: 16,
    marginTop: 15,
    color: "#ffc166",
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 10,
    maxWidth: "100%",
  },
  startButton: {
    backgroundColor: "#ffc268",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical:10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginLeft: 8,
  },
  cancelButton: {
    padding: 14,
    marginTop: 10,
    backgroundColor: "#ff6b6b",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
