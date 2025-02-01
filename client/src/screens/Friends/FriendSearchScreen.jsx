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

export default function FriendSearchScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Simulate search functionality using mock data
  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);

    // Simulate API delay
    setTimeout(() => {
      const results = mockUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(query ? results : []);
      setIsSearching(false);
    }, 500);
  };

  // Check if users are friends using mock friendships
  const isFriend = (userId) => {
    return mockFriendships.some(
      f => (f.userId1 === userId && f.status === 'accepted') || 
           (f.userId2 === userId && f.status === 'accepted')
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.stats}>
            Games Won: {item.stats.gamesWon} | Countries: {item.stats.totalCountriesGuessed}
          </Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.addButton, 
            isFriend(item.id) && styles.addButtonDisabled
          ]}
          disabled={isFriend(item.id)}
          onPress={(e) => {
            e.stopPropagation(); // Prevent triggering the parent's onPress
            handleAddFriend(item.id);
          }}
        >
          <MaterialIcons 
            name={isFriend(item.id) ? "check" : "person-add"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>

      {isSearching ? (
        <ActivityIndicator style={styles.loader} color="rgba(177, 216, 138, 1)" />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery ? "No users found" : "Search for users to add as friends"}
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
  resultsList: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userInfo: {
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
  addButton: {
    backgroundColor: 'rgba(177, 216, 138, 1)',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
}); 