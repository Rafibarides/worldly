import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
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

export default function FriendRequestsScreen() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Friend request accepted silently; no alert needed.
      // Refresh friend requests after accepting one
      fetchFriendRequests();
    } catch (err) {
      console.error("Error accepting friend request: ", err);
      alert("Error accepting friend request.");
    }
  };

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
              <Image
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