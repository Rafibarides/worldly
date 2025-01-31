import { View, Text, StyleSheet } from 'react-native';

export default function Loser() {
  return (
    <View style={styles.container}>
      <Text>Loser Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
}); 