import { View, Text, StyleSheet } from 'react-native';

export default function Tie() {
  return (
    <View style={styles.container}>
      <Text>Tie Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
}); 