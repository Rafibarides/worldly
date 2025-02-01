import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden', // Ensure map stays within bounds
  },
  map: {
    width: '100%',
    height: '100%',
  },
}); 