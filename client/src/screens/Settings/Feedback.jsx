import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Linking,
  Platform,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Feedback() {
  const [modalVisible, setModalVisible] = useState(false);

  const openFeedbackForm = () => {
    Linking.openURL('https://forms.gle/PbbJP7TDSL5zc3E88');
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity 
        style={styles.settingOption}
        onPress={() => setModalVisible(true)}
      >
        <MaterialIcons name="feedback" size={24} color="#7bc144" />
        <Text style={styles.settingLabel}>Feedback</Text>
        <MaterialIcons name="arrow-forward-ios" size={18} color="#ccc" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image 
              source={require('../../../assets/images/rafi-avatar.png')} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
            
            <Text style={styles.modalTitle}>Hi there!</Text>
            
            <Text style={styles.modalDescription}>
              My name is Rafi. I built Worldly entirely by myself, and I'm incredibly grateful that you're using my game!
            </Text>
            
            <Text style={styles.modalDescription}>
              Your feedback is extremely valuable to me. Whether you've found a bug, have a feature suggestion, or just want to share your thoughts, I'd love to hear from you.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.feedbackButton}
                onPress={openFeedbackForm}
              >
                <Text style={styles.feedbackButtonText}>Send Feedback</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
  },
  settingLabel: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: Platform.isPad ? '70%' : '90%',
    maxWidth: Platform.isPad ? 400 : 420,
    backgroundColor: '#87c66b',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarImage: {
    width: 95,
    height: 95,
    borderRadius: 45,
    marginBottom: 15,
    objectFit: 'contain',
  },
  modalTitle: {
    fontSize: Platform.isPad ? 20 : 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: Platform.isPad ? 14 : 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: Platform.isPad ? 20 : 22,
  },
  buttonContainer: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  feedbackButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  feedbackButtonText: {
    color: "#87c66b",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
