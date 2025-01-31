import { View, Text, StyleSheet } from 'react-native';

export default function GamePlayScreen() {
  return (
    <View style={styles.container}>
      <Text>Game Play Screen</Text>
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