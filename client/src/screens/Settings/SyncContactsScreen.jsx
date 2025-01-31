import { View, Text, StyleSheet } from 'react-native';

export default function SyncContactsScreen() {
  return (
    <View style={styles.container}>
      <Text>Sync Contacts Screen</Text>
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