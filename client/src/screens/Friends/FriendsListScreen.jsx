import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../services/firebase';
import { useFocusEffect } from '@react-navigation/native';

export default function FriendsListScreen({ navigation }) {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch confirmed friendships from Firestore based on the logged in user.
  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const friendshipsRef = collection(database, "friendships");
      // Query friendships where the current user is the requester
      const q1 = query(
        friendshipsRef, 
        where("status", "==", "confirmed"), 
        where("requesterId", "==", currentUser.uid)
      );
      // Query friendships where the current user is the requestee
      const q2 = query(
        friendshipsRef, 
        where("status", "==", "confirmed"), 
        where("requesteeId", "==", currentUser.uid)
      );
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friendshipDocs = [];
      snapshot1.forEach(docSnap => friendshipDocs.push(docSnap));
      snapshot2.forEach(docSnap => friendshipDocs.push(docSnap));

      // Extract friend IDs (depending on whether the current user is requester or requestee)
      const friendIds = friendshipDocs.map(docSnap => {
        const data = docSnap.data();
        return data.requesterId === currentUser.uid ? data.requesteeId : data.requesterId;
      });

      // Remove duplicates (if any)
      const uniqueFriendIds = [...new Set(friendIds)];

      // Fetch each friend's details from the "users" collection
      const fetchedFriends = [];
      for (const friendId of uniqueFriendIds) {
        const userRef = doc(database, "users", friendId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          fetchedFriends.push(userSnap.data());
        }
      }
      setFriends(fetchedFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchFriends();
    }
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentUser) {
        fetchFriends();
      }
    }, [currentUser])
  );

  // Filter friends based on the search query.
  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add an onRefresh function that uses the refreshing state:
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  // Remove friend handler: Queries the confirmed friendship document
  // and deletes it from Firestore.
  const handleRemoveFriend = async (friendUid) => {
    try {
      const friendshipsRef = collection(database, "friendships");
      // Query for the friendship where the current user is the requester
      const q1 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesterId", "==", currentUser.uid),
        where("requesteeId", "==", friendUid)
      );
      // Query for the friendship where the current user is the requestee
      const q2 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesterId", "==", friendUid),
        where("requesteeId", "==", currentUser.uid)
      );
      const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      let friendshipDocSnap = null;
      if (!snapshot1.empty) {
        friendshipDocSnap = snapshot1.docs[0];
      } else if (!snapshot2.empty) {
        friendshipDocSnap = snapshot2.docs[0];
      }
      if (friendshipDocSnap) {
        await deleteDoc(doc(database, "friendships", friendshipDocSnap.id));
        alert("Friend removed!");
        // Refresh the friends list after removal.
        fetchFriends();
      } else {
        alert("Friendship not found.");
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      alert("Error removing friend.");
    }
  };

  // Challenge friend handler: Navigates to the 'Game' screen and passes the friend as a parameter.
  const handleChallengeFriend = (friend) => {
    navigation.navigate('Game', { challengedFriend: friend });
  };

  // Add the new handler function inside your FriendsListScreen component:
  const handleViewFriendProfile = (friend) => {
    navigation.navigate('Profile', { profileUser: friend });
  };

  return (
    <View style={styles.container}>
      {/* Header with screen title and notifications button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends List</Text>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('FriendRequests')}>
          <MaterialIcons name="notifications" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Search friends..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : filteredFriends.length === 0 ? (
        <Text style={styles.emptyText}>No friends found.</Text>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.uid}
          onRefresh={onRefresh}
          refreshing={refreshing}
          renderItem={({ item }) => (
            <View style={styles.friendItem}>
              {/* Wrap the friend's username in a TouchableOpacity */}
              <TouchableOpacity 
                onPress={() => handleViewFriendProfile(item)} 
                style={{ flex: 1 }}
              >
                <Text style={styles.username}>{item.username}</Text>
              </TouchableOpacity>
              <View style={styles.friendActions}>
                <TouchableOpacity 
                  onPress={() => handleRemoveFriend(item.uid)} 
                  style={styles.iconButton}
                >
                  <MaterialIcons name="person-remove" size={24} color="red" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleChallengeFriend(item)} 
                  style={styles.iconButton}
                >
                  <MaterialIcons name="public" size={24} color="#000" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    padding: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    padding: 10,
    marginBottom: 16,
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  friendActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 8,
  },
}); 