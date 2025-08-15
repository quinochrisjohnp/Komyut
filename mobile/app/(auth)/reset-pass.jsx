import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import authStyles from './auth-styles';
import Colors from '../Constant_Design';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [error, setError] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const sendResetCode = async () => {
    if (!isLoaded) return;

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setSuccessfulCreation(true);
      setError('');
    } catch (err) {
      setError(err.errors[0]?.longMessage || 'Failed to send code.');
    }
  };

  const resetPassword = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(root)');
      } else {
        setError('Unexpected status. Try again.');
      }
    } catch (err) {
      setError(err.errors[0]?.longMessage || 'Failed to reset password.');
    }
  };

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
        {error ? <Text style={styles.error}>{error}</Text> : null}
      {!successfulCreation ? (
        <>
          <TextInput
            style={authStyles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.loginBtn} onPress={sendResetCode}>
            <Text style={styles.loginText}>Send Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={authStyles.input}
            placeholder="Enter verification code"
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={authStyles.input}
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity style={styles.loginBtn} onPress={resetPassword}>
            <Text style={styles.loginText}>Reset Password</Text>
          </TouchableOpacity>
        </>
      )}
      
      </View>
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText} onPress={() => setShowPrivacy(true)} >Privacy Policy</Text>
          <Text style={authStyles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
          <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
        </View>
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  middleSection: {
    marginTop: -100,
    alignItems: 'center',
  },
  error: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 20,
    color: '#333',
  },
  loginBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    marginBottom: 25,
    marginTop: 50,
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
  forgotText: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
    alignItems: 'center',
  },
});
