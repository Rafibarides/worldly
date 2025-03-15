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
  Modal,
} from 'react-native';
import { collection, query, orderBy, startAt, endAt, getDocs, addDoc, where, limit } from 'firebase/firestore';
import { database } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, FadeIn } from 'react-native-reanimated';
import CachedImage from '../../components/CachedImage';
import * as FileSystem from 'expo-file-system';

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
  const [leaderboardModalVisible, setLeaderboardModalVisible] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

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
          users.map(user => {
            if (user.avatarUrl) {
              // Create a unique filename for caching
              const filename = user.avatarUrl.split('/').pop();
              const cacheFilePath = `${FileSystem.cacheDirectory}${filename}`;
              
              // Check if already cached
              return FileSystem.getInfoAsync(cacheFilePath)
                .then(fileInfo => {
                  if (!fileInfo.exists) {
                    // Download if not cached
                    return FileSystem.downloadAsync(user.avatarUrl, cacheFilePath);
                  }
                  return Promise.resolve();
                });
            }
            return Promise.resolve();
          })
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
    setLeaderboardModalVisible(false);
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

  const fetchTopPlayers = async () => {
    setLoadingLeaderboard(true);
    try {
      const usersRef = collection(database, "users");
      const q = query(
        usersRef,
        orderBy("stats.gamesPlayed", "desc"),
        limit(3)
      );
      const querySnapshot = await getDocs(q);
      const players = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        players.push(data);
      });
      setTopPlayers(players);
    } catch (err) {
      console.error("Error fetching top players:", err);
      Toast.show({
        type: 'error',
        text1: 'Error loading leaderboard',
        position: 'bottom'
      });
    }
    setLoadingLeaderboard(false);
  };

  const LeaderboardPill = ({ player, index, handleViewProfile }) => {
    // Determine medal image source based on index
    let medalSource;
    if (index === 0) medalSource = require('../../../assets/images/gold.png');
    else if (index === 1) medalSource = require('../../../assets/images/silver.png');
    else medalSource = require('../../../assets/images/bronze.png');

    // For the top player, set up a continuous "breathing" animation
    const breath = useSharedValue(1);
    if (index === 0) {
      // Start a repeating scale animation (pulsing effect)
      React.useEffect(() => {
        breath.value = withRepeat(
          withTiming(1.05, { duration: 1000 }),
          -1,
          true
        );
      }, []);
    }
    const animatedStyle = useAnimatedStyle(() => {
      return index === 0 ? { transform: [{ scale: breath.value }] } : {};
    });

    // Stagger the entrance of each pill using a delay based on the index
    const animationDelay = index * 100;

    return (
      <Animated.View
        entering={FadeIn.delay(animationDelay).duration(300)}
        style={[styles.leaderboardItem, index === 0 && styles.topPlayerItem, animatedStyle]}
      >
        {index === 0 && (
          <View style={styles.topPlayerBadge}>
            <MaterialIcons name="star" size={12} color="#fff" />
            <Text style={styles.topPlayerText}>Top Player</Text>
          </View>
        )}
        <Image source={medalSource} style={styles.medalIcon} />
        <View style={styles.leaderboardPlayerInfo}>
          <CachedImage 
            source={{ uri: player.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }} 
            style={styles.leaderboardAvatar} 
          />
          <View style={styles.leaderboardPlayerDetails}>
            <TouchableOpacity onPress={() => handleViewProfile(player)}>
              <Text style={styles.leaderboardPlayerName}>{player.username}</Text>
            </TouchableOpacity>
            <Text style={styles.leaderboardPlayerStats}>
              <Text style={styles.levelBold}>Level {player.level || 1}</Text>
              <Text> • {player.stats?.gamesPlayed || 0} games</Text>
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search for friends..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={{marginLeft: 10}}
          onPress={() => {
            fetchTopPlayers();
            setLeaderboardModalVisible(true);
          }}
        >
          <Image 
            source={require('../../../assets/images/leaderboard.png')} 
            style={{
              width: 35, 
              height: 35,
              resizeMode: 'contain'
            }}
          />
        </TouchableOpacity>
      </View>
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
                <CachedImage
                  style={styles.avatar}
                  source={{ uri: item.avatarUrl || 'https://api.dicebear.com/9.x/avataaars/png?seed=default' }}
                />
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
      <Modal
        visible={leaderboardModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLeaderboardModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLeaderboardModalVisible(false)}
        >
          <View style={styles.leaderboardModalContent}>
            <Text style={styles.leaderboardModalTitle}>Top Players</Text>
            
            {loadingLeaderboard ? (
              <ActivityIndicator size="large" color="#fff" style={{marginVertical: 20}} />
            ) : (
              <View style={styles.leaderboardList}>
                {topPlayers.map((player, index) => (
                  <LeaderboardPill
                    key={player.uid}
                    player={player}
                    index={index}
                    handleViewProfile={handleViewProfile}
                  />
                ))}
                
                {topPlayers.length === 0 && !loadingLeaderboard && (
                  <Text style={styles.noPlayersText}>No players found</Text>
                )}
              </View>
            )}
            
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setLeaderboardModalVisible(false)}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderWidth: 0,
    flex: 1,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardModalContent: {
    width: '85%',
    backgroundColor: '#87c66b',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leaderboardModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  leaderboardList: {
    width: '100%',
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
  },
  medalIcon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  leaderboardPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderColor: '#fff',
  },
  leaderboardPlayerDetails: {
    flex: 1,
    width: '100%',
  },
  leaderboardPlayerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  leaderboardPlayerStats: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  levelBold: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 14,
  },
  noPlayersText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  closeModalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  topPlayerItem: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  topPlayerBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#ffc268',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  topPlayerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
}); 