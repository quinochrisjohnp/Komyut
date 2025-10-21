// GlobalStyles.js
import Colors from '../Constant_Design'; // if you have a color system
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';

const authStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between', // space between top, middle, and bottom
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 150,
  },
  logo: {
    width: 200,
    height: 80,
  },
  middleSection: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'underline',
  },
  signRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  iconBtn: {
    width: 50,
    height: 50,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 0,
    padding: 10,
    zIndex: 1,
  },
  backIcon: {
    width: 20,
    height: 20,
  },

  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.lighter,
    borderRadius: 30,
    fontSize: 14,
    marginBottom: 15,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  singleClearBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -23 }],
    padding: 5,
  },
  iconRow: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    right: 14,
    top: '50%',
    transform: [{ translateY: -20 }],
    gap: 10,
  },
  clearIcon: {
    fontSize: 16,
    color: '#666',
    marginRight: 7,
  },
  eyeIcon: {
  width: 25,
  height: 25,
  marginRight: 5,
 }
});

export default authStyles;
