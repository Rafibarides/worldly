import { useState } from 'react';
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
import { mockUsers, mockFriendships } from '../../utils/mockData';

// For development, using first mock user as current user
const currentUser = mockUsers[0];

export default function FriendsListScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Get friends list from mock data
  const getFriendsList = () => {
    const friendships = mockFriendships.filter(
      f => (f.userId1 === currentUser.id || f.userId2 === currentUser.id) 
          && f.status === 'accepted'
    );

    return friendships.map(friendship => {
      const friendId = friendship.userId1 === currentUser.id 
        ? friendship.userId2 
        : friendship.userId1;
      return mockUsers.find(user => user.id === friendId);
    });
  };

  // Filter friends based on search query
  const getFilteredFriends = () => {
    const friends = getFriendsList();
    if (!searchQuery) return friends;
    
    return friends.filter(friend => 
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleChallenge = (friendId) => {
    // TODO: Implement challenge functionality
    console.log('Challenge friend:', friendId);
    navigation.navigate('Game', { challengedUserId: friendId });
  };

  const renderFriendItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      <View style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <Text style={styles.avatar}>��</Text>
          <View style={styles.textContainer}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.stats}>
              Won: {item.stats.gamesWon}/{item.stats.gamesPlayed} | 
              Countries: {item.stats.totalCountriesGuessed}
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.challengeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleChallenge(item.id);
            }}
          >
            <MaterialIcons name="flag" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => console.log('Remove friend:', item.id)}
          >
            <MaterialIcons name="person-remove" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="rgba(177, 216, 138, 1)" />
      ) : (
        <FlatList
          data={getFilteredFriends()}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.friendsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery 
                ? "No friends match your search" 
                : "You haven't added any friends yet"}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  friendsList: {
    flexGrow: 1,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    fontSize: 40,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  challengeButton: {
    backgroundColor: 'rgba(177, 216, 138, 1)',
    padding: 10,
    borderRadius: 20,
  },
  removeButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 174, 199, 0.1)',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
}); 