import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const SelectionModal = ({ visible, onClose, onSelectOption }) => {
  // Create animated values for each option
  const countriesScale = useSharedValue(1);
  const flagsScale = useSharedValue(1);
  const capitalsScale = useSharedValue(1);

  // Create animated styles for each option
  const countriesAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: countriesScale.value }]
    };
  });

  const flagsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: flagsScale.value }]
    };
  });

  const capitalsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: capitalsScale.value }]
    };
  });

  // Functions to handle press animations
  const handlePressIn = (scaleValue) => {
    scaleValue.value = withSpring(0.95);
  };

  const handlePressOut = (scaleValue) => {
    scaleValue.value = withSpring(1);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Game</Text>
              
              <AnimatedTouchableOpacity
                style={[styles.gameTypeOption, countriesAnimatedStyle]}
                activeOpacity={0.8}
                onPressIn={() => handlePressIn(countriesScale)}
                onPressOut={() => handlePressOut(countriesScale)}
                onPress={() => onSelectOption('countries')}
              >
                <MaterialIcons name="public" size={32} color="#ffc268" />
                <Text style={styles.optionTitle}>Countries</Text>
                <Text style={styles.optionDescription}>Guess country names</Text>
              </AnimatedTouchableOpacity>

              <AnimatedTouchableOpacity
                style={[styles.gameTypeOption, flagsAnimatedStyle]}
                activeOpacity={0.8}
                onPressIn={() => handlePressIn(flagsScale)}
                onPressOut={() => handlePressOut(flagsScale)}
                onPress={() => onSelectOption('flags')}
              >
                <MaterialIcons name="flag" size={32} color="#ffc268" />
                <Text style={styles.optionTitle}>Flags</Text>
                <Text style={styles.optionDescription}>Identify country flags</Text>
              </AnimatedTouchableOpacity>

              <AnimatedTouchableOpacity
                style={[styles.gameTypeOption, capitalsAnimatedStyle]}
                activeOpacity={0.8}
                onPressIn={() => handlePressIn(capitalsScale)}
                onPressOut={() => handlePressOut(capitalsScale)}
                onPress={() => onSelectOption('capitals')}
              >
                <MaterialIcons name="location-city" size={32} color="#ffc268" />
                <Text style={styles.optionTitle}>Capitals</Text>
                <Text style={styles.optionDescription}>Match capitals to countries</Text>
              </AnimatedTouchableOpacity>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
    width: '85%',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  gameTypeOption: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginVertical: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: "#d2d2d2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4f7a3a",
    marginTop: 8,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#4f7a3a",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  closeButtonText: {
    color: '#4f7a3a',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SelectionModal;
