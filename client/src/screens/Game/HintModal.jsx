import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";

const HintModal = ({ visible, onClose, gameType, hintData }) => {
  // Determine what content to show based on game type
  const renderHintContent = () => {
    if (gameType === 'capitals') {
      return (
        <View style={styles.hintContentContainer}>
          <Text style={styles.hintLabel}>This capital is in:</Text>
          <Text style={styles.continentText}>{hintData.continent}</Text>
        </View>
      );
    } else if (gameType === 'flags') {
      return (
        <View style={styles.hintContentContainer}>
          <Text style={styles.hintLabel}>This flag is from a country in:</Text>
          <Text style={styles.continentText}>{hintData.continent}</Text>
          <Image 
            source={{ uri: hintData.flagUrl }}
            style={styles.flagImage}
            resizeMode="contain"
          />
        </View>
      );
    }
    
    return null;
  };
  
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.hintTitle}>Hint</Text>
          
          {renderHintContent()}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#87c66b',
    borderRadius: 20,
    padding: 25,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  hintTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  hintContentContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  hintLabel: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  continentText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  flagImage: {
    width: 100,
    height: 60,
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f7a3a',
  },
});

export default HintModal;
