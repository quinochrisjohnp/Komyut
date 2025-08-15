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
    marginTop: 160,
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
  iconRow: {
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
});

export default authStyles;
