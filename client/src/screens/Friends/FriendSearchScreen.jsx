import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { collection, query, orderBy, startAt, endAt, getDocs, addDoc, where } from 'firebase/firestore';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function FriendSearchScreen() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      setFriendshipStatuses({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const searchTermLower = term.trim().toLowerCase();
      const usersRef = collection(database, "users");
      const q = query(usersRef, orderBy("username"));
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (
          data.uid !== currentUser.uid &&
          data.username &&
          data.username.toLowerCase().includes(searchTermLower)
        ) {
          users.push(data);
        }
      });
      setResults(users);

      if (users.length > 0) {
        const friendIds = users.map(u => u.uid);
        const friendshipsRef = collection(database, "friendships");
        const statuses = {};
        const qSent = query(
          friendshipsRef,
          where("status", "in", ["pending", "confirmed"]),
          where("requesterId", "==", currentUser.uid),
          where("requesteeId", "in", friendIds)
        );
        const qReceived = query(
          friendshipsRef,
          where("status", "in", ["pending", "confirmed"]),
          where("requesteeId", "==", currentUser.uid),
          where("requesterId", "in", friendIds)
        );
        const [snapshotSent, snapshotReceived] = await Promise.all([getDocs(qSent), getDocs(qReceived)]);
        snapshotSent.forEach(docSnap => {
          const data = docSnap.data();
          statuses[data.requesteeId] = data.status;
        });
        snapshotReceived.forEach(docSnap => {
          const data = docSnap.data();
          statuses[data.requesterId] = data.status;
        });
        setFriendshipStatuses(statuses);
      } else {
        setFriendshipStatuses({});
      }
    } catch (err) {
      console.error("Error searching users: ", err);
      setError("Error searching users.");
    }
    setLoading(false);
  };

  const handleAddFriend = async (friend) => {
    try {
      await addDoc(collection(database, "friendships"), {
        status: "pending",
        requesterId: currentUser.uid,
        requesteeId: friend.uid,
      });
      alert("Friend request sent!");
      setFriendshipStatuses(prev => ({ ...prev, [friend.uid]: "pending" }));
    } catch (err) {
      console.error("Error adding friend: ", err);
      alert("Error sending friend request.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Friends</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          handleSearch(text);
        }}
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => {
          const status = friendshipStatuses[item.uid];
          return (
            <View style={styles.resultItem}>
              <Text style={styles.username}>{item.username}</Text>
              {status === "pending" ? (
                <TouchableOpacity style={styles.requestedButton} disabled={true}>
                  <Text style={styles.requestedText}>Requested</Text>
                </TouchableOpacity>
              ) : status === "confirmed" ? (
                null
              ) : (
                <TouchableOpacity onPress={() => handleAddFriend(item)} style={styles.addButton}>
                  <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    paddingHorizontal: 19,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 0,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  username: {
    fontSize: 18,
  },
  addButton: {
    backgroundColor: 'green',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  requestedButton: {
    backgroundColor: '#aaa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  requestedText: {
    color: '#fff',
    fontSize: 14,
  },
}); 