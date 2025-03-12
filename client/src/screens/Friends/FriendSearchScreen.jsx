import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { collection, query, orderBy, startAt, endAt, getDocs, addDoc, where, limit } from 'firebase/firestore';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function FriendSearchScreen() {
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [friendshipStatuses, setFriendshipStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [prefetched, setPrefetched] = useState(false);

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  const fetchRecentUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(database, "users");
      const q = query(
        usersRef,
        orderBy("createdAt", "desc"),
        limit(11)
      );
      const querySnapshot = await getDocs(q);
      const users = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid !== currentUser.uid) {
          users.push(data);
        }
      });
      setRecentUsers(users);
      
      if (users.length > 0) {
        const friendIds = users.map(u => u.uid);
        await fetchFriendshipStatuses(friendIds);
        
        // Preload avatar images in the background
        Promise.all(
          users.map(user => 
            user.avatarUrl ? Image.prefetch(user.avatarUrl) : Promise.resolve()
          )
        ).catch(err => {
          console.warn("Error prefetching user avatars:", err);
        });
      }
    } catch (err) {
      console.error("Error fetching recent users:", err);
      setError("Error fetching recent users.");
    }
    setLoading(false);
  };

  const fetchFriendshipStatuses = async (friendIds) => {
    const friendshipsRef = collection(database, "friendships");
    const statuses = {};
    
    // Process friendIds in chunks of 30 to avoid the query limit
    const chunkSize = 30;
    for (let i = 0; i < friendIds.length; i += chunkSize) {
      const chunk = friendIds.slice(i, i + chunkSize);
      
      const qSent = query(
        friendshipsRef,
        where("status", "in", ["pending", "confirmed"]),
        where("requesterId", "==", currentUser.uid),
        where("requesteeId", "in", chunk)
      );
      const qReceived = query(
        friendshipsRef,
        where("status", "in", ["pending", "confirmed"]),
        where("requesteeId", "==", currentUser.uid),
        where("requesterId", "in", chunk)
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
    }
    
    setFriendshipStatuses(statuses);
  };

  const handleViewProfile = (user) => {
    const status = friendshipStatuses[user.uid];
    const hideChallenge = status !== "confirmed";
    navigation.navigate('Profile', { profileUser: user, hideChallenge });
  };

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setResults([]);
      await fetchRecentUsers();
      return;
    }
    
    setRecentUsers([]);
    setLoading(true);
    setError(null);
    
    try {
      const searchTermLower = term.trim().toLowerCase();
      const usersRef = collection(database, "users");
      const q = query(usersRef, orderBy("username"));
      const querySnapshot = await getDocs(q);
      const users = [];
      
      // Process all users at once
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
      
      // Sort results
      users.sort((a, b) => {
        const aUsername = a.username.toLowerCase();
        const bUsername = b.username.toLowerCase();
        const startsA = aUsername.startsWith(searchTermLower);
        const startsB = bUsername.startsWith(searchTermLower);
        if (startsA && !startsB) return -1;
        if (!startsA && startsB) return 1;
        return aUsername.localeCompare(bUsername);
      });
      
      // Set results first so UI can render
      setResults(users);
      
      if (users.length > 0) {
        // Start prefetching images immediately
        const prefetchPromises = users.map(user => 
          user.avatarUrl ? Image.prefetch(user.avatarUrl) : Promise.resolve()
        );
        
        // Fetch friendship statuses in parallel with image prefetching
        const friendIds = users.map(u => u.uid);
        const [_] = await Promise.all([
          fetchFriendshipStatuses(friendIds),
          Promise.all(prefetchPromises).catch(err => {
            console.warn("Error prefetching search result avatars:", err);
          })
        ]);
      } else {
        setFriendshipStatuses({});
      }
    } catch (err) {
      console.error("Error searching users: ", err);
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
      setFriendshipStatuses(prev => ({ ...prev, [friend.uid]: "pending" }));
    } catch (err) {
      console.error("Error adding friend: ", err);
      alert("Error sending friend request.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (searchTerm.trim()) {
      await handleSearch(searchTerm);
    } else {
      await fetchRecentUsers();
    }
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search..."
        value={searchTerm}
        onChangeText={(text) => {
          setSearchTerm(text);
          handleSearch(text);
        }}
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      <FlatList
        data={searchTerm.trim() ? results : recentUsers}
        keyExtractor={(item) => item.uid}
        extraData={friendshipStatuses}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="transparent"
            colors={["transparent"]}
            progressBackgroundColor="transparent"
            progressViewOffset={0}
          />
        }
        ListHeaderComponent={!searchTerm.trim() && recentUsers.length > 0 ? (
          <Text style={styles.sectionHeader}>Recently Joined</Text>
        ) : null}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const status = friendshipStatuses[item.uid];
          return (
            <View style={styles.resultItem}>
              <View style={styles.userInfo}>
                <TouchableOpacity onPress={() => handleViewProfile(item)}>
                  <Image
                    style={styles.avatar}
                    source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }}
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ flex: 1 }}
                  onPress={() => handleViewProfile(item)}
                >
                  <Text style={styles.username}>{item.username}</Text>
                </TouchableOpacity>
              </View>
              { !status && (
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => handleAddFriend(item)}
                >
                  <Text style={styles.addButtonText}>Add Friend</Text>
                </TouchableOpacity>
              )}
              { status === "pending" && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusText}>Requested</Text>
                </View>
              )}
            </View>
          );
        }}
        initialNumToRender={Math.max(
          searchTerm.trim() ? results.length : recentUsers.length,
          1
        )}
        windowSize={Math.max(
          searchTerm.trim() ? results.length : recentUsers.length,
          1
        )}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },
  statusText: {
    color: '#aaa',
    fontSize: 14,
    paddingHorizontal: 10,
  },
  addButton: {
    backgroundColor: '#7dbc63',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  statusContainer: {
    justifyContent: 'center',
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
    borderRadius: 1000,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 5,
  },
}); 