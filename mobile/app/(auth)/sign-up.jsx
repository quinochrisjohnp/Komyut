import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import Colors from '../Constant_Design';

import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [username, setUsername] = useState('') //New
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
        username,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/(root)') //* new add 7/21/2025 11:46am
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: facebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const handleGoogleSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await googleOAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await facebookOAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Facebook OAuth error:', err);
    }
  };

  if (pendingVerification) {
    return (
      <>
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Image
              source={require('../../assets/images/back_icon.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
          <View style={styles.container}>
            {/* Top: Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/images/app_logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Middle: Inputs & Buttons */}
            <View style={styles.formContainer}>
              <Text style={styles.verifyTitle}>Verify your Identity</Text>
              <Text style={styles.verifyText}>A code has been sent to your email. Enter the code to verify your identity.</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter code"
                placeholderTextColor="#999"
                value={code}
                onChangeText={(code) => setCode(code)}
              />
              <Text style={styles.verifyText}>Didn’t get the code?</Text>

              <TouchableOpacity style={styles.signUpBtn} onPress={onVerifyPress}>
                <Text style={styles.signUpText}>Enter Code</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Privacy Policy</Text>
              <Text style={styles.footerText}>Terms of Service</Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require('../../assets/images/back_icon.png')}
          style={styles.backIcon}
        />
      </TouchableOpacity>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={username}
            onChangeText={(text) => setUsername(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={emailAddress}
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#666"
            value={password}
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />

          <TouchableOpacity style={styles.signUpBtn} onPress={onSignUpPress}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={styles.altText}>Or sign up with</Text>

          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleGoogleSignUp}>
              <Image
                source={require('../../assets/images/google_icon.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleFacebookSignUp}> 
              <Image
                source={require('../../assets/images/facebook_icon.webp')}
                style={styles.icon}
                resizeMode="contain"
              />
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
  logoContainer: {
    alignItems: 'center',
    marginTop: 160,
  },
  logo: {
    width: 200,
    height: 80,
  },
  formContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 30,
    color: '#333',
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -20,
    marginBottom: 25,
    color: '#333',
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
    backgroundColor: Colors.secondary,
    fontSize: 14,
    color: '#333',
  },
  signUpBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    marginBottom: 25,
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  altText: {
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
  verifyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -20,
    marginBottom: 25,
    color: '#333',
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
