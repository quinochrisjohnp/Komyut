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
import authStyles from './auth-styles';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [firstName, setFirstname] = useState('')
  const [lastName, setLastname] = useState('') //New
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
        firstName,
        lastName,
        emailAddress,
        password,
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
        <SafeAreaView style={authStyles.safeArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
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
              <Text style={styles.verifyTitle}>Verify your Identity</Text>
              <Text style={styles.verifyText}>A code has been sent to your email. Enter the code to verify your identity.</Text>

              <TextInput
                style={authStyles.input}
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
            <View style={authStyles.footer}>
              <Text style={authStyles.footerText}>Privacy Policy</Text>
              <Text style={authStyles.footerText}>Terms of Service</Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <SafeAreaView style={authStyles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={authStyles.backBtn}>
        <Image
          source={require('../../assets/images/back_icon.png')}
          style={authStyles.backIcon}
        />
      </TouchableOpacity>
      <View style={authStyles.container}>
        {/* Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Form Section */}
        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            style={authStyles.input}
            placeholder="First Name"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={firstName}
            onChangeText={(text) => setFirstname(text)}
          />

          <TextInput 
          style={authStyles.input}
          placeholder="Last Name"
          placeholderTextColor="#666"
          autoCapitalize="none"
          value={lastName}
          onChangeText={text => setLastname(text)}/>

          <TextInput
            style={authStyles.input}
            placeholder="Enter email"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={emailAddress}
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            style={authStyles.input}
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

          <View style={authStyles.iconRow}>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleGoogleSignUp}>
              <Image
                source={require('../../assets/images/google_icon.png')}
                style={authStyles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleFacebookSignUp}> 
              <Image
                source={require('../../assets/images/facebook_icon.webp')}
                style={authStyles.icon}
                resizeMode="contain"
              />
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
});
