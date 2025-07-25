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
import authStyles from './auth-styles';
import Colors from '../Constant_Design';
const Login = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={authStyles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={authStyles.backBtn}>
        <Image
          source={require('../../assets/images/back_icon.png')}
          style={authStyles.backIcon}
        />
      </TouchableOpacity>
      <View style={authStyles.container}>
        {/* Top: Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle: Inputs & Buttons */}
        <View style={styles.middleSection}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.forgotText}>Forgot your password? No worries!</Text>

          <TextInput
            style={authStyles.input}
            placeholder="Email"
            placeholderTextColor="#999"
          />
          <Text style={styles.forgotText}>A password reset link will be sent to your registered email address.</Text>

          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/verify-acct')}>
            <Text style={styles.loginText}>Reset Password</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>Privacy Policy</Text>
          <Text style={authStyles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
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
});
