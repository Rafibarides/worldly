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
      <Text style={styles.header}>Profile Settings</Text>
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
    padding: 20,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginVertical: 10,
    alignSelf: 'center',
  },
  label: {
    marginTop: 10,
    fontWeight: '500',
    fontSize: 14,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  updateButton: {
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#00cf75',
    borderRadius: 6,
    alignSelf: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 30,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
}); 