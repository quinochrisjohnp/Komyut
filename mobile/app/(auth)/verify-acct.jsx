import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../Constant_Design';
const Login = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require('../../assets/images/back_icon.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <View style={styles.container}>
        {/* Top: Logo */}
        <View style={styles.topSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle: Inputs & Buttons */}
        <View style={styles.middleSection}>
          <Text style={styles.title}>Verify your Identity</Text>
          <Text style={styles.forgotText}>A code has been sent to your email. Enter the code to verify your identity.</Text>

          <TextInput
            style={styles.input}
            placeholder="Code"
            placeholderTextColor="#999"
          />
          <Text style={styles.forgotText}>Didn’t get the code?</Text>

          <TouchableOpacity style={styles.loginBtn}>
            <Text style={styles.loginText}>Enter Code</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Privacy Policy</Text>
          <Text style={styles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    marginTop: 180, 
  },
  logo: {
    width: 200,
    height: 80,
  },
  middleSection: {
    marginTop: -100,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    fontSize: 14,
    marginBottom: 15,
    marginTop: -20,
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    marginBottom: 25,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotText: {
    fontSize: 14,
    marginBottom: 50,
    color: '#666',
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
});
