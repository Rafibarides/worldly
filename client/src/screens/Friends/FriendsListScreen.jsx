import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Image
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
  const [requestCount, setRequestCount] = useState(0);

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

  useFocusEffect(
    React.useCallback(() => {
      const fetchRequestCount = async () => {
        try {
          const friendshipsRef = collection(database, "friendships");
          const q = query(
            friendshipsRef,
            where("requesteeId", "==", currentUser.uid),
            where("status", "==", "pending")
          );
          const querySnapshot = await getDocs(q);
          setRequestCount(querySnapshot.docs.length);
        } catch (err) {
          console.error("Error fetching friend request count: ", err);
        }
      };
      fetchRequestCount();
    }, [currentUser.uid])
  );

  // Filter friends using a case insensitive search
  const filteredFriends = friends.filter(friend => {
    return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Add an onRefresh function that uses the refreshing state:
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriends();
    setRefreshing(false);
  };

  // Remove friend handler: Queries the confirmed friendship document
  // and deletes it from Firestore.
  const handleRemoveFriend = async (friendId) => {
    try {
      const friendshipsRef = collection(database, "friendships");
      // Query for the friendship where the current user is the requester
      const q1 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesterId", "==", currentUser.uid),
        where("requesteeId", "==", friendId)
      );
      // Query for the friendship where the current user is the requestee
      const q2 = query(
        friendshipsRef,
        where("status", "==", "confirmed"),
        where("requesterId", "==", friendId),
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
        // Refresh the friends list after removal.
        fetchFriends();
      } else {
        alert("Friendship not found.");
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      // Alert removed as per user request.
    }
  };

  // Challenge friend handler: Navigates to the 'Game' screen and passes the friend as a parameter.
  const handleChallengeFriend = (friend) => {
    navigation.navigate('Game', { challengedFriend: friend });
  };

  // Add the new handler function inside your FriendsListScreen component:
  const handleViewProfile = (friend) => {
    navigation.navigate('Profile', { profileUser: friend });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => navigation.navigate('FriendRequests')}>
          <View style={styles.iconWrapper}>
            <MaterialIcons name="notifications" size={24} color="#ffc268" />
            {requestCount > 0 && <View style={styles.redDot} />}
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Small grey title placed under the search bar */}
      <Text style={styles.sectionHeader}>Friends</Text>
      
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
              <View style={styles.userInfo}>
                <TouchableOpacity 
                  onPress={() => handleViewProfile(item)}
                >
                  <Image
                    style={styles.avatar}
                    source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleViewProfile(item)}
                  style={{ marginLeft: 8 }}
                >
                  <Text style={styles.username}>{item.username}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.friendActions}>
                <TouchableOpacity 
                  onPress={() => handleRemoveFriend(item.uid)} 
                  style={styles.addButton}
                >
                  <MaterialIcons name="person-remove" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleChallengeFriend(item)} 
                  style={styles.challengeButton}
                >
                  <Text style={styles.challengeButtonText}>Challenge</Text>
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
    marginTop: 60,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    paddingHorizontal: 19,
    paddingVertical: 16,
    borderWidth: 0,
  },
  notificationButton: {
    padding: 8,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  friendItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    padding: 3,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
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
  addButton: {
    backgroundColor: '#f182b7',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 5,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  challengeButton: {
    backgroundColor: '#ffc268',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  iconWrapper: {
    position: 'relative',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
  },
}); 