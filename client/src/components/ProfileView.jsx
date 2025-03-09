import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { mockBadges } from "../utils/mockData";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { database } from "../services/firebase";
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Badge from './Badge/Badge';

export default function ProfileView({
  user,
  friendshipStatus,
  onAddFriend,
  showChallenge,
}) {
  const navigation = useNavigation();
  const { currentUser, setCurrentUser } = useAuth();
  const isCurrentUser = currentUser && user && currentUser.uid === user.uid;
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState(null);

  const renderBadges = () => {
    const earnedBadges = new Set(user?.badges || []);
    if (user?.continentsTracked) {
      Object.entries(user.continentsTracked).forEach(([continent, count]) => {
        if (count >= 3) {
          earnedBadges.add(continent);
        }
      });
    }
    return Array.from(earnedBadges).map((badgeId) => {
      const badge = mockBadges.find((b) => b.id === badgeId);
      if (badge) {
        return (
          <TouchableOpacity 
            key={badgeId} 
            style={styles.badge}
            onPress={() => {
              setSelectedBadgeId(badgeId);
              setBadgeModalVisible(true);
            }}
          >
            <Image
              source={require("../../assets/images/badge-hero.png")}
              style={styles.badgeHero}
              resizeMode="contain"
            />
            <View style={styles.badgeIconWrapper}>
              <Image
                source={require("../../assets/images/platform.png")}
                style={styles.badgePlatform}
                resizeMode="contain"
              />
              <Image
                source={badge.icon}
                style={styles.badgeIcon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.badgeName}>{badge.name}</Text>
          </TouchableOpacity>
        );
      }
      return null;
    });
  };

  const handleChangeAvatar = async () => {
    try {
      // You can request permission if necessary (optional)
      // const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      // if (permissionResult.granted === false) {
      //   Alert.alert("Permission required", "Permission to access camera roll is required!");
      //   return;
      // }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);

      if (result.canceled) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        const uploadUrl = await uploadImageAsync(uri);
        
        if (uploadUrl) {
          // Update Firestore with new avatar URL
          const userRef = doc(database, "users", user.uid);
          await updateDoc(userRef, {
            avatarUrl: uploadUrl
          });
          
          // Update local state if it's the current user
          if (isCurrentUser) {
            setCurrentUser(prev => ({ ...prev, avatarUrl: uploadUrl }));
          }
        }
      }
    } catch (error) {
      console.error('Error changing avatar:', error);
    }
  };

  const uploadImageAsync = async (uri) => {
    try {
      // Get Firebase storage instance
      const storage = getStorage();
      
      // Log for debugging
      console.log("Starting image upload process");
      console.log("Image URI:", uri);
      
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob size:", blob.size);
      
      // Create a unique filename
      const filename = `avatar_${Date.now()}`;
      
      // Create a reference to the storage location
      // Note: Don't include the gs:// prefix in the ref path
      const storageRef = ref(storage, `avatars/${filename}`);
      
      console.log("Storage reference created");
      
      // Upload the blob with metadata
      const metadata = {
        contentType: 'image/jpeg', // Default to JPEG
      };
      
      console.log("Starting upload to Firebase");
      const snapshot = await uploadBytes(storageRef, blob, metadata);
      console.log("Upload completed successfully");
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log("Download URL obtained:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // More detailed error logging
      if (error.code) {
        console.error('Error code:', error.code);
      }
      
      if (error.message) {
        console.error('Error message:', error.message);
      }
      
      if (error.serverResponse) {
        console.error('Server response:', error.serverResponse);
      }
      
      return null;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* UPDATED HEADER ROW: Left corner displays settings (or challenge) and right corner displays level pill */}
      <View style={styles.headerRow}>
        <View style={styles.levelPill}>
          <Image
            source={require("../../assets/images/medal.png")}
            style={styles.medalIconInPill}
            resizeMode="contain"
          />
          <Text style={styles.levelText}>Level {user?.level || 1}</Text>
        </View>
        {isCurrentUser && (
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("ProfileSettings")}
          >
            <MaterialIcons name="more-vert" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {isCurrentUser ? (
            <TouchableOpacity onPress={handleChangeAvatar}>
              <Image
                style={styles.avatar}
                source={{
                  uri: user?.avatarUrl ||
                    "https://api.dicebear.com/9.x/avataaars/png?seed=default",
                }}
              />
            </TouchableOpacity>
          ) : (
            <Image
              style={styles.avatar}
              source={{
                uri: user?.avatarUrl ||
                  "https://api.dicebear.com/9.x/avataaars/png?seed=default",
              }}
            />
          )}
          <Text style={styles.username}>{user?.username}</Text>
        </View>
        {showChallenge ? (
          <TouchableOpacity
            style={styles.challengeButton}
            onPress={async () => {
              try {
                // Create the challenge document
                const challengesRef = collection(database, "challenges");
                const newChallengeRef = await addDoc(challengesRef, {
                  challengerId: currentUser.uid,
                  challengedId: user.uid,
                  status: "pending",
                  scoreList: [
                    { score: 0, uid: currentUser.uid },
                    { score: 0, uid: user.uid },
                  ],
                  country: [],
                  createdAt: serverTimestamp(),
                  gameId: `${currentUser.uid}_${user.uid}_${Date.now()}`,
                  challengerJoined: true, // Mark that the challenger is in the pending room
                });
                await updateDoc(newChallengeRef, {
                  challengeId: newChallengeRef.id,
                });

                // Navigate using the correct stack
                navigation.navigate("Game", {
                  screen: "PendingRoom",
                  params: {
                    challengedFriend: user,
                    challengeId: newChallengeRef.id,
                  },
                });
              } catch (error) {
                console.error("Error creating challenge:", error);
                Alert.alert(
                  "Error",
                  "Failed to create challenge. Please try again."
                );
              }
            }}
          >
            <View style={styles.optionContent}>
              <MaterialIcons name="flag" size={32} color="#ffc268" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Challenge</Text>
                <Text style={styles.optionDescription}>Issue a challenge</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={24} color="#ffc268" />
          </TouchableOpacity>
        ) : friendshipStatus === "pending" ? (
          <View style={styles.requestedButton}>
            <MaterialIcons name="watch-later" size={24} color="#ffc268" />
            <Text style={styles.requestedButtonText}>Requested</Text>
          </View>
        ) : (
          friendshipStatus === "none" && (
            <TouchableOpacity style={styles.addButton} onPress={onAddFriend}>
              <MaterialIcons name="person-add" size={24} color="#ffc268" />
              <Text style={styles.addButtonText}>Add Friend</Text>
            </TouchableOpacity>
          )
        )}

        {/* Stats Cards */}
        <View style={styles.statCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.stats?.gamesWon}</Text>
              <Text style={styles.statLabel}>Wins</Text>
            </View>
          </View>
        </View>
      </View>

      {/* UPDATED: Badges Section */}
      <View style={styles.badgesSection}>
        <View style={styles.badgesHeaderRow}>
          <Text style={styles.sectionTitle}>Badges</Text>
          {isCurrentUser && (
            <TouchableOpacity
              onPress={() => navigation.navigate("BadgesList", { user })}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.badgesContainer}
        >
          {renderBadges()}
        </ScrollView>
      </View>

      <Badge 
        visible={badgeModalVisible}
        onClose={() => setBadgeModalVisible(false)}
        initialBadgeId={selectedBadgeId}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#7dbc63",
    paddingTop: 10,
  },
  /* UPDATED headerRow: space-between layout for mirrored corners */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 70,
  },
  settingsButton: {
    padding: 8,
  },
  challengeButton: {
    width: "90%",
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  levelPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: "#75b35b",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.4 },
    shadowOpacity: 0,
    shadowRadius: 1.6,
    elevation: 1,
  },
  medalIconInPill: {
    width: 20,
    height: 20,
    marginRight: 5,
  },
  levelText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  profileSection: {
    padding: 20,
    alignItems: "center",
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 100,
    backgroundColor: "#ffffff",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#aed69d",
    marginBottom: 10,
    zIndex: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    margin: 10,
  },
  statCard: {
    backgroundColor: "rgba(177, 216, 138, 0.1)",
    padding: 10,
    borderRadius: 10,
    width: "60%",
    marginVertical: 20,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(177, 216, 138, 0.3)",
    marginHorizontal: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  /* UPDATED badges header row for mirroring */
  badgesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  seeAllText: {
    color: "#fff",
    opacity: 0.9,
    fontSize: 16,
  },
  badge: {
    backgroundColor: "#87c66b",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 15,
    width: 130,
    height: 150,
    margin: 10,
  },
  badgeHero: {
    width: 30,
    height: 30,
    position: "absolute",
    top: -12,
    alignSelf: "center",
  },
  badgeIconWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginTop: 12,
  },
  badgeIcon: {
    width: 70,
    height: 70,
    position: "relative",
    zIndex: 5,
    margin: 10,
  },
  badgePlatform: {
    width: 140,
    height: 40,
    position: "absolute",
    bottom: -5,
    zIndex: 0,
    opacity: 0.1,
  },
  badgeName: {
    fontSize: 12,
    textAlign: "center",
    color: "#ffffff",
    bottom: -8,
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
  addButton: {
    width: "40%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  addButtonText: {
    fontWeight: "bold",
    color: "#4f7a3a",
    fontSize: 16,
    marginLeft: 10,
  },
  requestedButton: {
    width: "40%",
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  requestedButtonText: {
    fontWeight: "bold",
    color: "grey",
    fontSize: 16,
    marginLeft: 10,
  },
  badgesSection: {
    padding: 20,
  },
  badgesContainer: {
    paddingHorizontal: 10,
  },
});
