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

import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
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
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

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
          <Text style={styles.title}>Welcome back!</Text>

          <TextInput
            autoCapitalize="none"
            style={styles.input}
            value={emailAddress}
            placeholder="Enter email"
            placeholderTextColor="#999"
            onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
          />
          <TextInput
            style={styles.input}
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

          <Text style={styles.signInWithText}>Or log in with</Text>

          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleGoogleSignIn}>
              <Image source={require('../../assets/images/google_icon.png')} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleFacebookSignIn}>
              <Image source={require('../../assets/images/facebook_icon.webp')} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Privacy Policy</Text>
          <Text style={styles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}


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
    marginTop: 160, 
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
    marginTop: 30,
    marginBottom: 20,
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
