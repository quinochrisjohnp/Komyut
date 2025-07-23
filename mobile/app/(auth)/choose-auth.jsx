import { Link, useRouter } from 'expo-router';
import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import Colors from '../Constant_Design';


const Welcome = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top: Logo */}
        <View style={styles.topSection}>
          <Image
            source={require('../../assets/images/app_logo.png')} // your logo path
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle: Title and Buttons */}
        <View style={styles.middleSection}>
          <Text style={styles.title}>Let’s Get Started!</Text>

          <TouchableOpacity style={styles.signUpBtn} onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/log-in')}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>

        </View>

        {/* Bottom: Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Privacy Policy</Text>
          <Text style={styles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between', // space between top, middle, and bottom
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
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
    color: '#333',
  },
  signUpBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
    marginBottom: 15,
    alignItems: 'center',
  },
  signUpText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    marginBottom: 25,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInWithText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
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
    marginTop: 5,
    borderRadius: 25,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
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
});



