import { View, Text, StyleSheet } from 'react-native';

export default function GameSummaryScreen() {
  return (
    <View style={styles.container}>
      <Text>Game Summary Screen</Text>
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