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
import authStyles from './auth-styles';
import Colors from '../Constant_Design';


const Welcome = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={authStyles.safeArea}>
      <View style={authStyles.container}>
        {/* Top: Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')} // your logo path
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle: Title and Buttons */}
        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Let’s Get Started!</Text>

          <TouchableOpacity style={styles.signUpBtn} onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/log-in')}>
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>

        </View>

        {/* Bottom: Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>Privacy Policy</Text>
          <Text style={authStyles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
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