import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { auth as authApi } from '../../services/api';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from "react-native-reanimated";

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

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const usernameOpacity = useSharedValue(0);
  const usernameTranslateY = useSharedValue(20);
  const emailOpacity = useSharedValue(0);
  const emailTranslateY = useSharedValue(20);
  const passwordOpacity = useSharedValue(0);
  const passwordTranslateY = useSharedValue(20);
  const confirmPasswordOpacity = useSharedValue(0);
  const confirmPasswordTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const linkOpacity = useSharedValue(0);
  const availabilityOpacity = useSharedValue(0);

  // Start animations when component mounts
  useEffect(() => {
    // Logo animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 400 })
    );

    // Staggered animations for form elements
    usernameOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    usernameTranslateY.value = withDelay(300, withSpring(0));
    
    emailOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    emailTranslateY.value = withDelay(450, withSpring(0));
    
    passwordOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    passwordTranslateY.value = withDelay(600, withSpring(0));
    
    confirmPasswordOpacity.value = withDelay(750, withTiming(1, { duration: 500 }));
    confirmPasswordTranslateY.value = withDelay(750, withSpring(0));
    
    buttonOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(900, withSpring(0));
    
    linkOpacity.value = withDelay(1050, withTiming(1, { duration: 500 }));
  }, []);

  // Update availability message animation when it changes
  useEffect(() => {
    if (availabilityMessage) {
      availabilityOpacity.value = withTiming(1, { duration: 300 });
    } else {
      availabilityOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [availabilityMessage]);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  const usernameAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: usernameOpacity.value,
      transform: [{ translateY: usernameTranslateY.value }],
    };
  });

  const emailAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: emailOpacity.value,
      transform: [{ translateY: emailTranslateY.value }],
    };
  });

  const passwordAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: passwordOpacity.value,
      transform: [{ translateY: passwordTranslateY.value }],
    };
  });

  const confirmPasswordAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: confirmPasswordOpacity.value,
      transform: [{ translateY: confirmPasswordTranslateY.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    };
  });

  const linkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: linkOpacity.value,
    };
  });

  const availabilityAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: availabilityOpacity.value,
    };
  });

  // Create animated components
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  // NEW: Check username availability on each text change
  const checkUsernameAvailability = async (rawName) => {
    // Replace spaces with underscores
    const replacedName = rawName.replace(/\s/g, "_");
    setUsername(replacedName);

    // Clear message if empty
    if (!replacedName.trim()) {
      setUsernameAvailable(false);
      setAvailabilityMessage('');
      return;
    }

    try {
      const { available } = await authApi.usernameAvailable(replacedName.trim());
      if (available) {
        setUsernameAvailable(true);
        setAvailabilityMessage('Username is available');
      } else {
        setUsernameAvailable(false);
        setAvailabilityMessage('This username is taken');
      }
    } catch (error) {
      console.error("Error checking username:", error);
      // Set neutral state on error to allow signup attempt
      setUsernameAvailable(true);
      setAvailabilityMessage('');
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required!');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      const user = await authApi.signUp({
        email: email.trim(),
        password,
        username: username.trim(),
      });
      setCurrentUser(user);
    } catch (err) {
      console.error('Error during signup:', err);
      const detail = err.data?.detail || '';
      if (err.status === 409 || err.data?.error === 'username_taken') {
        Alert.alert('Error', 'Sorry, this username is taken!');
      } else if (/email/i.test(detail) && /exist|use|taken/i.test(detail)) {
        Alert.alert('Error', 'This email is already registered. Please use a different email.');
      } else {
        Alert.alert('Error', detail || err.message || 'An error occurred during signup. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../../assets/images/sign-up.png')}
        style={[styles.avatar, logoAnimatedStyle]}
      />
      
      <Animated.View style={[usernameAnimatedStyle, styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#fff"
          value={username}
          onChangeText={checkUsernameAvailability}
          autoCapitalize="none"
        />
      </Animated.View>
      
      {!!availabilityMessage && (
        <Animated.Text 
          style={[
            { color: usernameAvailable ? 'green' : 'red' },
            availabilityAnimatedStyle
          ]}
        >
          {availabilityMessage}
        </Animated.Text>
      )}
      
      <Animated.View style={[emailAnimatedStyle, styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#fff"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
      </Animated.View>
      
      <Animated.View style={[passwordAnimatedStyle, styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#fff"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animated.View>
      
      <Animated.View style={[confirmPasswordAnimatedStyle, styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#fff"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </Animated.View>
      
      <AnimatedTouchableOpacity
        onPress={handleSignup}
        style={[
          styles.button, 
          buttonAnimatedStyle,
          // Add visual feedback for disabled state
          !usernameAvailable && { opacity: 0.5 }
        ]}
        disabled={loading || !usernameAvailable}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Sign Up'}
        </Text>
      </AnimatedTouchableOpacity>
      
      <Animated.View style={linkAnimatedStyle}>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </Animated.View>
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
  inputContainer: {
    width: '80%',
  },
  input: {
    width: '100%',
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