import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { database } from "../../services/firebase";
import { useNavigation, useRoute } from "@react-navigation/native";
import CachedImage from '../../components/CachedImage';
import * as FileSystem from 'expo-file-system';

export default function UserFriendsListScreen() {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const displayedUser = route.params?.user;
  
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch confirmed friendships from Firestore based on the displayed user
  const fetchFriends = async () => {
    if (!displayedUser) return;
    
    setIsLoading(true);
    try {
      const friendshipsRef = collection(database, "friendships");
      // Query friendships where the displayed user is the requester
      const q1 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesterId", "==", displayedUser.uid)
      );
      // Query friendships where the displayed user is the requestee
      const q2 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesteeId", "==", displayedUser.uid)
      );
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2),
      ]);

      const friendshipDocs = [];
      snapshot1.forEach((docSnap) => friendshipDocs.push(docSnap));
      snapshot2.forEach((docSnap) => friendshipDocs.push(docSnap));

      // Extract friend IDs (depending on whether the displayed user is requester or requestee)
      const friendIds = friendshipDocs.map((docSnap) => {
        const data = docSnap.data();
        return data.requesterId === displayedUser.uid
          ? data.requesteeId
          : data.requesterId;
      });

      // Remove duplicates (if any)
      const uniqueFriendIds = [...new Set(friendIds)];

      // Fetch each friend's details from the "users" collection
      const fetchedFriends = [];
      
      // First, fetch all user data
      const userPromises = uniqueFriendIds.map(friendId => {
        const userRef = doc(database, "users", friendId);
        return getDoc(userRef);
      });
      
      const userSnapshots = await Promise.all(userPromises);
      
      // Process the results
      userSnapshots.forEach(userSnap => {
        if (userSnap.exists()) {
          fetchedFriends.push(userSnap.data());
        }
      });
      
      // Set friends first so the UI can render
      setFriends(fetchedFriends);
      
      // Then preload images in the background
      if (fetchedFriends.length > 0) {
        Promise.all(
          fetchedFriends.map(friend => {
            if (friend.avatarUrl) {
              // Create a unique filename for caching
              const filename = friend.avatarUrl.split('/').pop();
              const cacheFilePath = `${FileSystem.cacheDirectory}${filename}`;
              
              // Check if already cached
              return FileSystem.getInfoAsync(cacheFilePath)
                .then(fileInfo => {
                  if (!fileInfo.exists) {
                    // Download if not cached
                    return FileSystem.downloadAsync(friend.avatarUrl, cacheFilePath);
                  }
                  return Promise.resolve();
                });
            }
            return Promise.resolve();
          })
        ).catch(err => {
          // Silently handle prefetch errors
          console.warn("Error prefetching friend avatars:", err);
        });
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (displayedUser) {
      fetchFriends();
    }
  }, [displayedUser]);

  // Add an onRefresh function that uses the refreshing state:
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  // Handle viewing a friend's profile
  const handleViewProfile = (friend) => {
    navigation.navigate("Profile", { profileUser: friend });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>
        {displayedUser?.username}'s Friends
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : friends.length === 0 ? (
        <Text style={styles.emptyText}>No friends found.</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.uid}
          onRefresh={onRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              <View style={styles.userInfo}>
                <TouchableOpacity onPress={() => handleViewProfile(item)}>
                  <CachedImage
                    style={styles.avatar}
                    source={{
                      uri:
                        item.avatarUrl ||
                        "https://api.dicebear.com/9.x/avataaars/png?seed=default",
                    }}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleViewProfile(item)}
                  style={{ marginLeft: 8 }}
                >
                  <Text style={styles.username}>{item.username}</Text>
                  <Text style={styles.userLevel}>Level {item.level || 1}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 60,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
  },
  userLevel: {
    fontSize: 12,
    color: '#000',
    marginTop: 2,
  },
}); 