// GlobalStyles.js
import { StyleSheet } from 'react-native';
import Colors from '../Constant_Design'; // if you have a color system

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
});

export default mainStyles;
