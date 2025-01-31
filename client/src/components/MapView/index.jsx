import { View, Text, StyleSheet } from 'react-native';

export default function MapView() {
  return (
    <View style={styles.container}>
      <Text>Map View Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 