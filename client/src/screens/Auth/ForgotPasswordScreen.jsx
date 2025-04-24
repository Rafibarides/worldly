import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from "react-native-reanimated";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const emailOpacity = useSharedValue(0);
  const emailTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const linkOpacity = useSharedValue(0);
  
  // Start animations when component mounts
  useEffect(() => {
    // Logo animation
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 600 });
    
    // Staggered animations for form elements
    emailOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    emailTranslateY.value = withDelay(300, withSpring(0));
    
    buttonOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    buttonTranslateY.value = withDelay(450, withSpring(0));
    
    linkOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
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
  
  // Create animated components
  const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
  
  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
    } catch (error) {
      setLoading(false);
      console.error('Error sending password reset email:', error);
      
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No account exists with this email address');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Error', 'Please enter a valid email address');
      } else {
        Alert.alert('Error', error.message || 'Failed to send password reset email');
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <Animated.Image 
        source={require('../../../assets/images/sign-up.png')}
        style={[styles.avatar, logoAnimatedStyle]}
      />
      
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.instructions}>
        Enter your email address and we'll send you instructions to reset your password.
      </Text>
      
      <Animated.View style={[emailAnimatedStyle, styles.inputContainer]}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#fff"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </Animated.View>
      
      <AnimatedTouchableOpacity
        onPress={handleResetPassword}
        style={[styles.button, buttonAnimatedStyle]}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Sending...' : 'Reset Password'}
        </Text>
      </AnimatedTouchableOpacity>
      
      <Animated.View style={linkAnimatedStyle}>
        <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.linkText}>Back to Sign In</Text>
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
    marginBottom: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    width: '100%',
    borderWidth: 0,
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    color: '#fff',
    backgroundColor: '#86c56a',
  },
  button: {
    width: '60%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 20,
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