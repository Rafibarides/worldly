import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Linking, Switch, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';
import { useAudio } from '../../contexts/AudioContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { database, auth } from '../../services/firebase';
import Feedback from './Feedback';

export default function ProfileSettingsScreen({ navigation }) {
  const { currentUser, logout } = useAuth();
  const { musicEnabled, toggleMusic } = useAudio();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

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

  const handleOpenAboutWebsite = async () => {
    const url = 'https://playworldly.com';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open the link: " + url);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete user document from Firestore
      await deleteDoc(doc(database, "users", currentUser.uid));
      
      // Delete Firebase Auth user
      await deleteUser(auth.currentUser);
      
      // Logout will be handled automatically by the auth state change listener
      Alert.alert("Account Deleted", "Your account has been permanently deleted.");
    } catch (error) {
      Alert.alert("Account Deletion Error", error.message);
    }
  };

  const showDeleteAccountConfirmation = () => {
    Alert.alert(
      "Delete Account",
      "WARNING: This action cannot be undone. Deleting your account will permanently erase all your stats, records, profile images, and all data associated with your account from our system forever.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Show second confirmation dialog
            Alert.alert(
              "Confirm Deletion",
              "Are you absolutely sure you want to delete your account? This action CANNOT be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Yes, Delete My Account",
                  style: "destructive",
                  onPress: handleDeleteAccount
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Settings</Text>
      
      {/* Password section */}
      <Text style={styles.sectionHeader}>Password</Text>
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

      <TouchableOpacity 
        style={styles.updateButton}
        onPress={handleUpdatePassword}
      >
        <Text style={styles.updateButtonText}>Update Password</Text>
      </TouchableOpacity>

      {/* Sound settings section */}
      <Text style={styles.sectionHeader}>Sound Settings</Text>
      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <MaterialIcons name="music-note" size={24} color="#7dbc63" />
          <Text style={styles.settingText}>Background Music</Text>
        </View>
        <Switch
          trackColor={{ false: "#767577", true: "#7dbc63" }}
          thumbColor={musicEnabled ? "#fdc15f" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleMusic}
          value={musicEnabled}
        />
      </View>

      {/* About section */}
      <Text style={styles.sectionHeader}>About</Text>
      <TouchableOpacity style={styles.settingItem} onPress={handleOpenAboutWebsite}>
        <View style={styles.settingContent}>
          <MaterialIcons name="info" size={24} color="#7dbc63" />
          <Text style={styles.settingText}>About Worldly</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#999" />
      </TouchableOpacity>

      {/* Delete Account section */}
      <Text style={styles.sectionHeader}>Account</Text>
      <TouchableOpacity style={styles.settingItem} onPress={showDeleteAccountConfirmation}>
        <View style={styles.settingContent}>
          <MaterialIcons name="delete-forever" size={24} color="#ff6b6b" />
          <Text style={[styles.settingText, { color: '#ff6b6b' }]}>Delete Account</Text>
        </View>
      </TouchableOpacity>

      {/* Sign out button */}
      <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
        <View style={styles.settingContent}>
          <MaterialIcons name="logout" size={24} color="#ff6b6b" />
          <Text style={[styles.settingText, { color: '#ff6b6b' }]}>Sign Out</Text>
        </View>
      </TouchableOpacity>
      
      <Feedback />
      
      {/* Add some bottom padding to ensure everything is visible */}
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 40,
    paddingBottom: 80, // Extra padding at the bottom
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 30,
    marginBottom: 10,
  },
  bottomPadding: {
    height: 40, // Extra space at the bottom
  },
}); 