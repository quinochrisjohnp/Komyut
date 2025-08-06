import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
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
import Colors from '../Constant_Design';
import authStyles from './auth-styles';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [identifier, setIdentifier] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('');

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: identifier,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/(root)') // new add 7/21/2025 11:41am
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
      //for password or gmail error
    } catch (err) {
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Invalid email or password. Please try again.");
      } else {
        setError("Invalid email or password. Please try again.");
      }
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

          <TextInput
            autoCapitalize="none"
            style={authStyles.input}
            value={identifier}
            placeholder="Enter email or username"
            placeholderTextColor="#999"
            onChangeText={(identifier) => setIdentifier(identifier)}//for email or username
          />
          <TextInput
            style={authStyles.input}
            value={password}
            placeholder="Enter password"
            secureTextEntry={true}
            placeholderTextColor="#999"
            onChangeText={(password) => setPassword(password)}
          />
          
          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forget-pass')}>
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
          <Text style={authStyles.footerText}>Privacy Policy</Text>
          <Text style={authStyles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 20,
    color: '#333',
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