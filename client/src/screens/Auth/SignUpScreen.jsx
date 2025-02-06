import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, database } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export default function SignUpScreen({ navigation }) {
  const { setCurrentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW: Track whether username is available
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // NEW: Check username availability on each text change
  const checkUsernameAvailability = async (rawName) => {
    // Replace spaces with underscores
    const replacedName = rawName.replace(/\s/g, "_");
    setUsername(replacedName);

    // Then run the normal logic
    const trimmed = replacedName.trim();
    if (!trimmed) {
      // Empty or only underscores
      setUsernameAvailable(false);
      setAvailabilityMessage('');
      return;
    }

    const lowerName = trimmed.toLowerCase();
    const usersRef = collection(database, "users");
    const nameQuery = query(usersRef, where("username_lower", "==", lowerName));
    const snapshot = await getDocs(nameQuery);

    if (!snapshot.empty) {
      setUsernameAvailable(false);
      setAvailabilityMessage('This username is taken');
    } else {
      setUsernameAvailable(true);
      setAvailabilityMessage('Username is available');
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setLoading(false);
      alert('error', 'Error', 'All fields are required!');
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      alert('error', 'Error', 'Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      // Final check: Ensure no one created this username in the meantime
      const usernameLower = username.trim().toLowerCase();
      const usersRef = collection(database, "users");
      const usernameQuery = query(usersRef, where("username_lower", "==", usernameLower));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        setLoading(false);
        alert('error', 'Error', 'Sorry, this username is taken!');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Generate a random seed for the avatar using Dicebear
      const seed = Math.random().toString(36).substring(2, 8);
      const avatarUrl = `https://api.dicebear.com/9.x/avataaars/png?seed=${seed}`;

      // Include the lower-case username in the user data
      const currData = {
        username,
        username_lower: usernameLower,
        email,
        friends: [],
        level: 1,
        stats: { gamesPlayed: 0, gamesWon: 0 },
        avatarUrl, // use the generated Dicebear avatar URL
        uid: user.uid,
        createdAt: Date.now(),
      };

      const userDocRef = doc(database, "users", user.uid);
      await setDoc(userDocRef, currData);
      await AsyncStorage.setItem('user', JSON.stringify(currData));

      setCurrentUser(currData);
      setLoading(false);
    } catch (err) {
      console.error('Error during signup or Firestore operation:', err);
      setLoading(false);
      alert('Error: ' + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../../assets/images/sign-up.png')}
        style={styles.avatar}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#fff"
        value={username}
        onChangeText={checkUsernameAvailability}
        autoCapitalize="none"
      />
      {!!availabilityMessage && (
        <Text style={{ color: usernameAvailable ? 'green' : 'red' }}>
          {availabilityMessage}
        </Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#fff"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        onPress={handleSignup}
        style={styles.button}
        disabled={loading || !usernameAvailable}
      >
        <Text style={styles.buttonText}>
          {!loading ? 'Sign Up' : 'Loading...'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7dbc63',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: '#fff',
  },
  input: {
    width: '80%',
    borderWidth: 0,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginVertical: 5,
    color: '#fff',
    backgroundColor: '#86c56a',
  },
  button: {
    width: '40%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#d2d2d2',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc268',
  },
  linkText: {
    color: '#fff',
    marginTop: 10,
  },
});