import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, database } from '../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export default function SignUpScreen({ navigation }) {
  const { setCurrentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const currData = {
        username,
        email,
        friends: [],
        level: 1,
        stats: { gamesPlayed: 0, gamesWon: 0 },
        avatarUrl: "https://example.com/default-avatar.png", // Default avatar URL
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
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity
        onPress={() => handleSignup()}
        style={styles.button}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {!loading ? 'SignUp' : 'Loading...'}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginVertical: 5
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  buttonText: {
    color: '#fff'
  },
  linkText: {
    color: 'blue',
    marginTop: 10
  },
});