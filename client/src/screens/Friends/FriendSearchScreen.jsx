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
import { collection, query, orderBy, startAt, endAt, getDocs, addDoc } from 'firebase/firestore';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function FriendSearchScreen() {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modified handleSearch to accept the current text as a parameter.
  const handleSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(database, "users");
      // Using a "startAt" & "endAt" query to simulate a "startsWith" behavior.
      const q = query(
        usersRef,
        orderBy("username"),
        startAt(term),
        endAt(term + "\uf8ff")
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Exclude the current user from the results
        if (data.uid !== currentUser.uid) {
          users.push(data);
        }
      });
      setResults(users);
    } catch (err) {
      console.error("Error searching users: ", err);
      setError("Error searching users.");
    }
    setLoading(false);
  };

  // Sends a friend request by creating a document in the "friendships" collection.
  const handleAddFriend = async (friend) => {
    try {
      await addDoc(collection(database, "friendships"), {
        status: "pending",
        requesterId: currentUser.uid,
        requesteeId: friend.uid,
      });
      alert("Friend request sent!");
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
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.username}>{item.username}</Text>
            <TouchableOpacity onPress={() => handleAddFriend(item)} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Friend</Text>
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
}); 