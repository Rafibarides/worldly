import { View, Text, StyleSheet } from 'react-native';

export default function Winner() {
  return (
    <View style={styles.container}>
      <Text>Winner Component</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
}); 