import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from "react-native-reanimated";

export default function SignInScreen({ navigation }) {
  const { setCurrentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const emailOpacity = useSharedValue(0);
  const emailTranslateY = useSharedValue(20);
  const passwordOpacity = useSharedValue(0);
  const passwordTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(0);
  const linkOpacity = useSharedValue(0);
  const forgotOpacity = useSharedValue(0);
  const forgotTranslateY = useSharedValue(20);

  // Start animations when component mounts
  useEffect(() => {
    // Logo animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 600 }),
      withTiming(1, { duration: 400 })
    );

    // Staggered animations for form elements
    emailOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    emailTranslateY.value = withDelay(400, withSpring(0));
    
    passwordOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    passwordTranslateY.value = withDelay(600, withSpring(0));
    
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(800, withSpring(0));
    
    linkOpacity.value = withDelay(1000, withTiming(1, { duration: 500 }));
    
    forgotOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
    forgotTranslateY.value = withDelay(800, withSpring(0));
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
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

  const forgotAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: forgotOpacity.value,
      transform: [{ translateY: forgotTranslateY.value }],
    };
  });

  // Create animated components
  const AnimatedView = Animated.createAnimatedComponent(View);
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('error', 'Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(database, "users", user.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (!userSnapshot.exists()) {
        throw new Error("User data not found in Firestore");
      }

      const userData = userSnapshot.data();
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setCurrentUser(userData);

      setLoading(false);
    } catch (err) {
      console.error('Login Error:', err);
      setLoading(false);
      showToast('error', 'Login Failed', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../../assets/images/sign-in.png')} 
        style={[styles.avatar, logoAnimatedStyle]} 
      />
      
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
      
      <AnimatedTouchableOpacity 
        onPress={handleLogin} 
        style={[styles.button, buttonAnimatedStyle]} 
        disabled={loading}
      >
        <Text style={styles.buttonText}>{!loading ? 'Login' : 'Loading..'}</Text>
      </AnimatedTouchableOpacity>
      
      <Animated.View style={linkAnimatedStyle}>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.View style={forgotAnimatedStyle}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotPasswordContainer}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
    textAlign: 'center'
  },
  forgotPasswordContainer: {
    alignSelf: 'center',
    marginTop: 5,
    marginBottom: 15,
  },
  forgotPasswordText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center'
  },
});
