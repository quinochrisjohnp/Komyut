import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermsModal from '../../components/TermsModal'; // ✅ Keep this one
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';

const Welcome = () => {
  const router = useRouter();
  const [agreed, setAgreed] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);


  useEffect(() => {
    const checkAgreement = async () => {
      const value = await AsyncStorage.getItem('userAgreed');
      if (value !== 'true') {
        setShowTermsModal(true); // show modal only if user hasn't agreed
      }
      setAgreed(value === 'true');
    };
    checkAgreement();
  }, []);


  if (agreed === null) return null;

  return (
    <SafeAreaView style={authStyles.safeArea}>
      <TermsModal
        visible={showTermsModal}
        onAgreed={() => {
          setShowTermsModal(false);
          setAgreed(true);
        }}
      />
      <View style={authStyles.container}>
        {/* Top: Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle: Title and Buttons */}
        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Let’s Get Started!</Text>

          <TouchableOpacity
            style={styles.signUpBtn}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/log-in')}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom: Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText} onPress={() => setShowPrivacy(true)} >Privacy Policy</Text>
          <Text style={authStyles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
          <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
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
