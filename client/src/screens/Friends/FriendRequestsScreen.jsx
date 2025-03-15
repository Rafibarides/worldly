import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  BackHandler,
} from 'react-native';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import CachedImage from '../../components/CachedImage';
import * as FileSystem from 'expo-file-system';

export default function FriendRequestsScreen() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAcceptedRequest, setHasAcceptedRequest] = useState(false);
  const navigation = useNavigation();

  // Fetch friend requests for which the current user is the requestee and the status is "pending".
  const fetchFriendRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const friendshipsRef = collection(database, "friendships");
      const q = query(
        friendshipsRef,
        where("requesteeId", "==", currentUser.uid),
        where("status", "==", "pending")
      );
      const querySnapshot = await getDocs(q);
      const friendRequests = [];
      // For each friendship document, also fetch the requester's user details.
      for (const docSnap of querySnapshot.docs) {
        const requestData = docSnap.data();
        const userDoc = await getDoc(doc(database, "users", requestData.requesterId));
        if (userDoc.exists()) {
          friendRequests.push({
            id: docSnap.id,
            requester: userDoc.data(),
          });
        }
      }
      
      // Preload avatar images in the background
      Promise.all(
        friendRequests.map(request => {
          if (request.requester.avatarUrl) {
            // Create a unique filename for caching
            const filename = request.requester.avatarUrl.split('/').pop();
            const cacheFilePath = `${FileSystem.cacheDirectory}${filename}`;
            
            // Check if already cached
            return FileSystem.getInfoAsync(cacheFilePath)
              .then(fileInfo => {
                if (!fileInfo.exists) {
                  // Download if not cached
                  return FileSystem.downloadAsync(request.requester.avatarUrl, cacheFilePath);
                }
                return Promise.resolve();
              });
          }
          return Promise.resolve();
        })
      ).catch(err => {
        console.warn("Error prefetching requester avatars:", err);
      });
      
      setRequests(friendRequests);
    } catch (err) {
      console.error("Error fetching friend requests: ", err);
      setError("Error fetching friend requests.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFriendRequests();
  }, []);

  // Accepts a friend request by updating the friendship document's status to "confirmed".
  const handleAccept = async (requestId) => {
    try {
      const friendshipDocRef = doc(database, "friendships", requestId);
      await updateDoc(friendshipDocRef, {
        status: "confirmed",
      });
      // Set the flag to indicate we've accepted a request
      setHasAcceptedRequest(true);
      // Refresh friend requests
      fetchFriendRequests();
    } catch (err) {
      console.error("Error accepting friend request: ", err);
      alert("Error accepting friend request.");
    }
  };

  // Update the useEffect for navigation
  useEffect(() => {
    return () => {
      if (hasAcceptedRequest && navigation.isFocused()) {
        // Fix the navigation to go to FriendsList instead of Game screen
        navigation.navigate("FriendsList", { refreshFriends: true });
      }
    };
  }, [hasAcceptedRequest, navigation]);

  // Add a back button handler to ensure proper navigation
  const handleBackPress = () => {
    // Navigate back to FriendsList and refresh if needed
    navigation.navigate("FriendsList", { 
      refreshFriends: hasAcceptedRequest 
    });
    return true; // Prevents default back behavior
  };

  // Add this to the component to handle the back button
  useEffect(() => {
    // Set up back button handler
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    // Clean up the event listener
    return () => backHandler.remove();
  }, [hasAcceptedRequest]);

  useEffect(() => {
    // Set up navigation options with a custom back button handler
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            // Navigate to FriendsList with refresh if needed
            navigation.navigate("FriendsList", { 
              refreshFriends: hasAcceptedRequest 
            });
          }}
          style={{ marginLeft: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#ffc268" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, hasAcceptedRequest]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Friend Requests</Text>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestItem}>
            <View style={styles.userInfo}>
              <CachedImage
                style={styles.avatar}
                source={{ uri: item.requester.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }}
              />
              <Text style={styles.username}>{item.requester.username}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleAccept(item.id)} 
              style={styles.acceptButton}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 100,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#7dbc63',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 