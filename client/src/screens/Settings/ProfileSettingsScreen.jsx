import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileSettingsScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Error", "Please fill in both current and new password");
      return;
    }
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      Alert.alert("Success", "Password updated successfully");
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert("Password Update Error", error.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Sign Out Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>
      <Text style={styles.label}>Current Password</Text>
      <TextInput 
        style={styles.input} 
        secureTextEntry 
        placeholder="Enter current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput 
        style={styles.input} 
        secureTextEntry 
        placeholder="Enter new password" 
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <TouchableOpacity style={styles.updateButton} onPress={handleUpdatePassword}>
        <Text style={styles.updateButtonText}>Update Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.updateButton, { backgroundColor: 'red', marginTop: 15 }]} onPress={handleSignOut}>
        <Text style={styles.updateButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.settingItem}
        onPress={() => navigation.navigate('About')}
      >
        <View style={styles.settingContent}>
          <MaterialIcons name="info" size={24} color="#666" />
          <Text style={styles.settingText}>About Worldly</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 20,
    alignSelf: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#7dbc63',
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  updateButton: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#7dbc63',
    borderRadius: 30,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 30,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
  },
}); 