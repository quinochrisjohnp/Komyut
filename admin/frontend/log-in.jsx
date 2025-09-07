import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Colors from '../Constant_Design';
import authStyles from './auth-styles';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';
import { useLoading } from "../../components/LoadingContext";

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setLoading } = useLoading();

  const [showPassword, setShowPassword] = useState(false);

  // --------> validation helper
  const isValidLength = (text) => text.length >= 6 && text.length <= 15;
  const hasNoSpaces = (text) => !/\s/.test(text);

  // --------> handle input change with space restriction
  const handleIdentifierChange = (text) => {
    if (/\s/.test(text)) {
      setError("Spaces are not allowed in email/username.");
      return;
    }
    setError('');
    setIdentifier(text);
  };

  const handlePasswordChange = (text) => {
    if (/\s/.test(text)) {
      setError("Spaces are not allowed in password.");
      return;
    }
    setError('');
    setPassword(text);
  };

  // --------> login handler with validation
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!isValidLength(identifier) || !isValidLength(password)) {
      setError("Both email/username and password must be 6–15 characters.");
      return;
    }
    if (!hasNoSpaces(identifier) || !hasNoSpaces(password)) {
      setError("Spaces are not allowed in email/username or password.");
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: identifier,
        password,
      });
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/(root)');
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    }
  };

  const { startOAuthFlow: googleAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: facebookAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const handleGoogleSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await googleAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
    }
  };

  const handleFacebookSignIn = async () => {
    try {
      const { createdSessionId, setActive } = await facebookAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Facebook sign-in error:', err);
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
        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Welcome back!</Text>

          {/* identifier input */}
          <View style={styles.inputWrapper}>
            <TextInput
              autoCapitalize="none"
              style={[authStyles.input, { paddingRight: 40 }]}
              value={identifier}
              placeholder="Enter email or username"
              placeholderTextColor="#999"
              onChangeText={handleIdentifierChange}
              maxLength={15}
            />
            {identifier.length > 0 && (
              <TouchableOpacity onPress={() => setIdentifier('')} style={styles.singleClearBtn}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* password input */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[authStyles.input, { paddingRight: 80 }]}
              value={password}
              placeholder="Enter password"
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
              onChangeText={handlePasswordChange}
              maxLength={15}
            />
            <View style={styles.iconRow}>
              {password.length > 0 && (
                <TouchableOpacity onPress={() => setPassword('')}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/reset-pass')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={onSignInPress}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>

          {error !== '' && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Text style={styles.signInWithText}>Or log in with</Text>

          <View style={authStyles.iconRow}>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleGoogleSignIn}>
              <Image source={require('../../assets/images/google_icon.png')} style={authStyles.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleFacebookSignIn}>
              <Image source={require('../../assets/images/facebook_icon.webp')} style={authStyles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 20,
    color: '#333',
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
    fontSize: 18,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 25,
  },
  forgotText: {
    fontSize: 13,
    color: '#666',
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
  signInWithText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
  },
});