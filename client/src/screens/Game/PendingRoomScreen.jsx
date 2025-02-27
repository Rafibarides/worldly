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
import { doc, onSnapshot, getDoc, updateDoc, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { database } from "../../services/firebase";

export default function PendingRoomScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { challengedFriend, challengeId } = route.params;
  const { currentUser } = useAuth();
  const [challenge, setChallenge] = useState(null);
  // partnerStatus can be "waiting", "joined", or "left"
  const [partnerStatus, setPartnerStatus] = useState("waiting");

  // Add a ref to prevent duplicate missed challenge logs
  const missedLogCreated = useRef(false);

  useEffect(() => {
    // Listen to challenge document changes
    const challengeRef = doc(database, "challenges", challengeId);
    const unsubscribe = onSnapshot(challengeRef, (docSnap) => {
      if (docSnap.exists()) {
        const challengeData = docSnap.data();
        // If the challenge is no longer pending, determine next steps:
        if (challengeData.status !== "pending") {
          if (challengeData.status === "accepted" && challengeData.gameId) {
            // Both users navigate to GamePlay if the challenge was accepted.
            navigation.replace("GamePlay", {
              gameType: "multiplayer",
              gameId: challengeData.gameId,
              challengeId,
              // challengerId: challengeData.challengeId,
              // challengedId: challengeData.challengedId,
              settings: {}, // Add specific game settings if needed.
            });
          } else {
            navigation.goBack();
          }
          return;
        }
        setChallenge(challengeData);

        // Update partner status based on the user's role.
        if (currentUser.uid === challengeData.challengerId) {
          // I'm the challenger; my partner joins if challengedJoined is true.
          setPartnerStatus(
            challengeData.challengedJoined ? "joined" : "waiting"
          );
        } else if (currentUser.uid === challengeData.challengedId) {
          // I'm the challenged friend; my partner joins if challengerJoined is true.
          setPartnerStatus(
            challengeData.challengerJoined ? "joined" : "waiting"
          );
        }

        // Join socket room with the correct gameId
        socket.emit("joinGame", {
          gameId: challengeData.gameId,
          userId: currentUser.uid,
        });
      }
    });

    return () => unsubscribe();
  }, [challengeId]);

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
    if (!(latestChallenge && latestChallenge.status === "cancelled" && !latestChallenge.challengedJoined)) return;
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
        (challengedFriend && challengedFriend.username)
          ? challengedFriend.username
          : "Challenger";
      friendAvatar =
        (challengedFriend && challengedFriend.avatarUrl)
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
        await updateDoc(doc(database, "challenges", challengeId), { status: "cancelled" });
  
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
  const handleStartGame = async () => {
    const challengeRef = doc(database, "challenges", challengeId);
    // Generate a new gameId using the current timestamp.
    const newGameId = Date.now().toString();
    // Update the challenge document with both accepted status and the new gameId.
    await updateDoc(challengeRef, {
      status: "accepted",
      gameId: newGameId,
    });

    // Emit a socket event to notify the other user.
    socket.emit("startGame", {
      gameId: newGameId,
      challengerId: currentUser.uid,
      challengedId: challengedFriend.uid,
    });

    // Navigate to the GamePlay screen with the new gameId.
    navigation.replace("GamePlay", {
      gameType: "multiplayer",
      gameId: newGameId,
      challengeId,
      // challengerId: currentUser.uid,
      // challengedId: challengedFriend.uid,
      settings: {}, // Add any specific game settings if needed.
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Challenge Sent</Text>
      <Text style={styles.info}>
        {partnerStatus === "joined"
          ? "Both players have joined your challenge!"
          : partnerStatus === "left"
          ? `${challengedFriend.username} has left the challenge room. Waiting for them to rejoin...`
          : `Waiting for ${challengedFriend.username} to join your challenge...`}
      </Text>

      {partnerStatus === "joined" ? (
        <>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartGame}
          >
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#49b3f5" />
          <Text style={styles.waitText}>Waiting for friend to join...</Text>
        </>
      )}

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
      >
        <Text style={styles.cancelText}>Cancel Challenge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  info: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
  },
  waitText: {
    fontSize: 16,
    marginTop: 10,
  },
  joinedText: {
    fontSize: 18,
    color: "green",
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: "#49b3f5",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
  cancelButton: {
    marginTop: 30,
    padding: 10,
    backgroundColor: "red",
    borderRadius: 5,
    alignSelf: "center",
  },
  cancelText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
