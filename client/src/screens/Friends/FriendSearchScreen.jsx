import { View, Text, StyleSheet } from 'react-native';

export default function FriendSearchScreen() {
  return (
    <View style={styles.container}>
      <Text>Friend Search Screen</Text>
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