import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function LogsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <MaterialIcons name="history" size={48} color="#7dbc63" />
        <Text style={styles.title}>Activity Log</Text>
        <Text style={styles.subtitle}>
          Your recent games and challenges will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4f7a3a',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: '#7a7a7a',
    textAlign: 'center',
    marginTop: 8,
  },
});
